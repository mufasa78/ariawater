#!/usr/bin/env bash
# Render build script for Aria Water
set -e

echo "🚀 Starting Render build..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run typecheck
echo "🔍 Running typecheck..."
pnpm run typecheck

# Build all packages
echo "🔨 Building packages..."
pnpm run build

echo "✅ Build complete!"
