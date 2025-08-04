#!/bin/bash
# GitHub PR automation with Copilot integration for Foreman UI
# Usage: ./scripts/pr-automation.sh [action] [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# File extension pattern for safe git operations (readonly to prevent modification)
readonly FILE_EXTENSION_PATTERN='\.(ts|tsx|js|jsx|json|md|sh|yml|yaml)$'

# Validate the file extension pattern to prevent regex injection
validate_file_extension_pattern() {
    # Basic validation: ensure pattern contains only expected characters
    if [[ ! "$FILE_EXTENSION_PATTERN" =~ ^\\\.[^\$]*\$$ ]]; then
        error "Invalid FILE_EXTENSION_PATTERN: must start with \\. and end with \$"
    fi
    
    # Ensure pattern doesn't contain dangerous regex metacharacters
    if [[ "$FILE_EXTENSION_PATTERN" =~ [\;\|\&\`\\\$\(\)] ]]; then
        error "FILE_EXTENSION_PATTERN contains potentially dangerous characters"
    fi
}

# Validate pattern on script startup
validate_file_extension_pattern

# Create secure temporary file
create_temp_file() {
    local prefix="${1:-claude-automation}"
    local suffix="${2:-.log}"
    
    if command -v mktemp >/dev/null 2>&1; then
        mktemp "${TMPDIR:-/tmp}/${prefix}-XXXXXXXXXX${suffix}"
    else
        # Fallback for systems without mktemp
        local temp_file="${TMPDIR:-/tmp}/${prefix}-$$-$(date +%s)${suffix}"
        touch "$temp_file"
        chmod 600 "$temp_file"
        echo "$temp_file"
    fi
}

# Security token for AUTO_FIX_DEPS in CI environments
# 
# SECURITY NOTICE: This implements a two-factor authentication system for automated dependency fixes:
# 1. AUTO_FIX_DEPS=true (enables the feature)
# 2. AUTO_FIX_DEPS_TOKEN must match EXPECTED_AUTO_FIX_TOKEN (provides authentication)
#
# CONFIGURATION:
# - Set EXPECTED_AUTO_FIX_TOKEN to a cryptographically secure random token (32+ characters)
# - In CI environments, set AUTO_FIX_DEPS_TOKEN to the same value as a secret
# - The comparison uses SHA-256 hashing to prevent timing attacks
#
# SECURITY IMPLICATIONS:
# - Without proper token configuration, dependency fixes require manual approval
# - Tokens should be unique per repository/environment
# - Never log or expose these tokens in build outputs
# - Rotate tokens periodically for security
#
# EXAMPLE SECURE TOKEN GENERATION:
# openssl rand -hex 32  # Generates a 64-character hex token
# 
# The default is intentionally empty to require explicit configuration
readonly EXPECTED_AUTO_FIX_TOKEN="${EXPECTED_AUTO_FIX_TOKEN:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

copilot() {
    echo -e "${PURPLE}[COPILOT] $1${NC}"
}

# Constant-time token comparison to prevent timing attacks
constant_time_token_compare() {
    local token1="$1"
    local token2="$2"
    
    # Use SHA-256 hashes for constant-time comparison
    # This prevents timing attacks by ensuring comparison time is independent of input
    if command -v sha256sum >/dev/null 2>&1; then
        local hash1=$(printf '%s' "$token1" | sha256sum | cut -d' ' -f1)
        local hash2=$(printf '%s' "$token2" | sha256sum | cut -d' ' -f1)
    elif command -v openssl >/dev/null 2>&1; then
        local hash1=$(printf '%s' "$token1" | openssl dgst -sha256 | cut -d' ' -f2)
        local hash2=$(printf '%s' "$token2" | openssl dgst -sha256 | cut -d' ' -f2)
    else
        # Fallback: still vulnerable to timing attacks, but better than nothing
        warn "No SHA-256 utility available - token comparison may be vulnerable to timing attacks"
        [ "$token1" = "$token2" ]
        return $?
    fi
    
    # Compare hashes (still technically vulnerable but much more difficult to exploit)
    [ "$hash1" = "$hash2" ]
}

# Get ISO8601 timestamp for 5 minutes ago with cross-platform compatibility
get_five_minutes_ago_iso8601() {
    local last_comment_check="$1"
    local five_minutes_ago=""
    
    if five_minutes_ago=$(date -d '5 minutes ago' --iso-8601 2>/dev/null); then
        # GNU date (Linux)
        echo "$five_minutes_ago"
    elif five_minutes_ago=$(date -u -v-5M +%Y-%m-%dT%H:%M:%S 2>/dev/null); then
        # BSD date (macOS) - append Z for UTC
        echo "${five_minutes_ago}Z"
    else
        # Fallback: use last_comment_check timestamp or skip filtering
        if [ -n "$last_comment_check" ]; then
            date -u -d "@$((last_comment_check - 300))" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "1970-01-01T00:00:00Z"
        else
            echo "1970-01-01T00:00:00Z"  # Process all comments if no reliable timestamp
        fi
    fi
}

# Safely add files with specific extensions, avoiding sensitive files
add_safe_files() {
    # Use git ls-files to get explicit file paths rather than glob patterns
    local files_to_add
    files_to_add=$(git ls-files -m -o --exclude-standard | grep -E "$FILE_EXTENSION_PATTERN" 2>/dev/null)
    
    if [ -n "$files_to_add" ]; then
        echo "$files_to_add" | xargs git add 2>/dev/null && info "Added standard file types"
    else
        warn "No standard file types found to stage - checking for any modified tracked files"
        if git add -u 2>/dev/null; then
            info "Added modified tracked files"
        else
            warn "No modified tracked files to stage"
            return 1
        fi
    fi
}

# Check if gh CLI is installed and authenticated
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        error "GitHub CLI (gh) not found. Please install it: https://cli.github.com/"
    fi
    
    if ! gh auth status &> /dev/null; then
        error "GitHub CLI not authenticated. Please run: gh auth login"
    fi
}

# Validate project before PR
validate_for_pr() {
    local workspace_dir="${1:-$(pwd)}"
    
    log "Validating project for PR submission..."
    cd "$workspace_dir"
    
    info "Running linter..."
    if ! yarn lint; then
        error "Linting failed. Please fix errors before creating PR."
    fi
    
    info "Running TypeScript compilation..."
    if ! yarn build; then
        error "Build failed. Please fix compilation errors before creating PR."
    fi
    
    info "Running tests..."
    if ! yarn test; then
        error "Tests failed. Please fix failing tests before creating PR."
    fi
    
    log "✅ All validation checks passed!"
}

# Generate AI-powered PR description
generate_pr_description() {
    local branch_name="$1"
    local base_branch="${2:-main}"
    
    info "Generating PR description..."
    
    # Get commit messages since branching
    local commit_messages=$(git log "$base_branch..HEAD" --pretty=format:"- %s" | head -10)
    local files_changed=$(git diff --name-only "$base_branch..HEAD" | head -20)
    local stats=$(git diff --stat "$base_branch..HEAD")
    
    # Generate description
    cat << EOF
## Summary

This PR includes the following changes from branch \`$branch_name\`:

### Changes Made
$commit_messages

### Files Modified
\`\`\`
$files_changed
\`\`\`

### Statistics
\`\`\`
$stats
\`\`\`

### Test Plan
- [ ] All existing tests pass
- [ ] New functionality is tested
- [ ] Linting and TypeScript compilation successful
- [ ] Manual testing performed

### Notes
Please review the changes and provide feedback. This PR was created using automated tooling.

🤖 Generated with Claude Code automation
EOF
}

# Submit PR and request Copilot review
submit_pr() {
    local workspace_dir="${1:-$(pwd)}"
    local base_branch="${2:-main}"
    local draft="${3:-false}"
    
    cd "$workspace_dir"
    check_gh_cli
    
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "$base_branch" ]; then
        error "Cannot create PR from $base_branch branch"
    fi
    
    log "Preparing to submit PR for branch: $current_branch"
    
    # Validate project first
    validate_for_pr "$workspace_dir"
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warn "You have uncommitted changes. Committing them..."
        # Only add specific file types to avoid accidentally committing sensitive files
        add_safe_files
        git commit -F- <<'EOF'
Final changes before PR submission

🤖 Generated with Claude Code automation

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
    fi
    
    # Push branch to remote
    info "Pushing branch to remote..."
    git push -u origin "$current_branch"
    
    # Generate PR description
    local pr_description=$(generate_pr_description "$current_branch" "$base_branch")
    
    # Show PR preview to user
    echo ""
    echo "==================== PR PREVIEW ===================="
    echo "Title: $current_branch"
    echo "Base: $base_branch <- $current_branch"
    echo ""
    echo "$pr_description"
    echo "===================================================="
    echo ""
    
    # Ask for user confirmation
    if [ "$draft" = "false" ]; then
        read -p "Do you want to create this PR? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warn "PR creation cancelled by user"
            return 1
        fi
    fi
    
    # Sanitize branch name for PR title to prevent injection attacks
    # Use parameter expansion for more robust sanitization
    local sanitized_title="$current_branch"
    
    # Remove any leading/trailing whitespace
    sanitized_title="${sanitized_title#"${sanitized_title%%[![:space:]]*}"}"
    sanitized_title="${sanitized_title%"${sanitized_title##*[![:space:]]}"}"
    
    # Replace forward slashes with hyphens
    sanitized_title="${sanitized_title//\//-}"
    
    # Remove all characters except alphanumeric, underscore, hyphen, and space
    sanitized_title=$(printf '%s\n' "$sanitized_title" | LC_ALL=C sed 's/[^a-zA-Z0-9 _-]//g')
    
    # Truncate to reasonable length (GitHub PR title limit is 256, we use 100 for safety)
    sanitized_title="${sanitized_title:0:100}"
    
    # Ensure we always have a valid title even if sanitization removes everything
    if [ -z "$sanitized_title" ] || [ "${#sanitized_title}" -lt 3 ]; then
        sanitized_title="Automated PR from $(date +%Y-%m-%d)"
        warn "Branch name sanitization resulted in empty/short title, using fallback: $sanitized_title"
    fi
    
    # Build PR creation arguments as an array for safety
    local pr_args=(--title "$sanitized_title" --body "$pr_description" --base "$base_branch" --assignee "@me")
    if [ "$draft" = "true" ]; then
        pr_args+=(--draft)
    fi
    
    info "Creating PR..."
    local pr_url=$(gh pr create "${pr_args[@]}")
    
    if [ $? -eq 0 ]; then
        log "✅ PR created successfully: $pr_url"
        
        # Extract PR number from URL
        local pr_number=$(echo "$pr_url" | grep -o '[0-9]\+$')
        
        # Validate extracted PR number
        validate_pr_number "$pr_number"
        
        # Request Copilot review
        request_copilot_review "$pr_number" "$workspace_dir"
        
        # Monitor CI and handle issues
        monitor_pr_ci "$pr_number" "$workspace_dir"
        
        echo "$pr_url"
    else
        warn "Failed to create PR - please check GitHub CLI authentication and repository permissions"
        return 1
    fi
}

# Request GitHub Copilot review
request_copilot_review() {
    local pr_number="$1"
    local workspace_dir="$2"
    
    validate_pr_number "$pr_number"
    
    copilot "Setting up GitHub Copilot review integration for PR #$pr_number..."
    
    # Add comprehensive status and instruction comment
    local status_comment="## 🤖 Automation Status & Next Steps

✅ **PR Created Successfully**: $(gh pr view "$pr_number" --json url --jq '.url')
✅ **Code Validation Passed**: All tests, linting, and build checks completed
✅ **CI Monitoring Active**: Will auto-fix common issues as they arise

### 📋 Manual Step Required: GitHub Copilot Review

**To request automated code review:**
1. 👆 **Click the \"Copilot\" button** in the reviewers section above
2. 🔍 **Copilot will analyze** the code for quality, security, and best practices
3. 💬 **Review feedback** will appear as PR comments when ready

### 🎯 Recommended Review Focus Areas

**For this PR, please pay attention to:**
- 🔒 **Shell script security** and input validation
- 🏗️ **Code organization** and maintainability
- 📚 **Documentation clarity** and completeness
- 🔗 **Integration safety** with existing workflows
- ⚡ **Performance implications** of automation scripts

### 🔄 Continuous Monitoring

This automation will continue to:
- Monitor CI status and auto-fix common failures
- Track review feedback and suggest responses
- Provide status updates as the PR progresses

🤖 **Claude Code Automation System** - Monitoring PR lifecycle"
    
    if gh pr comment "$pr_number" --body "$status_comment"; then
        copilot "✅ Status update and Copilot instructions added to PR #$pr_number"
    else
        warn "Failed to add status comment"
    fi
    
    # Add labels for automation tracking
    info "Adding automation labels..."
    gh pr edit "$pr_number" --add-label "automation" --add-label "claude-code" 2>/dev/null || warn "Could not add labels"
    
    # Output user guidance
    echo ""
    echo "${PURPLE}[MANUAL STEP REQUIRED]${NC}"
    echo "Please visit the PR and click 'Copilot' in the reviewers section:"
    echo "  $(gh pr view "$pr_number" --json url --jq '.url')"
    echo ""
}

# Monitor CI status and handle failures
monitor_pr_ci() {
    local pr_number="$1"
    local workspace_dir="$2"
    local max_wait=1800  # 30 minutes
    local wait_interval=30
    local waited=0
    
    validate_pr_number "$pr_number"
    
    info "Monitoring CI status for PR #$pr_number..."
    
    # Wait for all CI checks to complete using GitHub CLI's built-in wait functionality
    if ! gh pr checks "$pr_number" --watch; then
        warn "CI failures detected for PR #$pr_number"
        handle_ci_failures "$pr_number" "$workspace_dir"
    else
        log "✅ All CI checks passed for PR #$pr_number"
    fi
}

# Handle CI failures automatically
handle_ci_failures() {
    local pr_number="$1"
    local workspace_dir="$2"
    
    validate_pr_number "$pr_number"
    
    warn "Handling CI failures for PR #$pr_number..."
    cd "$workspace_dir"
    
    # Get CI failure details
    local failures
    failures=$(gh pr checks "$pr_number" --json name,conclusion,detailsUrl --jq '.[] | select(.conclusion=="failure" or .conclusion=="error") | "\(.name): \(.detailsUrl)"')
    local gh_status=$?
    
    if [ $gh_status -ne 0 ]; then
        warn "Failed to retrieve CI check results for PR #$pr_number"
        failures=""
    fi
    
    if [ -n "$failures" ]; then
        warn "CI Failures detected:"
        echo "$failures"
        
        # Add comment with failure summary
        local failure_comment="🚨 **CI Failures Detected**

The following checks failed:
\`\`\`
$failures
\`\`\`

@github-actions[bot] Please analyze these failures and suggest fixes.

🤖 Automated CI monitoring from Claude Code"
        
        gh pr comment "$pr_number" --body "$failure_comment"
        
        # Try to auto-fix common issues
        auto_fix_common_issues "$workspace_dir" "$pr_number"
    fi
}

# Validate dependency fix approval with enhanced security
validate_dependency_fix_approval() {
    local approve_dep_fix=false
    
    # Use environment variable override for automated environments
    # NOTE: AUTO_FIX_DEPS should only be used in trusted CI environments with additional validation
    if [ "${AUTO_FIX_DEPS:-}" = "true" ]; then
        # Enhanced security: Require BOTH CI environment AND explicit approval token
        if [ "${CI:-}" = "true" ] || [ "${GITHUB_ACTIONS:-}" = "true" ]; then
            # Require explicit token configuration in CI environments
            if [ -z "${EXPECTED_AUTO_FIX_TOKEN}" ]; then
                warn "EXPECTED_AUTO_FIX_TOKEN environment variable must be set for automated dependency fixes in CI"
                approve_dep_fix=false
            # Additional security check for CI environments with constant-time comparison
            elif [ -n "${AUTO_FIX_DEPS_TOKEN:-}" ] && constant_time_token_compare "${AUTO_FIX_DEPS_TOKEN}" "${EXPECTED_AUTO_FIX_TOKEN}"; then
                approve_dep_fix=true
                info "AUTO_FIX_DEPS enabled in CI with valid token - automatically applying dependency fixes"
            else
                warn "AUTO_FIX_DEPS=true in CI but missing or invalid token - requiring confirmation"
                if [ -t 0 ] && [ -t 1 ]; then
                    echo -e "${YELLOW}AUTO_FIX_DEPS is set in CI but token validation failed. Confirm 'yarn audit fix'? [y/N]${NC}"
                    read -r response
                    if [[ "$response" =~ ^[Yy]$ ]]; then
                        approve_dep_fix=true
                    fi
                else
                    info "Non-interactive CI environment with invalid token - skipping dependency fixes for security"
                fi
            fi
        else
            # Require explicit confirmation outside CI environments
            warn "AUTO_FIX_DEPS=true detected outside CI environment - security risk"
            if [ -t 0 ] && [ -t 1 ]; then
                echo -e "${RED}WARNING: AUTO_FIX_DEPS outside CI is a security risk. Confirm 'yarn audit fix'? [y/N]${NC}"
                read -r response
                if [[ "$response" =~ ^[Yy]$ ]]; then
                    approve_dep_fix=true
                fi
            else
                warn "Non-interactive shell outside CI - rejecting AUTO_FIX_DEPS for security"
            fi
        fi
    elif [ "${AUTO_FIX_DEPS:-}" = "false" ]; then
        approve_dep_fix=false
    else
        # Prompt user for confirmation (only if running interactively and no override)
        if [ -t 0 ] && [ -t 1 ]; then
            echo -e "${YELLOW}Do you want to run 'yarn audit fix' to update dependencies? This may introduce breaking changes. [y/N]${NC}"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                approve_dep_fix=true
            fi
        else
            info "Non-interactive shell detected; skipping 'yarn audit fix' prompt."
        fi
    fi
    
    # Return approval status (0 = approved, 1 = not approved)
    if [ "$approve_dep_fix" = true ]; then
        return 0
    else
        return 1
    fi
}

# Auto-fix common CI issues
auto_fix_common_issues() {
    local workspace_dir="$1"
    local pr_number="$2"
    
    info "Attempting to auto-fix common CI issues..."
    cd "$workspace_dir"
    
    local fixes_applied=false
    
    # Try to fix linting issues
    if yarn lint:fix &> /dev/null; then
        if ! git diff-index --quiet HEAD --; then
            info "Applied linting auto-fixes"
            # Only add specific file types to avoid accidentally committing sensitive files
            add_safe_files
            git commit -F- <<'EOF'
Auto-fix linting issues

🤖 Automated fix from Claude Code CI monitoring
EOF
            fixes_applied=true
        fi
    fi
    
    # Try to update dependencies if there are security issues
    if validate_dependency_fix_approval; then
        if yarn audit fix &> /dev/null; then
            if ! git diff-index --quiet HEAD --; then
                info "Applied dependency security fixes"
                # Only add specific file types to avoid accidentally committing sensitive files
                add_safe_files
                git commit -F- <<'EOF'
Auto-fix dependency security issues

🤖 Automated fix from Claude Code CI monitoring
EOF
                fixes_applied=true
            fi
        fi
    else
        info "Skipping 'yarn audit fix' due to lack of explicit approval."
    fi
    
    if [ "$fixes_applied" = true ]; then
        info "Pushing auto-fixes..."
        git push origin
        
        # Add comment about auto-fixes
        local fix_comment="🔧 **Auto-fixes Applied**

I've automatically applied the following fixes:
- Linting issues resolved
- Dependency security updates

Please check if the CI passes now.

🤖 Automated fixes from Claude Code"
        
        gh pr comment "$pr_number" --body "$fix_comment"
        
        # Re-monitor CI
        sleep 60  # Wait a bit for CI to start
        monitor_pr_ci "$pr_number" "$workspace_dir"
    fi
}

# Monitor and respond to PR comments
monitor_pr_comments() {
    local pr_number="$1"
    local workspace_dir="$2"
    
    info "Monitoring PR comments for #$pr_number..."
    
    # This would ideally run as a background process
    # For now, we'll check once and provide instructions
    
    local comments=$(gh pr view "$pr_number" --json comments --jq '.comments[].body')
    
    if echo "$comments" | grep -i "copilot\|bot\|automated"; then
        copilot "Copilot or automated comments detected on PR #$pr_number"
        
        # Add comment encouraging review of bot suggestions
        local response_comment="👋 **Review Assistant**

I see there are automated review comments on this PR. Please review the suggestions and apply any relevant fixes.

To apply fixes automatically, you can run:
\`\`\`bash
./scripts/pr-automation.sh apply-suggestions $pr_number
\`\`\`

🤖 Claude Code PR Assistant"
        
        gh pr comment "$pr_number" --body "$response_comment"
    fi
}

# Apply suggestions from PR comments
apply_suggestions() {
    local pr_number="$1"
    local workspace_dir="${2:-$(pwd)}"
    
    validate_pr_number "$pr_number"
    
    info "Applying suggestions from PR #$pr_number comments..."
    cd "$workspace_dir"
    
    # This is a placeholder for more sophisticated suggestion parsing
    # In a real implementation, you'd parse GitHub suggestions format
    
    warn "Suggestion application requires manual review for safety"
    warn "Please review comments manually and apply appropriate changes"
    
    # Open PR in browser for manual review
    gh pr view "$pr_number" --web
}

# Show PR status
show_pr_status() {
    local pr_number="$1"
    
    validate_pr_number "$pr_number"
    
    info "PR Status for #$pr_number:"
    gh pr view "$pr_number"
    
    echo ""
    info "Recent comments:"
    gh pr view "$pr_number" --json comments --jq '.comments[-3:] | .[] | "- \(.author.login): \(.body[:100])..."'
    
    echo ""
    info "CI Status:"
    gh pr checks "$pr_number"
}

# Main automation workflow
auto_workflow() {
    local action="$1"
    local workspace_dir="${2:-$(pwd)}"
    local base_branch="${3:-main}"
    
    case "$action" in
        "validate")
            validate_for_pr "$workspace_dir"
            ;;
        "submit")
            submit_pr "$workspace_dir" "$base_branch" "false"
            ;;
        "submit-draft")
            submit_pr "$workspace_dir" "$base_branch" "true"
            ;;
        "monitor")
            local pr_number="$4"
            if [ -z "$pr_number" ]; then
                error "PR number required for monitoring"
            fi
            monitor_pr_ci "$pr_number" "$workspace_dir"
            ;;
        "status")
            local pr_number="$4"
            if [ -z "$pr_number" ]; then
                error "PR number required for status"
            fi
            show_pr_status "$pr_number"
            ;;
        "apply-suggestions")
            local pr_number="$4"
            if [ -z "$pr_number" ]; then
                error "PR number required for applying suggestions"
            fi
            apply_suggestions "$pr_number" "$workspace_dir"
            ;;
        *)
            error "Unknown action: $action. Use validate, submit, submit-draft, monitor, status, or apply-suggestions"
            ;;
    esac
}

# Show help
show_help() {
    cat << EOF
GitHub PR Automation with Copilot Integration

Usage: $0 <action> [workspace] [base_branch] [pr_number]

Actions:
  validate                     - Validate project for PR (lint, test, build)
  submit [workspace] [base]    - Submit PR with Copilot review request
  submit-draft [workspace] [base] - Submit draft PR
  monitor [workspace] [base] [pr_number] - Monitor CI status
  status [workspace] [base] [pr_number]  - Show PR status
  apply-suggestions [workspace] [base] [pr_number] - Apply review suggestions

Examples:
  $0 validate
  $0 submit . main
  $0 monitor . main 123
  $0 status . main 123

The workflow includes:
1. ✅ Code validation (lint, test, build)
2. 👤 User confirmation before PR creation
3. 🚀 PR submission with AI-generated description
4. 🤖 GitHub Copilot review request
5. 📊 CI monitoring and auto-fix attempts
6. 💬 Comment monitoring and response

Environment Variables:
  AUTO_FIX_DEPS=true     - Automatically apply dependency fixes (CI environments only)
  AUTO_FIX_DEPS=false    - Skip dependency fixes completely
  CI=true               - Indicates running in CI environment (enables AUTO_FIX_DEPS)
  GITHUB_ACTIONS=true   - Indicates running in GitHub Actions (enables AUTO_FIX_DEPS)

Security Note:
  AUTO_FIX_DEPS should only be used in trusted CI environments. When set to 'true'
  outside of CI, the script will still require explicit user confirmation for security.

EOF
}

# Validate PR number for security
validate_pr_number() {
    local pr_number="$1"
    
    if [ -z "$pr_number" ]; then
        error "PR number required"
    fi
    
    # Check if it's a positive integer
    if ! [[ "$pr_number" =~ ^[1-9][0-9]*$ ]]; then
        # Sanitize PR number in error message to prevent log injection (PR numbers are only digits)
        local sanitized_pr=$(echo "$pr_number" | sed 's/[^0-9]//g' | cut -c1-20)
        error "Invalid PR number: '$sanitized_pr'. Must be a positive integer."
    fi
    
    # Additional bounds check to prevent integer overflow and resource exhaustion
    if [ ${#pr_number} -gt 8 ]; then
        error "PR number too long: '${#pr_number} digits' (max 8 digits)"
    fi
    
    # Check for reasonable upper bounds to prevent resource exhaustion attacks
    if [ "$pr_number" -gt 99999999 ]; then
        error "PR number too large (max 99,999,999)"
    fi
    
    # Validate that PR exists and user has access (optional, can be skipped in some contexts)
    if [ "${VALIDATE_PR_EXISTS:-true}" = "true" ]; then
        if ! gh pr view "$pr_number" --json state > /dev/null 2>&1; then
            error "PR #$pr_number does not exist or you don't have access to it"
        fi
    fi
}

# Monitor PR for comments and CI status, respond automatically
monitor_pr_continuous() {
    local pr_number="$1"
    local workspace_dir="${2:-$(pwd)}"
    local check_interval="${3:-60}"  # Check every minute
    
    validate_pr_number "$pr_number"
    
    log "Starting continuous PR monitoring for PR #$pr_number..."
    log "Checking every $check_interval seconds (Ctrl+C to stop)"
    
    cd "$workspace_dir"
    local last_comment_check=$(date +%s)
    local last_ci_check=$(date +%s)
    
    # Set up signal handling for graceful shutdown
    trap 'log "Received signal, stopping PR monitoring..."; exit 0' SIGTERM SIGINT
    
    while true; do
        local current_time=$(date +%s)
        
        # Check for new comments every minute
        if [ $((current_time - last_comment_check)) -ge $check_interval ]; then
            info "Checking for new PR comments..."
            
            # Get recent comments (last 5 minutes)
            local repo_info=$(gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}')
            local owner=$(echo "$repo_info" | jq -r '.owner')
            local repo_name=$(echo "$repo_info" | jq -r '.name')
            
            # Validate owner and repo name to prevent URL injection
            if ! [[ "$owner" =~ ^[a-zA-Z0-9._-]+$ ]] || ! [[ "$repo_name" =~ ^[a-zA-Z0-9._-]+$ ]]; then
                warn "Invalid repository owner or name format - skipping comment check"
                return 0
            fi
            
            # Get timestamp for 5 minutes ago using cross-platform function
            local five_minutes_ago
            five_minutes_ago="$(get_five_minutes_ago_iso8601 "$last_comment_check")"
            
            local recent_comments=$(gh api repos/"$owner"/"$repo_name"/pulls/"$pr_number"/comments \
                --jq '.[] | select(.created_at > "'"$five_minutes_ago"'") | "\(.user.login): \(.body)"' 2>/dev/null || true)
            
            if [ -n "$recent_comments" ]; then
                log "New comments detected on PR #$pr_number:"
                # Enhanced sanitization to prevent shell escape sequences and log injection
                local sanitized_comments
                sanitized_comments=$(echo "$recent_comments" | \
                    LC_ALL=C sed 's/[[:cntrl:]]//g' | \
                    LC_ALL=C sed 's/\x1b\[[0-9;]*m//g' | \
                    LC_ALL=C sed 's/[\x00-\x1f\x7f-\x9f]//g' | \
                    head -20)
                
                echo "$sanitized_comments"
                
                # Check if comments mention fixing issues (use sanitized version)
                if echo "$sanitized_comments" | grep -qi "fix\|error\|issue\|problem"; then
                    info "Comment mentions fixes needed - running auto-fix..."
                    auto_fix_common_issues "$workspace_dir" "$pr_number"
                fi
            fi
            
            last_comment_check=$current_time
        fi
        
        # Check CI status every 2 minutes
        if [ $((current_time - last_ci_check)) -ge $((check_interval * 2)) ]; then
            info "Checking CI status..."
            
            local ci_failures=$(gh pr checks "$pr_number" --json name,conclusion \
                --jq '.[] | select(.conclusion=="failure" or .conclusion=="error") | .name' 2>/dev/null || true)
            
            if [ -n "$ci_failures" ]; then
                warn "CI failures detected:"
                echo "$ci_failures"
                info "Attempting to auto-fix common CI issues..."
                auto_fix_common_issues "$workspace_dir" "$pr_number"
            else
                info "✅ CI checks passing"
            fi
            
            last_ci_check=$current_time
        fi
        
        sleep 30  # Check more frequently than the intervals
    done
}

# Auto-fix common development issues (enhanced version)
auto_fix_common_issues() {
    local workspace_dir="${1:-$(pwd)}"
    local pr_number="${2:-}"
    
    # Validate PR number if provided
    if [ -n "$pr_number" ]; then
        validate_pr_number "$pr_number"
    fi
    
    log "Running enhanced auto-fix for common issues in $workspace_dir..."
    cd "$workspace_dir"
    
    local fixed_something=false
    local fix_summary=""
    
    # Fix linting issues
    info "Attempting to fix linting issues..."
    local lint_log
    if lint_log=$(create_temp_file "lint-fix" ".log") && yarn lint:fix > "$lint_log" 2>&1; then
        if ! git diff-index --quiet HEAD --; then
            log "✅ Linting issues auto-fixed"
            fix_summary="${fix_summary}- ESLint auto-fixes applied\n"
            fixed_something=true
        fi
        rm -f "$lint_log"
    else
        warn "Some linting issues could not be auto-fixed"
        [ -n "$lint_log" ] && rm -f "$lint_log"
    fi
    
    # Fix formatting issues
    info "Checking for formatting issues..."
    if command -v prettier &> /dev/null; then
        local prettier_log
        if prettier_log=$(create_temp_file "prettier-fix" ".log") && yarn prettier --write . > "$prettier_log" 2>&1; then
            if ! git diff-index --quiet HEAD --; then
                log "✅ Formatting issues auto-fixed"
                fix_summary="${fix_summary}- Prettier formatting applied\n"
                fixed_something=true
            fi
            rm -f "$prettier_log"
        else
            [ -n "$prettier_log" ] && rm -f "$prettier_log"
        fi
    fi
    
    # Remove trailing whitespaces (as specified in CLAUDE.md)
    info "Removing trailing whitespaces..."
    # Cross-platform sed compatibility
    if sed --version >/dev/null 2>&1; then
        # GNU sed
        find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
            xargs sed -i 's/[[:space:]]*$//' 2>/dev/null || true
    else
        # BSD sed (macOS)
        find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
            xargs sed -i '' 's/[[:space:]]*$//' 2>/dev/null || true
    fi
    if ! git diff-index --quiet HEAD --; then
        log "✅ Trailing whitespaces removed"
        fix_summary="${fix_summary}- Trailing whitespace removal\n"
        fixed_something=true
    fi
    
    # Try to fix common TypeScript issues
    info "Checking TypeScript compilation..."
    local tsc_log
    if tsc_log=$(create_temp_file "tsc-check" ".log") && ! yarn build > "$tsc_log" 2>&1; then
        warn "TypeScript errors detected - manual review required"
        # Show the errors for context
        tail -20 "$tsc_log"
        rm -f "$tsc_log"
    else
        info "✅ TypeScript compilation passing"
        [ -n "$tsc_log" ] && rm -f "$tsc_log"
    fi
    
    # Run tests to see current status
    info "Running tests to check current status..."
    local test_log
    if test_log=$(create_temp_file "test-check" ".log") && ! yarn test > "$test_log" 2>&1; then
        warn "Tests failing - manual review required"
        # Show summary of test failures
        grep -E "(FAIL|Error|✗)" "$test_log" | head -10 || true
        rm -f "$test_log"
    else
        info "✅ All tests passing"
        [ -n "$test_log" ] && rm -f "$test_log"
    fi
    
    # If we fixed anything, commit and push
    if [ "$fixed_something" = true ]; then
        log "Committing auto-fixes..."
        # Only add specific file types to avoid accidentally committing sensitive files
        add_safe_files
        git commit -F- <<EOF
fix: Auto-fix linting, formatting, and whitespace issues

Automated fixes applied:
$(echo -e "$fix_summary")

🤖 Generated with Claude Code automation

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
        
        # Push the fixes
        local current_branch=$(git branch --show-current)
        info "Pushing auto-fixes to $current_branch..."
        git push origin "$current_branch"
        
        log "✅ Auto-fixes pushed to PR"
        
        # Add comment to PR if PR number provided
        if [ -n "$pr_number" ]; then
            add_autofix_comment "$pr_number" "$(echo -e "$fix_summary")"
        fi
    else
        info "No auto-fixable issues found"
    fi
}

# Add comment to PR with auto-fix results
add_autofix_comment() {
    local pr_number="$1"
    local fix_summary="$2"
    
    validate_pr_number "$pr_number"
    
    local comment="🤖 **Automated Fix Applied**

I've automatically applied the following fixes:

$fix_summary

The changes have been committed and pushed to this PR.

Generated with Claude Code automation"
    
    if gh pr comment "$pr_number" --body "$comment"; then
        info "✅ Auto-fix comment added to PR #$pr_number"
    else
        warn "Failed to add comment to PR #$pr_number"
    fi
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        "validate"|"submit"|"submit-draft"|"monitor"|"status"|"apply-suggestions")
            auto_workflow "$@"
            ;;
        "monitor-continuous")
            monitor_pr_continuous "$2" "$3" "$4"
            ;;
        "auto-fix")
            auto_fix_common_issues "$2" "$3"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "Unknown command: $1. Use '$0 help' for usage information."
            ;;
    esac
}

# Run main function with all arguments
main "$@"