# Everleigh Server Scripts

This directory contains scripts for installing, configuring, and maintaining the Everleigh Voice AI server components.

## Installation Scripts

- **install-everleigh-server.sh** - Master installation script that runs all component installation scripts
- **setup-mongodb.sh** - Installs and configures MongoDB database server
- **setup-n8n.sh** - Installs and configures n8n workflow automation
- **setup-livekit.sh** - Installs and configures LiveKit real-time communication server
- **setup-nginx.sh** - Installs and configures Nginx as a reverse proxy with SSL

## Database Scripts

- **setup-mongodb-indexes.js** - Creates optimized indexes in MongoDB collections
- **backup-mongodb.sh** - Creates automated backups of MongoDB data

## Maintenance Scripts

- **setup-cron-jobs.sh** - Sets up automated maintenance tasks as cron jobs
- **test-deployment.sh** - Tests if all deployed components are working correctly

## Workflow Templates

The `n8n-workflow-templates` directory contains JSON templates for n8n workflows:

- **weather-workflow.json** - Retrieves weather information using OpenWeatherMap API
- **calendar-workflow.json** - Integrates with Google Calendar for managing events
- **reminder-workflow.json** - Manages reminders with notifications

## Usage Instructions

### Initial Installation

To perform a full installation of all components:

```bash
sudo ./install-everleigh-server.sh
```

This will:
1. Install and configure MongoDB
2. Install and configure n8n
3. Install and configure LiveKit
4. Set up Nginx as a reverse proxy

### Individual Component Installation

If you want to install components individually:

```bash
# Install MongoDB only
sudo ./setup-mongodb.sh

# Install n8n only
sudo ./setup-n8n.sh

# Install LiveKit only
sudo ./setup-livekit.sh

# Set up Nginx only
sudo ./setup-nginx.sh
```

### Setting Up Maintenance Tasks

To set up automated maintenance tasks:

```bash
sudo ./setup-cron-jobs.sh
```

This will configure cron jobs for:
- Daily MongoDB backups
- Weekly system updates
- Weekly MongoDB index verification
- SSL certificate renewal
- Log rotation

### Testing the Deployment

To test if all components are working correctly:

```bash
./test-deployment.sh
```

### Importing n8n Workflows

To import the workflow templates into n8n:
1. Access the n8n web interface (http://localhost:5678 or your configured domain)
2. Go to "Workflows" section
3. Click "Import from file"
4. Select the workflow JSON file from the `n8n-workflow-templates` directory

## Maintenance Tasks

### Creating a MongoDB Backup Manually

```bash
sudo ./backup-mongodb.sh
```

### Configuring MongoDB Indexes

```bash
mongosh ./setup-mongodb-indexes.js
```

## Notes

- Edit the configuration variables at the top of each script before running
- Some scripts require root privileges (use sudo)
- Make sure to update database credentials in relevant scripts
- Configure your domain names in the Nginx configuration 