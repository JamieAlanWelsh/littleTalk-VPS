FROM mcr.microsoft.com/devcontainers/python:3.11

# Remove the yarn repository because it complains about missing GPG keys and we don't need it
RUN rm -f /etc/apt/sources.list.d/yarn.list

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    nodejs \
    npm

# Install pnpm globally
RUN npm install -g pnpm
