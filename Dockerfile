# Use the official Node.js 16 image from the Docker Hub
FROM node:16

# Create and change to the app directory
WORKDIR /app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy local code to the container image
COPY . .


# Run the web service on container startup
CMD [ "node", "app.js" ]

# Document that the service listens on port 8080
EXPOSE 3000