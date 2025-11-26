#!/bin/sh
set -e

# Create runtime config file with environment variables
cat > /usr/share/nginx/html/config.js <<EOF
window.ENV = {
  N8N_API_KEY: '${N8N_API_KEY}',
  GITHUB_CLIENT_ID: '${GITHUB_CLIENT_ID}',
  GITHUB_APP_ID: '${GITHUB_APP_ID}'
};
EOF

# Start API server in background
cd /app/api-server
node index.js &
API_PID=$!

# Start nginx in foreground
nginx -g 'daemon off;' &
NGINX_PID=$!

# Wait for either process to exit
wait -n $API_PID $NGINX_PID

# Exit with status of process that exited first
exit $?
