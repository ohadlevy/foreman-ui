# Multi-stage build - use Node.js Alpine for faster builds
# Build stage
FROM node:20-alpine AS builder

# Install build dependencies (Alpine is much faster than Fedora)
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    yarn

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json yarn.lock lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/user-portal/package.json ./packages/user-portal/

# Install dependencies with timeout protection
RUN yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn install --frozen-lockfile --network-timeout 300000

# Copy only the source files we need (node_modules already installed)
COPY packages/ ./packages/
COPY lerna.json tsconfig.json ./

# Build the application
RUN yarn build:shared && yarn build:user

# Production stage - use nginx alpine for smaller, faster runtime
FROM nginx:alpine

# Install additional runtime dependencies
RUN apk add --no-cache \
    curl \
    openssl

# Create directories (nginx user already exists in nginx:alpine)
RUN mkdir -p /etc/nginx/ssl

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