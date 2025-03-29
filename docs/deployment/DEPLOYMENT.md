# Everleigh Deployment Guide

This document outlines the standard process for deploying the Everleigh application after making changes.

## Standard Deployment Method: Docker

**Docker is the only supported deployment method for Everleigh.** All other deployment methods (PM2, manual) are deprecated and should not be used.

### To Deploy Changes:

1. Make your code changes
2. Run the deployment script:

```bash
cd /var/www/html/everleigh
sudo ./deploy.sh rebuild
```

This will:
- Rebuild the Next.js container with your changes
- Restart the container
- Make your changes immediately available

### Additional Commands

The deployment script provides other useful commands:

```bash
# View the status of all containers
sudo ./deploy.sh status

# View logs from the Next.js container
sudo ./deploy.sh logs nextjs

# Restart all containers
sudo ./deploy.sh restart
```

## Troubleshooting

If you encounter issues with deployment:

1. Check application logs:
   ```bash
   sudo ./deploy.sh logs nextjs
   ```

2. Verify container status:
   ```bash
   sudo ./deploy.sh status
   ```

3. Try restarting all services:
   ```bash
   sudo ./deploy.sh restart
   ```

For persistent issues, please review the Docker configuration in `docker-compose.yml`.

## Migration from PM2 to Docker

If your deployment was previously using PM2, refer to [MIGRATION_TO_DOCKER.md](MIGRATION_TO_DOCKER.md) for detailed migration steps. 