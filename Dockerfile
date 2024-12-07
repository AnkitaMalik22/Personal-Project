# Use the official Node.js 16 image from the Docker Hub
FROM node:18


# Install necessary dependencies for Puppeteer and Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  libxshmfence1 \
  libglu1-mesa \
  chromium \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*


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



$2a$10$Tb2sKHLy1kkGMcjnPSxH3.MsawuTudxWMSh3Md1IuDAYzbR0BNxea


$2a$10$ZQ4WEf4EnPrJ7LtqMI/8WuOOFQe0GTLizH80IbEjb3Z3AYwmvDuvi