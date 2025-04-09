#!/bin/bash

# BananaPrep Deployment Script for GCP
echo "=== BananaPrep Deployment ==="
echo "Starting deployment process..."

# Stop and remove any existing containers
echo "Cleaning up existing containers..."
docker stop bananaprep-app 2>/dev/null || true
docker rm bananaprep-app 2>/dev/null || true

# Build the Docker image
echo "Building Docker image for BananaPrep..."
docker build -t bananaprep .

# Run the container
echo "Starting BananaPrep container..."
docker run -p 3000:3000 -d --restart unless-stopped --name bananaprep-app bananaprep

# Set up static file server for client
echo "Setting up client-side static file server..."
cd client

# Check if http-server is installed, if not install it
if ! command -v http-server &> /dev/null
then
    echo "Installing http-server..."
    npm install -g http-server
fi

# Kill any existing http-server processes
pkill -f "http-server" || true

# Start http-server in the background
nohup http-server -p 8000 > ../http-server.log 2>&1 &
echo $! > ../http-server.pid

echo "BananaPrep deployment complete!"
echo "Backend API: http://localhost:3000"
echo "Frontend: http://localhost:8000"
echo "These are proxied via Nginx to your domain."