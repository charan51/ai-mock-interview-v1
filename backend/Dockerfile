# Use official Node.js 18 as the base image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port the backend will run on
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]