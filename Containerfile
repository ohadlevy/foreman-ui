# Multi-stage build with Fedora 42
# Build stage
FROM fedora:42 AS builder

# Install build dependencies using Fedora packages
RUN dnf update -y && \
    dnf install -y \
    nodejs \
    npm \
    yarn \
    git \
    python3 \
    make \
    gcc \
    gcc-c++ \
    && dnf clean all

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/user-portal/package.json ./packages/user-portal/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy only the source files we need (node_modules already installed)
COPY packages/ ./packages/
COPY lerna.json tsconfig.json ./

# Build the application
RUN yarn build:shared && yarn build:user

# Production stage
FROM fedora:42

# Install runtime dependencies
RUN dnf update -y && \
    dnf install -y \
    nodejs \
    npm \
    nginx \
    openssl \
    && dnf clean all

# Create nginx user and directories
RUN mkdir -p /var/log/nginx /var/cache/nginx /etc/nginx/ssl

# Copy built application from builder stage
COPY --from=builder /app/packages/user-portal/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Create self-signed certificate for HTTPS (can be overridden with volume mount)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Copy entrypoint script
COPY container-entrypoint.sh /container-entrypoint.sh
RUN chmod +x /container-entrypoint.sh

# Expose both HTTP and HTTPS ports
EXPOSE 80 443

# Use entrypoint script to handle configuration
ENTRYPOINT ["/container-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]