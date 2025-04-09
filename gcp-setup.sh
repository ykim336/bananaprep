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
sudo apt-get install -y nginx git curl software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Allow current user to use Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Install Node.js for http-server
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install http-server globally
echo "Installing http-server..."
sudo npm install -g http-server

# Set up Nginx
echo "Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo systemctl restart nginx

# Enable firewall and open necessary ports
echo "Configuring firewall..."
sudo apt-get install -y ufw
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
# Don't enable the firewall yet to avoid SSH disconnection
# We'll do this manually after testing

# Install Certbot for SSL
echo "Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "===== Setup Complete! ====="
echo "Now you need to:"
echo "1. Upload your BananaPrep code to this server"
echo "2. Run the deploy.sh script"
echo "3. Set up your DNS to point to this server's IP"
echo "4. Run: sudo certbot --nginx -d bananaprep.com -d www.bananaprep.com"