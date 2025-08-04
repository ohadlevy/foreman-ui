#!/bin/bash
# Enhanced development environment automation for Foreman UI
# Usage: ./scripts/dev-environment.sh [action] [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FOREMAN_DIR="${FOREMAN_DIR:-$HOME/git/foreman}"


warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

# File extension pattern for safe git operations (readonly to prevent modification)
readonly FILE_EXTENSION_PATTERN='\.(ts|tsx|js|jsx|json|md|sh|yml|yaml)$'

# Validate the file extension pattern to prevent regex injection
validate_file_extension_pattern() {
    # Basic validation: ensure pattern contains only expected characters
    if [[ ! "$FILE_EXTENSION_PATTERN" =~ ^\\\.[^\$]*\$$ ]]; then
        error "Invalid FILE_EXTENSION_PATTERN: must start with \\. and end with \$"
    fi

    # Ensure pattern doesn't contain dangerous shell metacharacters (keep it simple)
    if [[ "$FILE_EXTENSION_PATTERN" == *";"* ]] || [[ "$FILE_EXTENSION_PATTERN" == *"&"* ]] || [[ "$FILE_EXTENSION_PATTERN" == *"\`"* ]]; then
        error "FILE_EXTENSION_PATTERN contains potentially dangerous shell characters"
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


# Sanitize directory path to prevent injection attacks
sanitize_path() {
    local path="$1"

    # Remove any control characters and dangerous sequences
    path=$(printf '%s\n' "$path" | LC_ALL=C sed 's/[[:cntrl:]]//g')

    # Validate that the path exists and is a real directory
    if [ ! -d "$path" ]; then
        warn "Invalid or non-existent directory path: $path"
        return 1
    fi

    # Get the absolute, canonical path to prevent relative path attacks
    if command -v realpath >/dev/null 2>&1; then
        realpath "$path"
    elif command -v readlink >/dev/null 2>&1; then
        readlink -f "$path" 2>/dev/null || echo "$path"
    else
        # Fallback: basic canonicalization
        cd "$path" && pwd
    fi
}

# Check if podman-compose is available
check_podman() {
    if ! command -v podman-compose &> /dev/null; then
        error "podman-compose not found. Please install it first."
    fi
}


# Start Foreman containers
start_foreman() {
    log "Starting Foreman containers..."
    check_podman

    if [ ! -f "$FOREMAN_DIR/docker-compose.yml" ]; then
        error "Foreman docker-compose.yml not found at $FOREMAN_DIR"
    fi

    cd "$FOREMAN_DIR"
    podman-compose -f docker-compose.yml up -d

    log "Waiting for Foreman to be ready..."
    sleep 10

    # Check if Foreman is responding
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
            log "Foreman is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
}

# Get the appropriate port for the current worktree instance
get_instance_port() {
    local workspace_dir="${1:-$(pwd)}"
    local base_port=3001
    local base_dir="$(dirname "$PROJECT_ROOT")"

    # Extract worktree suffix to determine port offset
    local worktree_name=$(basename "$workspace_dir")

    # Default to base port for main worktree
    if [ "$worktree_name" = "foreman-ui" ]; then
        echo $base_port
        return
    fi

    # For other worktrees, calculate port based on alphabetical order
    local port_offset=0
    for dir in "$base_dir"/foreman-ui*; do
        if [ -d "$dir" ]; then
            local dir_name=$(basename "$dir")
            if [ "$dir_name" = "$worktree_name" ]; then
                break
            fi
            if [ "$dir_name" != "foreman-ui" ]; then
                ((port_offset++))
            fi
        fi
    done

    echo $((base_port + port_offset))
}

# Check if any development servers are running across worktrees
check_active_dev_servers() {
    local active_servers=0
    local base_dir="$(dirname "$PROJECT_ROOT")"

    # Check for active Vite dev servers (typically on ports 3001, 3002, etc.)
    for port in 3001 3002 3003 3004 3005; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            local pid=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$pid" ]; then
                local cmd=$(ps -p $pid -o cmd= 2>/dev/null | grep -i vite)
                if [ -n "$cmd" ]; then
                    info "Active Vite dev server found on port $port (PID: $pid)"
                    ((active_servers++))
                fi
            fi
        fi
    done

    # Also check for any yarn dev processes in worktree directories using more efficient pgrep
    for worktree_dir in "$base_dir"/foreman-ui*; do
        if [ -d "$worktree_dir" ] && [ "$worktree_dir" != "$PROJECT_ROOT" ]; then
            # Sanitize the path for safety
            local safe_worktree_dir
            if safe_worktree_dir=$(sanitize_path "$worktree_dir"); then
                # Use more efficient pgrep with combined pattern matching
                local dev_processes=$(pgrep -a "yarn" 2>/dev/null | grep -E "(yarn.*dev|lerna.*run.*dev)" | grep -F "$safe_worktree_dir")
                if [ -n "$dev_processes" ]; then
                    info "Active yarn dev process found in $safe_worktree_dir"
                    ((active_servers++))
                fi
            fi
        fi
    done

    return $active_servers
}

# Detect and use available terminal emulator
open_terminal_tab() {
    local title="$1"
    local command="$2"

    # Try different terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --tab --title="$title" -- bash -c "$command; exec bash"
    elif command -v konsole &> /dev/null; then
        konsole --new-tab --title="$title" -e bash -c "$command; exec bash"
    elif command -v xfce4-terminal &> /dev/null; then
        xfce4-terminal --tab --title="$title" --command="bash -c \"$command; exec bash\""
    elif command -v xterm &> /dev/null; then
        xterm -title "$title" -e bash -c "$command; exec bash" &
    else
        warn "No supported terminal emulator found. Running in current terminal:"
        info "$title: $command"
        eval "$command"
    fi
}

# Launch browser with debugging tools and remote access
launch_browser_debug() {
    local workspace_dir="${2:-$(pwd)}"
    local port=$(get_instance_port "$workspace_dir")
    local url="${1:-http://localhost:$port}"
    local browser="${BROWSER:-chrome}"
    local debug_port="${DEBUG_PORT:-9222}"

    log "Launching browser with debugging tools for $url..."

    case "$browser" in
        "chrome"|"chromium"|"google-chrome")
            # Launch Chrome/Chromium with remote debugging enabled
            local chrome_cmd=""
            for cmd in google-chrome chromium-browser chromium chrome; do
                if command -v $cmd &> /dev/null; then
                    chrome_cmd=$cmd
                    break
                fi
            done

            if [ -n "$chrome_cmd" ]; then
                # Create unique user data dir using mktemp for cross-platform compatibility
                local user_data_dir
                if user_data_dir=$(mktemp -d "${TMPDIR:-/tmp}/foreman-chrome-debug-XXXXXXXXXX"); then
                    log "Created temporary Chrome user data directory: $user_data_dir"
                    
                    # Set up cleanup trap to remove temp directory on script exit
                    cleanup_chrome_temp() {
                        if [ -d "$user_data_dir" ]; then
                            # Security validation: ensure we're only cleaning up our own temp directories
                            case "$user_data_dir" in
                                "${TMPDIR:-/tmp}"/foreman-chrome-debug-*|/tmp/foreman-chrome-debug-*)
                                    log "Cleaning up temporary Chrome user data directory: $user_data_dir"
                                    rm -rf "$user_data_dir" 2>/dev/null || warn "Failed to clean up temp directory: $user_data_dir"
                                    ;;
                                *)
                                    warn "Refusing to clean up directory outside expected temp path: $user_data_dir"
                                    ;;
                            esac
                        fi
                    }
                    trap cleanup_chrome_temp EXIT INT TERM
                else
                    error "Failed to create temporary directory for Chrome user data"
                    return 1
                fi

                log "Opening Chrome with remote debugging on port $debug_port..."
                log "Developer tools will auto-open for debugging"

                # Configure Chrome arguments
                local chrome_args=(
                    --new-window
                    --auto-open-devtools-for-tabs
                    --remote-debugging-port="$debug_port"
                    --user-data-dir="$user_data_dir"
                    --disable-features=VizDisplayCompositor
                    --no-first-run
                    --no-default-browser-check
                )
                
                # Optionally disable web security for debugging (see CHROME_DISABLE_WEB_SECURITY)
                if [ "${CHROME_DISABLE_WEB_SECURITY:-0}" = "1" ]; then
                    warn "⚠️  SECURITY WARNING: Chrome will be launched with --disable-web-security"
                    warn "   This disables Same-Origin Policy, CORS, and other critical browser security features"
                    warn "   This should ONLY be used for local development debugging against localhost"
                    warn "   DO NOT browse to external websites with this Chrome instance"
                    warn "   Close this browser instance immediately after debugging."
                    chrome_args+=(--disable-web-security)
                fi
                
                $chrome_cmd "${chrome_args[@]}" "$url" &

                local browser_pid=$!
                info "Chrome launched with PID: $browser_pid"
                info "Remote debugging available at: http://localhost:$debug_port"

                local pid_file
                if pid_file=$(create_temp_file "foreman-browser-debug" ".pid"); then
                    echo $browser_pid > "$pid_file"
                    echo "$user_data_dir" >> "$pid_file"
                    echo "$debug_port" >> "$pid_file"
                    info "Browser debug info saved to: $pid_file"
                fi

                # Wait a moment for Chrome to start
                sleep 2

                # Set up remote console monitoring
                setup_remote_debugging "$debug_port" "$url" &
                local monitor_pid=$!
                info "Console monitor started with PID: $monitor_pid"

            else
                error "No supported browser found. Install Chrome/Chromium for debugging support."
                return 1
            fi
            ;;
        *)
            error "Unsupported browser: $browser. Only Chrome/Chromium are supported for debugging."
            error "Set BROWSER environment variable to 'chrome', 'chromium', or 'google-chrome'."
            return 1
            ;;
    esac
}

