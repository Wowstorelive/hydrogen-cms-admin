FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
# Install nginx
RUN apk add --no-cache nginx

# Copy frontend build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Setup API server
WORKDIR /app/api-server
COPY api-server/package*.json ./
RUN npm ci --production
COPY api-server/ ./

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
