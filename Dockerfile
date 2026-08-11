FROM node:24-alpine3.23

# Upgrade npm to fix vulnerabilities
RUN npm install -g npm@11.14.1

ENV PORT=4030
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# Copy application code
COPY --chown=node:node . .

EXPOSE 4030

CMD [ "node", "./bin/www" ]
