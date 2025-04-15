docker stop bananaprep-app 2>/dev/null || echo "Container not running" 
docker rm bananaprep-app 2>/dev/null || echo "Container does not exist" 
docker run -p 3000:3000 -d --name bananaprep-app bananaprep && docker image prune -f