# Set up remote debugging and console monitoring
setup_remote_debugging() {
    local debug_port="$1"
    local url="$2"

    # Wait for Chrome remote debugging to be available
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$debug_port/json" >/dev/null 2>&1; then
            info "Remote debugging is ready!"
            break
        fi
        log "Waiting for remote debugging ($attempt/$max_attempts)..."
        sleep 1
        ((attempt++))
    done

    if [ $attempt -gt $max_attempts ]; then
        warn "Remote debugging setup timed out"
        return 1
    fi

    # Monitor console logs
    monitor_browser_console "$debug_port" &
}

# Monitor browser console logs via remote debugging
monitor_browser_console() {
    local debug_port="$1"

    info "Starting console log monitoring..."
    info "Console logs will appear below (Ctrl+C to stop monitoring):"
    echo "==================== BROWSER CONSOLE ===================="

    # Use a simple approach to monitor console logs
    while true; do
        # Get list of tabs
        local tabs=$(curl -s "http://localhost:$debug_port/json" 2>/dev/null)

        if [ $? -eq 0 ] && [ -n "$tabs" ]; then
            # Extract websocket URL for the first tab
            local ws_url=$(echo "$tabs" | grep -o '"webSocketDebuggerUrl":"[^"]*"' | head -1 | cut -d'"' -f4)

            if [ -n "$ws_url" ]; then
                # Log that we found the debugging endpoint (use unique temp file)
                local debug_session_file
                if debug_session_file=$(create_temp_file "debug-session-started-${USER:-unknown}-${debug_port}" ".flag"); then
                    if [ ! -f "$debug_session_file" ]; then
                        info "Found debug session: $ws_url"
                        info "You can also access Chrome DevTools at: http://localhost:$debug_port"
                        touch "$debug_session_file"
                    fi
                fi
            fi
        fi

        sleep 5
    done
}

