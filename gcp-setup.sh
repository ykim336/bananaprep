#!/bin/bash

# BananaPrep Google Cloud VM setup script
# This script should be run as a user with sudo privileges

# Exit on any error
set -e

echo "===== BananaPrep Google Cloud Deployment Setup ====="
echo "Starting setup process..."

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
echo "Installing required packages..."
sudo apt-get install -y nginx nodejs npm curl git build-essential software-properties-common

# Check Node.js version and update if needed
NODE_VERSION=$(node -v | cut -d "v" -f 2 | cut -d "." -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Upgrading Node.js to version 14.x..."
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
echo "Installing PM2 process manager..."
sudo npm install -g pm2

# Create directory structure
echo "Creating application directories..."
sudo mkdir -p /var/www/bananaprep/{server,client}

# Clone the repository (assuming it's public or you have access)
echo "Downloading BananaPrep code..."
# Replace with your actual repository URL
git clone https://github.com/yourusername/bananaprep.git /tmp/bananaprep

# Copy files to the appropriate directories
echo "Setting up application files..."
sudo cp -r /tmp/bananaprep/client/* /var/www/bananaprep/client/
sudo cp -r /tmp/bananaprep/server/* /var/www/bananaprep/server/

# Install server dependencies
echo "Installing Node.js dependencies..."
cd /var/www/bananaprep/server
sudo npm install

# Set up Nginx
echo "Configuring Nginx..."
# Assuming nginx.conf is in the repository or was created separately
sudo cp /tmp/bananaprep/nginx.conf /etc/nginx/nginx.conf

# Set correct permissions
echo "Setting file permissions..."
sudo chown -R www-data:www-data /var/www/bananaprep
sudo chmod -R 755 /var/www/bananaprep

# Configure client API endpoint
echo "Updating client API endpoint..."
# Update the API_URL in api.js to match your server
# This assumes you're using Nginx to proxy requests and not exposing the Node.js port directly
sudo sed -i "s|const API_URL = 'http://localhost:3000/api';|const API_URL = '/api';|g" /var/www/bananaprep/client/js/api.js

# Start the Node.js server with PM2
echo "Starting Node.js server..."
cd /var/www/bananaprep/server
sudo pm2 start server.js --name "bananaprep"
sudo pm2 save
sudo pm2 startup

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Clean up
echo "Cleaning up..."
sudo rm -rf /tmp/bananaprep

echo "===== Setup Complete! ====="
echo "BananaPrep should now be running at http://your-server-ip"
echo "To secure your site with HTTPS, consider running Certbot:"
echo "sudo certbot --nginx -d your-domain.com"