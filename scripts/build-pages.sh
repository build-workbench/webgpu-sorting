#!/bin/bash
#
# Local build script for GitHub Pages
# Usage: bash scripts/build-pages.sh
#

set -e

echo "🚀 Building WebGPU Sorting site for GitHub Pages..."
echo ""

# Step 1: Build Vite assets
echo "📦 Building demo assets with Vite..."
npm run build

# Step 2: Backup assets
echo "💾 Backing up Vite assets..."
mkdir -p /tmp/vite-assets
cp -r dist/* /tmp/vite-assets/

# Step 3: Build site structure
echo "🏗️  Building site structure..."
rm -rf dist
node site/scripts/build-site.ts

# Step 4: Copy demo assets
echo "📋 Copying demo assets..."
mkdir -p dist/demo/assets

if [ -f /tmp/vite-assets/assets/index-*.js ]; then
    cp /tmp/vite-assets/assets/index-*.js dist/demo/assets/
fi

# Update HTML reference
JS_FILE=$(ls dist/demo/assets/index-*.js 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
if [ -n "$JS_FILE" ]; then
    echo "   Found JS file: $JS_FILE"
    sed -i "s|/demo/assets/index.js|/demo/assets/$JS_FILE|g" dist/demo/index.html
fi

# Step 5: Add .nojekyll
touch dist/.nojekyll

# Cleanup
rm -rf /tmp/vite-assets

echo ""
echo "✅ Build complete! Output in ./dist"
echo ""
echo "Directory structure:"
find dist -type f | sort
echo ""
echo "To preview locally:"
echo "  cd dist && npx serve"
