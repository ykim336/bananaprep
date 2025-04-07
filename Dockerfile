# Simplified Dockerfile with just one server
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install Octave and required packages
RUN apt-get update && apt-get install -y \
    octave \
    && rm -rf /var/lib/apt/lists/*

# Create directory structure
RUN mkdir -p server/public/data/plots
RUN chmod 777 server/public/data/plots

# Copy package files and install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy server and client files
COPY server/ ./
COPY client/ ../client/

# Expose only the server port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]