# Monitor and auto-fix common development issues
monitor_and_autofix() {
    local workspace_dir="${1:-$(pwd)}"
    local fix_interval="${2:-30}"  # Check every 30 seconds

    log "Starting continuous monitoring and auto-fixing for $workspace_dir..."
    log "Checking for issues every $fix_interval seconds (Ctrl+C to stop)"

    cd "$workspace_dir"

    while true; do
        local fixed_something=false

        # Check for TypeScript errors
        info "Checking TypeScript compilation..."
        if ! yarn build > /dev/null 2>&1; then
            warn "TypeScript errors detected, attempting auto-fix..."
            # Try to fix common TS issues
            if yarn lint:fix > /dev/null 2>&1; then
                info "Linting auto-fix applied"
                fixed_something=true
            fi

            # Check if that fixed the TS issues
            if yarn build > /dev/null 2>&1; then
                log "✅ TypeScript compilation fixed!"
                fixed_something=true
            else
                warn "TypeScript errors persist - manual intervention needed"
            fi
        fi

        # Check for linting issues
        info "Checking linting..."
        if ! yarn lint > /dev/null 2>&1; then
            warn "Linting issues detected, attempting auto-fix..."
            if yarn lint:fix > /dev/null 2>&1; then
                log "✅ Linting issues auto-fixed!"
                fixed_something=true
            else
                warn "Some linting issues require manual fixing"
            fi
        fi

        # Check for test failures
        info "Checking tests..."
        if ! yarn test > /dev/null 2>&1; then
            warn "Test failures detected"
            # For now, just report - auto-fixing tests is complex
            info "Test failures require manual review"
        fi

        # If we fixed something, commit the changes
        if [ "$fixed_something" = true ]; then
            if ! git diff-index --quiet HEAD --; then
                log "Auto-committing fixes..."
                # Only add specific file types to avoid accidentally committing sensitive files
                # Use git ls-files to find explicit file paths rather than glob patterns
                local files_to_add
                files_to_add=$(git ls-files -m -o --exclude-standard | grep -E "$FILE_EXTENSION_PATTERN" 2>/dev/null)

                if [ -n "$files_to_add" ]; then
                    echo "$files_to_add" | xargs git add 2>/dev/null || warn "Failed to stage some files"
                else
                    warn "No standard file types found to stage - checking for any modified tracked files"
                    git add -u 2>/dev/null || warn "No modified tracked files to stage"
                fi
                git commit -F- <<'EOF' || true
fix: Auto-fix linting and formatting issues

🤖 Generated with Claude Code automation

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
            fi
        fi

        sleep $fix_interval
    done
}

