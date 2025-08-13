# Foreman UI Container

This container provides a modern React-based user interface for Foreman that can connect to existing Foreman HTTPS instances on remote machines. It allows users to quickly test the new UI on top of existing Foreman environments.

## Pre-built Container Images

Container images are automatically built and published to GitHub Container Registry:

- **Latest**: `ghcr.io/ohadlevy/foreman-ui:latest`
- **Tagged releases**: `ghcr.io/ohadlevy/foreman-ui:v1.0.0`
- **Architectures**: `linux/amd64`, `linux/arm64`

## Quick Start

### Option 1: Use Pre-built Image (Recommended)

1. **Clone and configure:**
   ```bash
   git clone <repository-url>
   cd foreman-ui-container-deployment
   
   # Edit compose.yml and set your Foreman URL
   vim compose.yml  # Change FOREMAN_URL
   ```

2. **Run with compose:**
   ```bash
   podman-compose up
   ```

3. **Or run directly:**
   ```bash
   podman run -d \
     --name foreman-ui \
     -p 8080:80 \
     -p 8443:443 \
     -e FOREMAN_URL=https://your-foreman-server.com \
     ghcr.io/ohadlevy/foreman-ui:latest
   ```

### Option 2: Build from Source

1. **Use the build compose file:**
   ```bash
   podman-compose -f compose-build.yml up --build
   ```

2. **Access the UI:**
   - HTTPS: https://localhost:8443
   - HTTP: http://localhost:8080 (redirects to HTTPS)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FOREMAN_URL` | Yes | `https://foreman.example.com` | URL of your Foreman instance |
| `SKIP_FOREMAN_CHECK` | No | `false` | Skip connectivity check during startup |

### Example Configurations

**Basic usage:**
```yaml
environment:
  - FOREMAN_URL=https://foreman.mycompany.com
```

**Skip connectivity check (useful if Foreman starts later):**
```yaml
environment:
  - FOREMAN_URL=https://foreman.mycompany.com
  - SKIP_FOREMAN_CHECK=true
```

## Proxied Endpoints

The container currently proxies these endpoints from your Foreman instance:
- `/api/*` - All Foreman API v2 endpoints
- `/notification_recipients` - Rails JSON route for notifications

*Additional endpoints will be added as the UI evolves and requires them.*

## SSL Certificates

### Default (Self-Signed)
The container includes self-signed SSL certificates for immediate use. You'll see a browser warning which you can safely accept for testing.

### Custom Certificates
To use your own SSL certificates, mount them as volumes:

```yaml
volumes:
  - ./ssl/your-cert.crt:/etc/nginx/ssl/nginx.crt:ro
  - ./ssl/your-cert.key:/etc/nginx/ssl/nginx.key:ro
```

## Ports

- **8080**: HTTP (redirects to HTTPS)
- **8443**: HTTPS (main access point)

## Health Checks

The container includes health checks that verify:
- Nginx is running
- HTTPS endpoint responds
- Container is ready to serve requests

Check health status:
```bash
podman-compose ps
# or
docker-compose ps
```

## Troubleshooting

### Cannot connect to Foreman instance

1. **Check Foreman URL format:**
   ```bash
   # Correct examples:
   FOREMAN_URL=https://foreman.example.com
   FOREMAN_URL=https://foreman.example.com:443
   
   # Incorrect (missing protocol):
   FOREMAN_URL=foreman.example.com
   ```

2. **Verify network connectivity:**
   ```bash
   # Test from the host system
   curl -k https://your-foreman-server.example.com/api/status
   ```

3. **Check container logs:**
   ```bash
   podman-compose logs foreman-ui
   # or
   docker-compose logs foreman-ui
   ```

### SSL Certificate Issues

1. **Browser shows security warning:**
   - This is normal with self-signed certificates
   - Click "Advanced" → "Accept Risk and Continue"

2. **Use custom certificates:**
   - Mount your certificates as shown in the SSL section above
   - Ensure certificates are readable by the nginx user

### Authentication Issues

The UI uses the same authentication as your Foreman instance:
- **Username/Password**: Standard Foreman login
- **Personal Access Tokens**: Supported for API access

## Building from Source

### Build container manually:
```bash
podman build -f Containerfile -t foreman-ui:latest .
# or
docker build -f Containerfile -t foreman-ui:latest .
```

### Run without compose:
```bash
podman run -d \
  --name foreman-ui \
  -p 8080:80 \
  -p 8443:443 \
  -e FOREMAN_URL=https://your-foreman-server.example.com \
  foreman-ui:latest
```

## Architecture

### Container Structure
- **Base**: Fedora 42 (latest)
- **Web Server**: Nginx with HTTPS redirect
- **Application**: Pre-built React application
- **Multi-stage**: Separate build and runtime stages for efficiency

### Network Flow
```
Browser → Container:8443 (HTTPS) → Nginx → React App
                                        ↓
                                  Proxy /api/* requests
                                        ↓
                              Your Foreman Instance
```

## Development

For development of the UI itself, see the main project documentation. This container is intended for:
- **Testing** the UI against existing Foreman instances
- **Demonstrations** of the new UI
- **Evaluation** by users with existing Foreman deployments

## Resource Usage

### Default Limits
- **Memory**: 512MB limit, 256MB reservation
- **CPU**: 0.5 cores limit, 0.25 cores reservation

### Adjust resources in compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
```

## Security

- Container runs with `no-new-privileges`
- Nginx configured with security headers
- HTTPS enforced (HTTP redirects to HTTPS)
- Self-signed certificates included (replace with real certificates for production)

### Security Notes for Testing Environment

This container is designed for **testing and evaluation** of the Foreman UI against existing Foreman instances:

- **SSL Verification**: Disabled (`proxy_ssl_verify off`) to support self-signed certificates commonly used in Foreman environments
- **Content Security Policy**: Permissive policy appropriate for serving pre-built React assets with external API integration
- **Port Configuration**: Uses standard HTTPS port 443, covering 99.9% of Foreman deployments

For production deployments, consider:
- Using proper SSL certificates with verification enabled
- Restricting CSP based on your specific security requirements
- Configuring custom ports if your Foreman instance uses non-standard ports

## Support

For issues with:
- **The container setup**: Check this documentation and container logs
- **The Foreman UI application**: See the main project repository
- **Your Foreman instance**: Consult Foreman documentation