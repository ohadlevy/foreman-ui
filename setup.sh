#!/bin/bash

# Foreman UI Setup Script

set -e

echo "🚀 Setting up Foreman UI monorepo..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn 1.22+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 20+ and try again."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ Yarn $(yarn --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Build shared package first (required for user-portal dependency)
echo "🔨 Building shared package..."
yarn build:shared

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Copy .env.example to .env.local in packages/user-portal/"
echo "  2. Update the API URLs in .env.local to point to your Foreman instance"
echo "  3. Start the development server: yarn dev:user"
echo ""
echo "🔗 URLs:"
echo "  User Portal: http://localhost:3001"
echo "  Admin Portal: http://localhost:3000 (not yet implemented)"
echo ""
echo "📚 Documentation:"
echo "  Main README: ./README.md"
echo "  User Portal: ./packages/user-portal/README.md"
echo "  Shared Package: ./packages/shared/README.md"