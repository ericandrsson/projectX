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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_color $RED "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    print_color $RED "Poetry is not installed. Please install Poetry and try again."
    exit 1
fi

# Export requirements
print_color $GREEN "Exporting requirements from Poetry..."
poetry export -f requirements.txt --output requirements.txt --without-hashes

# Build Docker image
print_color $GREEN "Building Docker image..."
docker build -t flask-app .

# Check if containers are already running
if docker-compose ps | grep -q "Up"; then
    print_color $YELLOW "Containers are already running. Stopping and removing them..."
    docker-compose down
fi

# Start containers
print_color $GREEN "Starting containers..."
docker-compose up -d

print_color $GREEN "Build process completed!"
print_color $YELLOW "PocketBase is available at: http://localhost:8090"
print_color $YELLOW "Flask app is available at: http://localhost:5001"
