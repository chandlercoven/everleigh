#!/bin/bash

# Everleigh Deployment Test Script
# This script tests if all deployed components are working correctly

# Set text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}Everleigh Deployment Test${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo

# Function to check if a service is running
check_service() {
  service_name=$1
  if systemctl is-active --quiet $service_name; then
    echo -e "${GREEN}✓ $service_name is running${NC}"
    return 0
  else
    echo -e "${RED}✗ $service_name is not running${NC}"
    return 1
  fi
}

# Function to check if a port is open
check_port() {
  port=$1
  service_name=$2
  if nc -z localhost $port; then
    echo -e "${GREEN}✓ Port $port ($service_name) is open${NC}"
    return 0
  else
    echo -e "${RED}✗ Port $port ($service_name) is not open${NC}"
    return 1
  fi
}

# Function to check MongoDB connection
check_mongodb() {
  if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB connection successful${NC}"
    return 0
  else
    echo -e "${RED}✗ MongoDB connection failed${NC}"
    return 1
  fi
}

# Function to check Docker container status
check_docker_container() {
  container_name=$1
  if docker ps | grep -q $container_name; then
    echo -e "${GREEN}✓ Docker container '$container_name' is running${NC}"
    return 0
  else
    echo -e "${RED}✗ Docker container '$container_name' is not running${NC}"
    return 1
  fi
}

# Function to check if a URL is reachable
check_url() {
  url=$1
  service_name=$2
  status_code=$(curl -s -o /dev/null -w "%{http_code}" $url || echo "failed")
  
  if [ "$status_code" = "200" ] || [ "$status_code" = "301" ] || [ "$status_code" = "302" ]; then
    echo -e "${GREEN}✓ URL $url ($service_name) is reachable (status: $status_code)${NC}"
    return 0
  else
    echo -e "${RED}✗ URL $url ($service_name) is not reachable (status: $status_code)${NC}"
    return 1
  fi
}

echo -e "${YELLOW}Checking system services...${NC}"
# Check system services
services_ok=true
check_service "nginx" || services_ok=false
check_service "mongod" || services_ok=false
check_service "n8n" || services_ok=false

echo
echo -e "${YELLOW}Checking ports...${NC}"
# Check ports
ports_ok=true
check_port 80 "HTTP" || ports_ok=false
check_port 443 "HTTPS" || ports_ok=false
check_port 27017 "MongoDB" || ports_ok=false
check_port 5678 "n8n" || ports_ok=false
check_port 7880 "LiveKit HTTP" || ports_ok=false
check_port 7881 "LiveKit TCP" || ports_ok=false
check_port 7882 "LiveKit UDP" || ports_ok=false

echo
echo -e "${YELLOW}Checking database connection...${NC}"
# Check MongoDB connection
db_ok=true
check_mongodb || db_ok=false

echo
echo -e "${YELLOW}Checking Docker containers...${NC}"
# Check Docker containers
docker_ok=true
check_docker_container "livekit" || docker_ok=false

echo
echo -e "${YELLOW}Checking local URLs...${NC}"
# Check local URLs
urls_ok=true
check_url "http://localhost" "Nginx" || urls_ok=false
check_url "http://localhost:5678" "n8n" || urls_ok=false
check_url "http://localhost:7880" "LiveKit" || urls_ok=false

echo
echo -e "${BLUE}===================================================================${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "${BLUE}===================================================================${NC}"

# Print summary
if $services_ok; then
  echo -e "${GREEN}✓ System services: All checked services are running${NC}"
else
  echo -e "${RED}✗ System services: Some services are not running${NC}"
fi

if $ports_ok; then
  echo -e "${GREEN}✓ Ports: All required ports are open${NC}"
else
  echo -e "${RED}✗ Ports: Some required ports are not open${NC}"
fi

if $db_ok; then
  echo -e "${GREEN}✓ Database: MongoDB connection is successful${NC}"
else
  echo -e "${RED}✗ Database: MongoDB connection failed${NC}"
fi

if $docker_ok; then
  echo -e "${GREEN}✓ Docker: All required containers are running${NC}"
else
  echo -e "${RED}✗ Docker: Some containers are not running${NC}"
fi

if $urls_ok; then
  echo -e "${GREEN}✓ URLs: All local URLs are reachable${NC}"
else
  echo -e "${RED}✗ URLs: Some local URLs are not reachable${NC}"
fi

echo
if $services_ok && $ports_ok && $db_ok && $docker_ok && $urls_ok; then
  echo -e "${GREEN}All tests passed! Everleigh deployment appears to be working correctly.${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the issues reported above.${NC}"
  exit 1
fi 