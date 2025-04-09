#!/bin/bash

# Start the server backend in Docker
echo "Starting BananaPrep backend container..."
docker run -p 3000:3000 -d --name bananaprep-app bananaprep

# Start the frontend using Python HTTP server in the client directory
echo "Starting BananaPrep client at http://localhost:8000"
cd ~/bananaprep/client || exit 1
python3 -m http.server 8000 &
CLIENT_PID=$!

echo ""
echo "✅ BananaPrep is now running!"
echo "Frontend: http://localhost:8000 (proxied to http://yourdomain.com)"
echo "Backend: http://localhost:3000 (proxied to http://yourdomain.com/api/)"
echo ""
echo "Press [CTRL+C] to stop..."

# Wait for the Python server to keep script alive
wait $CLIENT_PID

# On exit, clean up
echo "Stopping containers..."
docker stop bananaprep-app
docker rm bananaprep-app
