#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Export requirements
print_color $GREEN "Exporting requirements from Poetry..."
poetry export -f requirements.txt --output requirements.txt --without-hashes

# Add all changes
git add .

# Commit with a dummy message
git commit -m "Automated deployment commit"
git push

# Build the Docker container
print_color $GREEN "Building Docker image..."
docker build -t dbu14txo9wibuf:latest .

# Tag and push the Docker image
docker tag dbu14txo9wibuf:latest ericandrsson/dbu14txo9wibuf:latest
docker push ericandrsson/dbu14txo9wibuf:latest

echo "Deployment complete!"