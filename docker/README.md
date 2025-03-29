# Everleigh Docker Configuration

This directory contains all Docker-related configurations and scripts for the Everleigh project.

## Directory Structure

```
docker/
├── config/           # Service-specific configurations
│   ├── mongodb/     # MongoDB configuration files
│   ├── redis/       # Redis configuration files
│   └── n8n/         # n8n workflow configurations
├── scripts/         # Docker-related utility scripts
├── Dockerfile.dev   # Development Dockerfile
├── Dockerfile.prod  # Production Dockerfile
├── docker-compose.yml
└── docker-compose.override.yml
```

## Services

- **Next.js Application**: Main application server
- **MongoDB**: Primary database
- **Redis**: Caching layer
- **n8n**: Workflow automation
- **LiveKit**: Real-time communication

## Environment Variables

Required environment variables are stored in `.env` files:
- `.env` - Base environment variables
- `.env.production` - Production-specific variables
- `.env.development` - Development-specific variables

## Usage

### Development

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# View logs
docker-compose logs -f

# Stop development environment
docker-compose down
```

### Production

```bash
# Build and start production environment
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Stop production environment
docker-compose down
```

## Maintenance

### Backup Procedures

1. MongoDB Backup:
```bash
./scripts/backup-mongodb.sh
```

2. Redis Backup:
```bash
./scripts/backup-redis.sh
```

### Health Checks

Run health checks:
```bash
./scripts/healthcheck.sh
```

## Security Considerations

- All services run as non-root users
- Sensitive data is managed through environment variables
- Network isolation using bridge networks
- Resource limits defined for all containers

## Monitoring

- Health checks configured for all services
- Log rotation enabled
- Resource usage monitoring

## Troubleshooting

1. Check service logs:
```bash
docker-compose logs -f [service-name]
```

2. Verify service health:
```bash
docker-compose ps
```

3. Restart service:
```bash
docker-compose restart [service-name]
```

## Best Practices

1. Always use specific version tags for images
2. Keep environment variables in appropriate .env files
3. Regular backups of persistent data
4. Monitor resource usage
5. Keep dependencies updated 