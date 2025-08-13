#!/bin/sh
set -e

# Default values
FOREMAN_URL=${FOREMAN_URL:-"https://foreman.example.com"}
FOREMAN_HOST=$(echo $FOREMAN_URL | sed -e 's|^[^/]*//||' -e 's|/.*$||')

echo "=== Foreman UI Container Starting ==="
echo "Foreman URL: $FOREMAN_URL"
echo "Foreman Host: $FOREMAN_HOST"

# Validate Foreman URL format
case "$FOREMAN_URL" in
    http://*|https://*)
        # Valid URL format
        ;;
    *)
        # Invalid URL format
        echo "ERROR: FOREMAN_URL must start with http:// or https://"
        echo "Current value: $FOREMAN_URL"
        exit 1
        ;;
esac

# Create nginx configuration with Foreman URL
echo "Configuring nginx for Foreman instance..."

# Create upstream configuration for the Foreman server
cat > /etc/nginx/conf.d/foreman-upstream.conf << EOF
# Generated Foreman upstream configuration
# Note: Port 443 is hardcoded as 99.9% of HTTPS Foreman instances use standard HTTPS port
# This could be made configurable if needed, but covers the vast majority of use cases
upstream foreman_backend {
    server $FOREMAN_HOST:443;
}
EOF

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "ERROR: nginx configuration test failed"
    exit 1
fi

echo "Configuration successful!"

# Test connectivity to Foreman instance (optional, can be disabled)
if [ "${SKIP_FOREMAN_CHECK:-false}" != "true" ]; then
    echo "Testing connectivity to Foreman instance..."
    
    # Try to reach the Foreman instance
    if curl -k -s --connect-timeout 10 --max-time 30 "${FOREMAN_URL}/api/status" > /dev/null; then
        echo "✓ Successfully connected to Foreman instance"
    else
        echo "⚠ WARNING: Could not connect to Foreman instance at $FOREMAN_URL"
        echo "   This might be normal if Foreman is not yet available."
        echo "   The UI will attempt to connect when accessed."
        echo "   To skip this check, set SKIP_FOREMAN_CHECK=true"
    fi
fi

# Log environment information
echo "=== Environment Information ==="
echo "Container OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo "Alpine Linux")"
echo "Nginx version: $(nginx -v 2>&1)"
echo "=== Container Ready ==="

# Execute the main command
exec "$@"