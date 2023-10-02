# Use an official Node.js runtime as the base image
FROM node:18

ARG SSH_PUBLIC_KEY=""
ARG SSH_PRIVATE_KEY=""

# Set the working directory in the container
WORKDIR /usr/src/app

# Authorize SSH Host
RUN mkdir -p /root/.ssh && \
    chmod 0700 /root/.ssh
# See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
COPY known_hosts > /root/.ssh/known_hosts/

# Add the keys and set permissions
RUN echo "$SSH_PUBLIC_KEY" > /root/.ssh/id_rsa && \
    echo "$SSH_PRIVATE_KEY" > /root/.ssh/id_rsa.pub && \
    chmod 600 /root/.ssh/id_rsa && \
    chmod 600 /root/.ssh/id_rsa.pub

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose a port (replace 3000 with your application's port)
EXPOSE 3000

# Define the command to start your Node.js application
CMD ["npm", "start"]
