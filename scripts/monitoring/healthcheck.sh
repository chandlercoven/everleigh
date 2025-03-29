#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if a service is running
check_service() {
    local service=$1
    local status=$(docker-compose ps $service | grep -o "Up")
    
    if [ "$status" = "Up" ]; then
        log "${GREEN}✓ $service is running${NC}"
        return 0
    else
        log "${RED}✗ $service is not running${NC}"
        return 1
    fi
}

# Check service health endpoint
check_health_endpoint() {
    local service=$1
    local endpoint=$2
    
    if curl -s -f "$endpoint" > /dev/null; then
        log "${GREEN}✓ $service health check passed${NC}"
        return 0
    else
        log "${RED}✗ $service health check failed${NC}"
        return 1
    fi
}

# Check container resources
check_resources() {
    local service=$1
    local stats=$(docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" $(docker-compose ps -q $service))
    
    echo "$stats" | while IFS=, read -r name cpu mem; do
        # Remove % from CPU
        cpu=${cpu//%/}
        
        # Check if CPU usage is high
        if (( $(echo "$cpu > 80" | bc -l) )); then
            log "${YELLOW}⚠ High CPU usage for $service: ${cpu}%${NC}"
        fi
        
        # Check memory usage
        log "${GREEN}✓ $service resource usage - CPU: ${cpu}%, Memory: $mem${NC}"
    done
}

# Main health check
main() {
    log "Starting health check..."
    
    # Check Next.js
    check_service "nextjs" && \
    check_health_endpoint "nextjs" "http://localhost:3002/api/ping" && \
    check_resources "nextjs"
    
    # Check MongoDB
    check_service "mongodb" && \
    docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null && \
    check_resources "mongodb"
    
    # Check Redis
    check_service "redis" && \
    docker-compose exec -T redis redis-cli ping | grep -q "PONG" && \
    check_resources "redis"
    
    # Check n8n
    check_service "n8n" && \
    check_health_endpoint "n8n" "http://localhost:5678/healthz" && \
    check_resources "n8n"
    
    # Check LiveKit
    check_service "livekit" && \
    check_resources "livekit"
    
    log "Health check completed"
}

# Run main function
main 