#!/bin/bash

# Build the Docker image
echo "Building Docker image for BananaPrep..."
docker build -t bananaprep .

# Run the container
echo "Starting BananaPrep container..."
docker run -p 3000:3000 -d --name bananaprep-app bananaprep

echo "BananaPrep server is now running at http://localhost:3000"
echo "To view container logs: docker logs bananaprep-app"
echo "To stop the container: docker stop bananaprep-app"

echo "Starting BananaPrep client at http://localhost:8000"
python -m http.server 8000