# Stop Foreman containers (with safety check for multi-worktree environments)
stop_foreman() {
    log "Checking if it's safe to stop Foreman containers..."
    check_podman

    # Check for active development servers
    check_active_dev_servers
    local active_count=$?

    if [ $active_count -gt 0 ]; then
        warn "Found $active_count active development server(s) that may be using Foreman backend"
        warn "Stopping Foreman containers could break active development sessions"
        echo ""
        echo "Active development servers detected:"
        check_active_dev_servers > /dev/null  # This will print the info messages
        echo ""
        read -p "Are you sure you want to stop Foreman containers? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warn "Foreman containers left running to avoid breaking active development"
            return 1
        fi
    fi

    log "Stopping Foreman containers..."
    cd "$FOREMAN_DIR"
    podman-compose -f docker-compose.yml down
}

# Setup worktree for feature development
setup_worktree() {
    local branch_name="$1"
    local worktree_name="${2:-$(echo $branch_name | sed 's/feature\///')}"
    local base_dir="$(dirname "$PROJECT_ROOT")"
    local worktree_dir="$base_dir/foreman-ui-$worktree_name"

    if [ -z "$branch_name" ]; then
        error "Branch name required. Usage: setup_worktree <branch_name> [worktree_name]"
    fi

    log "Setting up worktree for branch: $branch_name"

    cd "$PROJECT_ROOT"

    # Check if branch exists
    if git show-ref --verify --quiet refs/heads/"$branch_name"; then
        log "Branch $branch_name exists, creating worktree..."
        git worktree add "$worktree_dir" "$branch_name"
    else
        log "Creating new branch $branch_name and worktree..."
        git worktree add "$worktree_dir" -b "$branch_name"
    fi

    # Setup the worktree
    cd "$worktree_dir"

    log "Installing dependencies..."
    yarn install

    log "Building shared package..."
    yarn build:shared

    log "Worktree ready at: $worktree_dir"
    echo ""
    echo "To start development:"
    echo "  cd $worktree_dir"
    echo "  yarn dev:user    # Start user portal"
    echo "  yarn dev:admin   # Start admin portal"
    echo "  yarn dev         # Start all portals"
}

# Start development environment
start_dev() {
    local workspace_dir="${1:-$PROJECT_ROOT}"
    local service="${2:-user}"

    log "Starting development environment in: $workspace_dir"

    cd "$workspace_dir"

    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        yarn install
    fi

    # Build shared package if needed
    log "Building shared package..."
    yarn build:shared

    # Start Foreman if not running
    if ! curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        if ! start_foreman; then
            error "Failed to start Foreman containers. Please check podman-compose logs."
        fi
    else
        log "Foreman already running"
    fi

    # Start the requested service
    case $service in
        "user")
            local port=$(get_instance_port "$workspace_dir")
            log "Starting User Portal on http://localhost:$port"
            yarn dev:user
            ;;
        "admin")
            local port=$(($(get_instance_port "$workspace_dir") + 1))
            log "Starting Admin Portal on http://localhost:$port"
            yarn dev:admin
            ;;
        "all")
            log "Starting All Services..."
            yarn dev
            ;;
        *)
            error "Unknown service: $service. Use 'user', 'admin', or 'all'"
            ;;
    esac
}

