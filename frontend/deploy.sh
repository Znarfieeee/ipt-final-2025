#!/bin/bash

# Build the project
npm run build

# Ensure the _redirects file is in the dist directory
echo "/* /index.html 200" > dist/_redirects

# Copy other SPA routing configurations to dist
cp -f static.json dist/
cp -f public/netlify.toml dist/
cp -f public/render.yaml dist/

echo "Build completed with SPA routing configurations"
echo "Your application is ready for deployment!" 