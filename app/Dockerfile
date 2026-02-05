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

# Stage 2: Production stage
FROM node:20-alpine

# Set environment to production
ENV NODE_ENV=production

WORKDIR /app

# Only copy the production dependencies and built files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Note: Use './' if you don't have a build step (dist folder)

# Run the app as a non-root user for security
USER node

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]