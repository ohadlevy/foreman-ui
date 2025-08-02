# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security details to: foreman-security@googlegroups.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

## Security Considerations

This project interfaces with Foreman APIs and handles authentication. Key security areas:

- **Authentication**: Token-based authentication with secure storage
- **API Communication**: HTTPS-only communication with Foreman
- **Input Validation**: All user inputs are validated
- **Dependencies**: Regular dependency updates and vulnerability scanning

## Response Timeline

- Initial response: Within 48 hours
- Assessment: Within 1 week
- Fix release: Depends on severity (critical issues prioritized)

## Security Best Practices

When contributing:
- Never commit secrets or API keys
- Use environment variables for configuration
- Follow secure coding practices
- Report any security concerns promptly