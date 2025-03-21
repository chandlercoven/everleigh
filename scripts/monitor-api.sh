#!/bin/bash

# Everleigh API Monitoring Script
# This script checks the health of the API endpoints and logs the results

# Configuration
API_HOST="api.everleigh.ai"
LOG_FILE="/var/log/everleigh/api-monitor.log"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="password"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Create log directory if it doesn't exist
mkdir -p $(dirname $LOG_FILE)

# Log function
log() {
  echo "[$TIMESTAMP] $1" >> $LOG_FILE
  echo "[$TIMESTAMP] $1"
}

# Check test endpoint
check_test_endpoint() {
  log "Checking test endpoint..."
  TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$API_HOST/api/test)
  
  if [ "$TEST_RESPONSE" == "200" ]; then
    log "✅ Test endpoint is working (HTTP $TEST_RESPONSE)"
    return 0
  else
    log "❌ Test endpoint failed (HTTP $TEST_RESPONSE)"
    return 1
  fi
}

# Check authentication
check_auth() {
  log "Checking authentication..."
  AUTH_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    http://$API_HOST/api/auth/login)
  
  # Check if response contains a token
  if [[ $AUTH_RESPONSE == *"token"* ]]; then
    TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    log "✅ Authentication is working, token received"
    return 0
  else
    log "❌ Authentication failed"
    return 1
  fi
}

# Check protected endpoint
check_protected_endpoint() {
  log "Checking protected endpoint..."
  
  # Get token first
  AUTH_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    http://$API_HOST/api/auth/login)
  
  TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  
  if [ -z "$TOKEN" ]; then
    log "❌ Failed to get token for protected endpoint test"
    return 1
  fi
  
  PROTECTED_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
    http://$API_HOST/api/protected)
  
  if [ "$PROTECTED_RESPONSE" == "200" ]; then
    log "✅ Protected endpoint is working (HTTP $PROTECTED_RESPONSE)"
    return 0
  else
    log "❌ Protected endpoint failed (HTTP $PROTECTED_RESPONSE)"
    return 1
  fi
}

# Check PM2 status
check_pm2_status() {
  log "Checking PM2 status..."
  
  PM2_STATUS=$(pm2 list | grep -c "online")
  
  if [ "$PM2_STATUS" -gt 0 ]; then
    log "✅ $PM2_STATUS PM2 processes are online"
    return 0
  else
    log "❌ No online PM2 processes found"
    return 1
  fi
}

# Main function
main() {
  log "=== Starting API Health Check ==="
  
  FAILURES=0
  
  check_test_endpoint
  FAILURES=$((FAILURES + $?))
  
  check_auth
  FAILURES=$((FAILURES + $?))
  
  check_protected_endpoint
  FAILURES=$((FAILURES + $?))
  
  check_pm2_status
  FAILURES=$((FAILURES + $?))
  
  log "=== Health Check Complete ==="
  
  if [ $FAILURES -eq 0 ]; then
    log "🎉 All checks passed successfully!"
  else
    log "⚠️ $FAILURES checks failed"
  fi
  
  return $FAILURES
}

# Run the main function
main 