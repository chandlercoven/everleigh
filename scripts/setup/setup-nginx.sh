#!/bin/bash

# Nginx Reverse Proxy Setup Script for Ubuntu 22.04
# This script installs and configures Nginx as a reverse proxy for n8n and LiveKit

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting Nginx Reverse Proxy Setup ==="

# Variables (change these to your domain names)
N8N_DOMAIN="n8n.yourdomain.com"
LIVEKIT_DOMAIN="livekit.yourdomain.com"
APP_DOMAIN="everleigh.yourdomain.com"
EMAIL="your-email@example.com"

# Ask for confirmation of domain names
echo "Please confirm the following domain names:"
echo "n8n domain: $N8N_DOMAIN"
echo "LiveKit domain: $LIVEKIT_DOMAIN"
echo "App domain: $APP_DOMAIN"
echo "Email for SSL certificates: $EMAIL"
read -p "Are these correct? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit this script with the correct domain names and email."
    exit 1
fi

# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Install Certbot for SSL certificates
echo "Installing Certbot for SSL certificates..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create Nginx configuration for n8n
echo "Creating Nginx configuration for n8n..."
cat > /tmp/n8n.conf << EOF
server {
    server_name ${N8N_DOMAIN};
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_ssl_session_reuse off;
        proxy_max_temp_file_size 0;
        proxy_redirect off;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
    
    client_max_body_size 100M;
}
EOF

# Create Nginx configuration for LiveKit
echo "Creating Nginx configuration for LiveKit..."
cat > /tmp/livekit.conf << EOF
server {
    server_name ${LIVEKIT_DOMAIN};
    
    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Special WebSocket settings
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_connect_timeout 300s;
        
        # WebRTC settings
        proxy_buffering off;
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
    
    client_max_body_size 10M;
}
EOF

# Create Nginx configuration for the main app
echo "Creating Nginx configuration for the main Everleigh app..."
cat > /tmp/everleigh.conf << EOF
server {
    server_name ${APP_DOMAIN};
    
    root /var/www/html/everleigh/out;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${LIVEKIT_DOMAIN} wss://${LIVEKIT_DOMAIN}; media-src 'self'; font-src 'self'; frame-src 'self'";
    
    client_max_body_size 10M;
}
EOF

# Install the Nginx configurations
echo "Installing Nginx configurations..."
sudo mv /tmp/n8n.conf /etc/nginx/sites-available/n8n
sudo mv /tmp/livekit.conf /etc/nginx/sites-available/livekit
sudo mv /tmp/everleigh.conf /etc/nginx/sites-available/everleigh

# Create symbolic links to enable the sites
echo "Enabling the sites..."
sudo ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/livekit /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/everleigh /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx to apply changes
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Obtain SSL certificates using Certbot
echo "Obtaining SSL certificates..."
sudo certbot --nginx --non-interactive --agree-tos --email "$EMAIL" -d "$N8N_DOMAIN" -d "$LIVEKIT_DOMAIN" -d "$APP_DOMAIN"

# Create a script to update the environment file with the new URLs
echo "Creating script to update environment variables..."
cat > ~/update-env.sh << EOF
#!/bin/bash
# Update .env.local with the new domain names

# Create backup of original .env.local
cp /var/www/html/everleigh/.env.local /var/www/html/everleigh/.env.local.backup

# Update LiveKit URLs
sed -i "s#NEXT_PUBLIC_LIVEKIT_URL=.*#NEXT_PUBLIC_LIVEKIT_URL=wss://${LIVEKIT_DOMAIN}#g" /var/www/html/everleigh/.env.local
sed -i "s#LIVEKIT_API_URL=.*#LIVEKIT_API_URL=https://${LIVEKIT_DOMAIN}#g" /var/www/html/everleigh/.env.local

# Update n8n URL
sed -i "s#N8N_SERVER_URL=.*#N8N_SERVER_URL=https://${N8N_DOMAIN}#g" /var/www/html/everleigh/.env.local

echo "Environment variables updated successfully!"
EOF

# Set executable permissions
chmod +x ~/update-env.sh

echo "===================================================================="
echo "Nginx Reverse Proxy setup completed!"
echo ""
echo "Your domains are now configured:"
echo "- n8n: https://$N8N_DOMAIN"
echo "- LiveKit: https://$LIVEKIT_DOMAIN"
echo "- Everleigh App: https://$APP_DOMAIN"
echo ""
echo "To update your environment variables, run: ~/update-env.sh"
echo ""
echo "Remember to update your LiveKit configuration to use the new domain"
echo "and restart the LiveKit server."
echo "===================================================================="

exit 0 