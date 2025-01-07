#!/bin/bash

# Exit on first error
set -e

# Print system and environment information
echo "System Information:"
uname -a
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Current directory: $(pwd)"

# Print environment variables
echo "Environment Variables:"
env | grep VITE_

# Install dependencies with verbose output
echo "Installing dependencies..."
npm install --verbose

# Clear any existing build artifacts
rm -rf dist

# Run build with debug flags
echo "Running build..."
npm run build --verbose

# Verify dist directory
if [ ! -d "dist" ]; then
    echo "ERROR: Build did not create 'dist' directory!"
    exit 1
fi

# List contents of dist directory
echo "Build artifacts:"
ls -la dist

echo "Build completed successfully!"
