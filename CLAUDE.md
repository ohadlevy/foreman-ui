# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Mission

This is a **modern React UI replacement** for Foreman's existing Ruby on Rails web interface. The project aims to:

1. **User Portal**: Create a simplified, cloud-like self-service experience for non-admin users
2. **Admin Portal**: Eventually replace the existing Foreman web UI with a modern, intuitive admin interface
3. **Plugin Architecture**: Support extensibility through a modern plugin system
4. **Improved UX**: Focus on ease of use, great onboarding, and modern UI patterns

### Context: Foreman Ecosystem
- **Current State**: Rails-based UI with jQuery, some React components, PatternFly v4/v5 migration
- **Plugin Ecosystem**: 50+ plugins extending functionality (Ansible, Puppet, Remote Execution, etc.)
- **User Base**: Infrastructure teams managing physical/virtual servers, provisioning, configuration management
- **Goal**: Complete frontend modernization while maintaining plugin compatibility

## Development Guidelines

### Code Development Workflow
- Always run lint/tsc/tests, if you change any file during that cycle, run it again

## Architecture Overview

**Lerna Monorepo Structure:**
```
foreman-ui/
├── packages/
│   ├── shared/          # @foreman/shared - Component library, API clients, plugin framework
│   ├── user-portal/     # @foreman/user-portal - Self-service interface  
│   └── admin-portal/    # @foreman/admin-portal - Modern admin interface (planned)
```

[... rest of the existing content remains unchanged ...]