# Run tests with enhanced debugging
test_debug() {
    local workspace_dir="${1:-$PROJECT_ROOT}"
    local test_type="${2:-watch}"

    log "Running tests with debugging in: $workspace_dir"
    cd "$workspace_dir"

    # Start Foreman if not running (for integration tests)
    if ! curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        warn "Foreman not running, starting containers..."
        start_foreman
    fi

    case $test_type in
        "debug")
            log "Starting test UI with browser debugging..."
            yarn test:ui &

            log "Monitoring Foreman logs..."
            open_terminal_tab "Foreman Logs" "cd $FOREMAN_DIR; podman-compose logs -f --tail=50" 2>/dev/null || {
                warn "Could not open terminal for logs. Use 'yarn logs:foreman' manually"
            }

            wait
            ;;
        "watch")
            log "Starting test watcher..."
            yarn test:watch
            ;;
        "coverage")
            log "Running tests with coverage..."
            yarn test:coverage
            ;;
        *)
            log "Running all tests..."
            yarn test
            ;;
    esac
}

# Monitor logs from various sources
monitor_logs() {
    local source="${1:-all}"

    case $source in
        "foreman")
            log "Monitoring Foreman container logs..."
            cd "$FOREMAN_DIR"
            podman-compose logs -f --tail=100
            ;;
        "frontend")
            log "Monitoring frontend development logs..."
            # This would be handled by the dev server itself
            warn "Frontend logs are shown in the dev server terminal"
            ;;
        "all")
            log "Starting comprehensive log monitoring..."
            open_terminal_tab "Foreman Logs" "cd $FOREMAN_DIR; podman-compose logs -f --tail=100" 2>/dev/null || {
                # Fallback if no GUI terminal available
                cd "$FOREMAN_DIR"
                podman-compose logs -f --tail=100
            }
            ;;
        *)
            error "Unknown log source: $source. Use 'foreman', 'frontend', or 'all'"
            ;;
    esac
}

# Build and validate the project
build_validate() {
    local workspace_dir="${1:-$PROJECT_ROOT}"

    log "Building and validating project in: $workspace_dir"
    cd "$workspace_dir"

    log "Running linter..."
    yarn lint || error "Linting failed"

    log "Running TypeScript compilation..."
    yarn build || error "Build failed"

    log "Running tests..."
    yarn test || error "Tests failed"

    log "✅ All validation checks passed!"
}

# Complete development workflow: build, validate, and optionally submit PR
complete_workflow() {
    local workspace_dir="${1:-$PROJECT_ROOT}"
    local submit_pr="${2:-false}"
    local base_branch="${3:-main}"

    log "Running complete development workflow in: $workspace_dir"

    # Validate project
    build_validate "$workspace_dir"

    if [ "$submit_pr" = "true" ]; then
        log "Initiating PR submission workflow..."
        "$SCRIPT_DIR/pr-automation.sh" submit "$workspace_dir" "$base_branch"
    else
        log "Workflow complete. To submit PR, run:"
        echo "  $SCRIPT_DIR/pr-automation.sh submit $workspace_dir $base_branch"
    fi
}

# Clean up development environment (current worktree only)
cleanup() {
    log "Cleaning up development environment for current worktree..."

    # Kill any development servers running in current directory
    local current_dir
    if ! current_dir=$(sanitize_path "$(pwd)"); then
        error "Failed to sanitize current directory path"
        return 1
    fi

    log "Stopping development servers in $current_dir..."

    # Find and kill processes specific to current directory (much safer than global pkill)
    local killed_any=false

    # Find yarn dev processes specific to current directory using more efficient pgrep
    local dev_pids=$(pgrep -a "yarn" 2>/dev/null | grep -E "(yarn.*dev|lerna.*run.*dev)" | grep -F "$current_dir" | awk '{print $1}')

    if [ -n "$dev_pids" ]; then
        echo "$dev_pids" | while read pid; do
            if [ -n "$pid" ]; then
                info "Stopping yarn dev process (PID: $pid) in current worktree"
                kill $pid 2>/dev/null || true
                killed_any=true
            fi
        done
    fi

    # Find vite processes specific to current directory using more efficient pgrep
    local vite_pids=$(pgrep -a "vite" 2>/dev/null | grep "vite.*serve" | grep -F "$current_dir" | awk '{print $1}')

    if [ -n "$vite_pids" ]; then
        echo "$vite_pids" | while read pid; do
            if [ -n "$pid" ]; then
                info "Stopping vite process (PID: $pid) in current worktree"
                kill $pid 2>/dev/null || true
                killed_any=true
            fi
        done
    fi

    # Check for remaining active servers in other worktrees
    check_active_dev_servers
    local active_count=$?

    if [ $active_count -gt 0 ]; then
        info "Found $active_count active development server(s) in other worktrees (left running)"
    fi

    # Attempt to stop Foreman containers (with safety check)
    info "Checking if Foreman containers should be stopped..."
    local foreman_stopped=true
    if ! stop_foreman; then
        foreman_stopped=false
        info "Foreman containers were left running due to active development servers"
    fi

    log "✅ Current worktree development environment cleaned up!"
    if [ $active_count -gt 0 ] || [ "$foreman_stopped" = "false" ]; then
        info "Some services were left running to avoid breaking other active development sessions"
        info "Use 'stop-foreman' with caution if you want to force stop shared services"
    fi
}

