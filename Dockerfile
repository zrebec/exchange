# Base image
FROM node:16

# Set working directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Transpile TypeScript to JavaScript
COPY . .
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD [ "npm", "start" ]
