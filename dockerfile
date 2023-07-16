# Use the official Node.js 14 image as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm ci --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that your Nest.js application listens on (e.g., 3000)
EXPOSE 3000

# Start the Nest.js application
CMD ["npm", "start"]



