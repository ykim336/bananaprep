FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install Octave and required packages
RUN apt-get update && apt-get install -y \
    octave \
    octave-control \
    octave-signal \
    octave-image \
    liboctave-dev \
    python3 \
    python3-pip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install http-server for serving static files
RUN npm install -g http-server

# Create directory structure
RUN mkdir -p server/public/data/plots

# Set permissions for the plots directory
RUN chmod 777 server/public/data/plots

# Copy package files
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm install

# Copy server files
COPY server/ ./

# Copy client files to client directory (not in public)
COPY client/ /app/client/

# Create data directory for problems.json
RUN mkdir -p ./public/data
COPY server/public/data/problems.json ./public/data/

# Expose both ports
EXPOSE 3000 8080

# Create startup script
RUN echo '#!/bin/bash\n\
# Start the Node.js server in the background\n\
node server.js &\n\
\n\
# Start http-server for client files\n\
cd /app/client && http-server -p 8080 --cors\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

# Start both servers
CMD ["/app/start.sh"]   