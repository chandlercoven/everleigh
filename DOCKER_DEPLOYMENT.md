# Everleigh Docker Deployment Guide

This guide explains how to deploy the Everleigh application using Docker containers.

## Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- Apache2 with mod_proxy and mod_ssl enabled
- Let's Encrypt SSL certificates

## Setup Instructions

### 1. Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url> /var/www/html/everleigh
   cd /var/www/html/everleigh
   ```

2. Prepare environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local to set up your environment variables
   nano .env.local
   ```

### 2. Deploy with Docker

1. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Start all containers:
   ```bash
   ./deploy.sh start
   ```

3. Check container status:
   ```bash
   ./deploy.sh status
   ```

### 3. Apache Configuration

1. Copy the Apache configuration:
   ```bash
   sudo cp apache-docker.conf /etc/apache2/sites-available/everleigh.ai-le-ssl.conf
   ```

2. Enable the site and required modules:
   ```bash
   sudo a2ensite everleigh.ai-le-ssl.conf
   sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
   ```

3. Test and restart Apache:
   ```bash
   sudo apache2ctl configtest
   sudo systemctl restart apache2
   ```

## Management Commands

Use the `deploy.sh` script to manage your containerized application:

- `./deploy.sh start` - Start all containers
- `./deploy.sh stop` - Stop all containers
- `./deploy.sh restart` - Restart all containers
- `./deploy.sh status` - Show container status
- `./deploy.sh logs nextjs` - Show logs for Next.js container
- `./deploy.sh logs n8n` - Show logs for n8n container
- `./deploy.sh logs livekit` - Show logs for LiveKit container
- `./deploy.sh logs mongodb` - Show logs for MongoDB container
- `./deploy.sh backup` - Create a backup of MongoDB data
- `./deploy.sh rebuild` - Rebuild and restart the Next.js container

## Project Structure

- `Dockerfile` - Builds the Next.js application
- `docker-compose.yml` - Orchestrates all services
- `livekit.yaml` - Configuration for LiveKit
- `deploy.sh` - Management script for containerized services
- `apache-docker.conf` - Apache configuration for containerized setup

## Backup and Restore

### Create a backup
```bash
./deploy.sh backup
```

### Restore a backup
```bash
# Replace TIMESTAMP with the actual backup timestamp
docker cp ./backups/backup_TIMESTAMP/. $(docker-compose ps -q mongodb):/tmp/restore/
docker-compose exec mongodb mongorestore --host localhost --port 27017 \
  --username everleighAdmin --password EverleighAdmin2685a57376c7f8ab \
  --authenticationDatabase admin \
  /tmp/restore
```

## Troubleshooting

### Container failing to start
Check logs for the specific service:
```bash
./deploy.sh logs <service_name>
```

### Database connection issues
Ensure the MongoDB container is running and the connection string is correct.

### Apache proxy issues
Check Apache error logs:
```bash
sudo tail -f /var/log/apache2/everleigh.ai-error.log
``` 