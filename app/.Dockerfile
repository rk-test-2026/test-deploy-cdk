# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
# Doing this before copying the full source code leverages Docker's layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (only needed if using TypeScript, React, etc.)
# RUN npm run build