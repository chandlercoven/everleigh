# API Key Validation for Everleigh

This document explains how API key validation works in the Everleigh project and how to use the validation tools.

## Overview

Everleigh uses several external APIs that require valid API keys:

- OpenAI API (for AI capabilities)
- LiveKit API (for real-time communication)
- Other services like Sentry, etc.

The validation system helps prevent runtime errors by validating these keys before the application starts.

## Validation Methods

### 1. On-Startup Validation

When the Docker container starts, it automatically:

1. Checks for environment variables
2. Validates critical API keys
3. Logs any issues found
4. Either continues or fails startup (depending on configuration)

Configuration options:
- `FAIL_ON_MISSING_ENV=true` - Will abort startup if critical environment variables are missing
- `FAIL_ON_INVALID_KEYS=true` - Will abort startup if API keys are invalid

### 2. Pre-Deployment Validation

Before deploying to production, run:

```bash
./scripts/pre-deploy-check.sh
```

This script:
- Validates all environment variables
- Checks for placeholder values
- Tests API key connectivity
- Exits with an error code if issues are found

### 3. Manual Validation

To validate API keys manually:

```bash
node scripts/validation/validate-api-keys.js [--exit-on-fail] [--silent]
```

Options:
- `--exit-on-fail`: Exits with code 1 if validation fails
- `--silent`: Only outputs on errors (useful for cron jobs)

## Environment Variables

The application looks for environment variables in the following places:

1. `.env.local` in the project root directory
2. `config/env/.env.local` (project-specific location)
3. System environment variables

For Docker deployments, these variables can be:
- Mounted as volumes in docker-compose.yml
- Set directly in docker-compose.yml
- Loaded from the host environment

## Troubleshooting

If API key validation fails:

1. Check if the key format is correct
2. Verify that the key has the necessary permissions
3. Test the key directly with the service's API
4. Check for rate limiting or other issues

## Adding New API Keys

To add validation for a new API service:

1. Add the validation function in `scripts/validation/validate-api-keys.js`
2. Add the environment variable to the list of critical or recommended variables in `docker/scripts/startup-validation.sh`
3. Update the pre-deployment check in `scripts/pre-deploy-check.sh`

## Cron Job for Continuous Monitoring

Consider setting up a cron job to periodically validate API keys:

```bash
# Example cron entry (every 6 hours)
0 */6 * * * cd /var/www/html/everleigh && node scripts/validation/validate-api-keys.js --silent >> /var/log/everleigh/api-validation.log 2>&1
```

This helps detect API key issues before they affect your users.

## Production Deployment

When deploying to production:

1. Run `./scripts/pre-deploy-check.sh` to validate everything
2. Run `./scripts/production-build.sh` to build Docker images
3. Use `docker-compose -f docker/docker-compose.yml up -d` to deploy

## Security Considerations

- Never commit real API keys to version control
- Use environment variables, not hard-coded values
- Consider using a secret management solution for production
- Regularly rotate API keys for security 