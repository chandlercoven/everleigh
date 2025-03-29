#!/bin/bash

# Startup validation script for Everleigh
# This script runs during Docker container startup to validate API keys
# before the application starts.

echo "==============================================="
echo "🔑 EVERLEIGH API KEY VALIDATION"
echo "==============================================="

# Get the app directory
APP_DIR="${APP_DIR:-/app}"
cd "$APP_DIR" || { echo "❌ ERROR: Could not change to app directory"; exit 1; }

# Check for environment file locations
ROOT_ENV_FILE="$APP_DIR/.env.local"
CONFIG_ENV_FILE="$APP_DIR/config/env/.env.local"

if [ -f "$ROOT_ENV_FILE" ]; then
  echo "📋 Found environment file at $ROOT_ENV_FILE"
elif [ -f "$CONFIG_ENV_FILE" ]; then
  echo "📋 Found environment file at $CONFIG_ENV_FILE"
  # Create a symlink to ensure Next.js can find the .env.local file
  echo "📋 Creating symlink from $CONFIG_ENV_FILE to $ROOT_ENV_FILE"
  ln -sf "$CONFIG_ENV_FILE" "$ROOT_ENV_FILE"
else
  echo "⚠️ WARNING: No .env.local file found. Relying on environment variables passed to container."
fi

# Check environment variables
echo "📋 Checking environment variables..."

# Critical variables that must be set
CRITICAL_VARS=("OPENAI_API_KEY" "MONGODB_URI" "REDIS_URL")
MISSING_CRITICAL=false

for var in "${CRITICAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ CRITICAL: $var is not set"
    MISSING_CRITICAL=true
  else
    echo "✅ $var is set"
  fi
done

# Warn about recommended variables
RECOMMENDED_VARS=("LIVEKIT_API_KEY" "LIVEKIT_API_SECRET" "SENTRY_AUTH_TOKEN")

for var in "${RECOMMENDED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️ WARNING: $var is not set (recommended but not required)"
  else
    echo "✅ $var is set"
  fi
done

# Exit if critical variables are missing
if [ "$MISSING_CRITICAL" = true ]; then
  echo "❌ ERROR: Some critical environment variables are missing. Application may not function correctly."
  if [ "${FAIL_ON_MISSING_ENV:-false}" = "true" ]; then
    echo "❌ STARTUP ABORTED: FAIL_ON_MISSING_ENV is set to true"
    exit 1
  fi
fi

# Run the Node.js validation script
echo "🔎 Validating API keys..."
node scripts/validation/validate-api-keys.js --exit-on-fail

# Check the exit code
VALIDATION_RESULT=$?
if [ $VALIDATION_RESULT -eq 0 ]; then
  echo "✅ API keys validation passed"
else
  echo "⚠️ Some API keys failed validation (exit code: $VALIDATION_RESULT)"
  
  # Decide whether to fail startup based on environment
  if [ "${FAIL_ON_INVALID_KEYS:-false}" = "true" ]; then
    echo "❌ STARTUP ABORTED: API key validation failed and FAIL_ON_INVALID_KEYS is true"
    exit 1
  else
    echo "⚠️ Continuing startup despite API key validation failure"
  fi
fi

echo "==============================================="
echo "✅ VALIDATION COMPLETE - STARTING APPLICATION"
echo "==============================================="

exit 0 