# Force cleanup all development processes (DANGEROUS - affects all worktrees)
force_cleanup() {
    warn "⚠️  FORCE CLEANUP - This will stop ALL development processes across ALL worktrees!"
    echo ""
    read -p "Are you absolutely sure? This will break any active development sessions. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warn "Force cleanup cancelled"
        return 1
    fi

    log "Force stopping all development processes..."

    # Kill all development processes globally (only user's own processes)
    local current_user=$(whoami)
    pkill -u "$current_user" -f "yarn.*dev" 2>/dev/null || true
    pkill -u "$current_user" -f "vite.*serve" 2>/dev/null || true
    pkill -u "$current_user" -f "lerna.*run.*dev" 2>/dev/null || true

    # Force stop Foreman containers
    log "Force stopping Foreman containers..."
    check_podman
    cd "$FOREMAN_DIR"
    podman-compose -f docker-compose.yml down

    log "✅ Force cleanup complete - all development processes stopped"
    warn "You may need to restart development servers in other worktrees"
}

# Show help
show_help() {
    echo "Foreman UI Development Environment Automation"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  setup-worktree <branch> [name]  - Create worktree for branch development"
    echo "  start-dev [workspace] [service] - Start development environment"
    echo "  start-foreman                   - Start Foreman containers only"
    echo "  stop-foreman                    - Stop Foreman containers (with safety checks)"
    echo "  test-debug [workspace] [type]   - Run tests with debugging"
    echo "  monitor-logs [source]           - Monitor logs (foreman|frontend|all)"
    echo "  build-validate [workspace]      - Build and validate project"
    echo "  complete-workflow [workspace] [submit_pr] [base] - Complete workflow with optional PR"
    echo "  submit-pr [workspace] [base]    - Submit PR with Copilot review"
    echo "  cleanup                         - Clean up current worktree only (safe)"
    echo "  force-cleanup                   - Force cleanup ALL processes (DANGEROUS)"
    echo "  launch-browser [url]            - Launch browser with developer tools"
    echo "  monitor-autofix [workspace] [interval] - Continuous monitoring and auto-fixing"
    echo ""
    echo "Examples:"
    echo "  $0 setup-worktree feature/new-ui-component"
    echo "  $0 start-dev /home/ohad/foreman-ui-newfeature user"
    echo "  $0 test-debug . debug"
    echo "  $0 monitor-logs foreman"
    echo "  $0 complete-workflow . true main  # Build, validate, and submit PR"
    echo "  $0 submit-pr . main               # Just submit PR"
    echo ""
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        "setup-worktree")
            setup_worktree "$2" "$3"
            ;;
        "start-dev")
            start_dev "$2" "$3"
            ;;
        "start-foreman")
            start_foreman
            ;;
        "stop-foreman")
            stop_foreman
            ;;
        "test-debug")
            test_debug "$2" "$3"
            ;;
        "monitor-logs")
            monitor_logs "$2"
            ;;
        "build-validate")
            build_validate "$2"
            ;;
        "complete-workflow")
            complete_workflow "$2" "$3" "$4"
            ;;
        "submit-pr")
            "$SCRIPT_DIR/pr-automation.sh" submit "$2" "${3:-main}"
            ;;
        "cleanup")
            cleanup
            ;;
        "force-cleanup")
            force_cleanup
            ;;
        "launch-browser")
            launch_browser_debug "$2"
            ;;
        "monitor-autofix")
            monitor_and_autofix "$2" "$3"
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