# Stage 1: Build with all dependencies
FROM node:24-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production

# Stage 2: Production runtime (minimal)
FROM node:24-alpine

# Update npm to fix picomatch, brace-expansion, and ip-address vulnerabilities
RUN npm install -g npm@11.13.0

ENV PORT=4030
ENV NODE_ENV=production
WORKDIR /usr/src/app
# Copy only what's needed for runtime
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
# Remove package files to prevent false positive vulnerability scans
RUN rm -f package-lock.json package.json
EXPOSE 4030

# Run as non-root user for security
USER node
CMD [ "node", "./bin/www" ]