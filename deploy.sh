#!/bin/bash

# Add all changes
git add .

# Commit with a dummy message
git commit -m "Automated deployment commit"

# Build the Docker container
docker build -t dbu14txo9wibuf:latest .

# Tag and push the Docker image
docker tag dbu14txo9wibuf:latest ericandrsson/dbu14txo9wibuf:latest
docker push ericandrsson/dbu14txo9wibuf:latest

echo "Deployment complete!"