# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy remaining code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the app
CMD ["node", "server.js"]
