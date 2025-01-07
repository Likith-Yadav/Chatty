#!/bin/bash

# Print Node and npm versions
echo "Node version:"
node --version

echo "npm version:"
npm --version

# Install dependencies
npm install

# Run build with verbose output
npm run build --verbose

# Check if dist directory exists
if [ -d "dist" ]; then
  echo "Build successful! Dist directory created."
  ls -l dist
else
  echo "ERROR: Dist directory not created!"
  exit 1
fi
