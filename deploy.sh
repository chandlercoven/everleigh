#!/bin/bash

# Script to manage Docker operations for Everleigh application

# Function to display help menu
function show_help {
    echo "Everleigh Docker Management Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start           - Start all containers"
    echo "  stop            - Stop all containers"
    echo "  restart         - Restart all containers"
    echo "  status          - Show container status"
    echo "  logs [service]  - Show logs for a specific service (nextjs, n8n, livekit, mongodb)"
    echo "  backup          - Create a backup of MongoDB data"
    echo "  rebuild         - Rebuild and restart the Next.js container"
    echo "  help            - Show this help information"
    echo ""
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to start containers
function start_containers {
    echo "Starting Everleigh containers..."
    docker-compose up -d
    echo "Containers started. Use './deploy.sh status' to check status."
}

# Function to stop containers
function stop_containers {
    echo "Stopping Everleigh containers..."
    docker-compose down
    echo "Containers stopped."
}

# Function to restart containers
function restart_containers {
    echo "Restarting Everleigh containers..."
    docker-compose restart
    echo "Containers restarted. Use './deploy.sh status' to check status."
}

# Function to show container status
function show_status {
    echo "Container Status:"
    docker-compose ps
}

# Function to show logs
function show_logs {
    if [ -z "$1" ]; then
        echo "Please specify a service (nextjs, n8n, livekit, mongodb)"
        exit 1
    fi
    
    echo "Showing logs for $1..."
    docker-compose logs --tail=100 -f "$1"
}

# Function to backup MongoDB data
function backup_mongodb {
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="./backups"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    echo "Creating MongoDB backup..."
    docker-compose exec mongodb mongodump --host localhost --port 27017 \
        --username everleighAdmin --password EverleighAdmin2685a57376c7f8ab \
        --authenticationDatabase admin \
        --out /data/db/backup_"$TIMESTAMP"
    
    # Copy backup from container to host
    docker cp $(docker-compose ps -q mongodb):/data/db/backup_"$TIMESTAMP" "$BACKUP_DIR"
    
    # Remove backup from container
    docker-compose exec mongodb rm -rf /data/db/backup_"$TIMESTAMP"
    
    echo "Backup created at $BACKUP_DIR/backup_$TIMESTAMP"
}

# Function to rebuild the Next.js container
function rebuild_nextjs {
    echo "Rebuilding Next.js container..."
    docker-compose build nextjs
    docker-compose up -d nextjs
    echo "Next.js container rebuilt and started."
}

# Parse command line arguments
case "$1" in
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    backup)
        backup_mongodb
        ;;
    rebuild)
        rebuild_nextjs
        ;;
    help|*)
        show_help
        ;;
esac

exit 0 