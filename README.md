# Everleigh

A modern Next.js application with Docker containerization.

## Project Structure

```
everleigh/
├── config/                 # Configuration files
│   ├── apache/            # Apache configuration files
│   └── livekit/           # LiveKit configuration
├── docker/                # Docker configuration
│   ├── config/           # Service-specific configurations
│   ├── scripts/          # Docker-related utility scripts
│   ├── Dockerfile.dev    # Development Dockerfile
│   ├── Dockerfile.prod   # Production Dockerfile
│   └── docker-compose.yml
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   ├── deployment/       # Deployment guides and status
│   └── development/      # Development guides
├── scripts/              # Utility scripts
│   ├── backup/          # Backup scripts
│   ├── deploy/          # Deployment scripts
│   └── monitoring/      # Monitoring scripts
├── .github/              # GitHub configuration
│   └── workflows/       # GitHub Actions workflows
├── components/          # React components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and shared code
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # CSS and styling files
└── types/              # TypeScript type definitions
```

## Quick Start

### Development

```bash
# Start development environment
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml up -d

# View logs
docker-compose logs -f

# Stop development environment
docker-compose down
```

### Production

```bash
# Deploy to production
sudo ./scripts/deploy/deploy.sh

# Monitor services
./scripts/monitoring/healthcheck.sh

# Backup data
./scripts/backup/backup-mongodb.sh
```

## Documentation

- [API Documentation](docs/api/API.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Development Guide](docs/development/DEPENDENCY_MODERNIZATION.md)

## Environment Variables

Required environment variables are stored in `.env` files:
- `.env` - Base environment variables
- `.env.production` - Production-specific variables
- `.env.development` - Development-specific variables

## Services

- **Next.js Application**: Main application server
- **MongoDB**: Primary database
- **Redis**: Caching layer
- **n8n**: Workflow automation
- **LiveKit**: Real-time communication

## Security

- All services run as non-root users
- Sensitive data is managed through environment variables
- Network isolation using bridge networks
- Resource limits defined for all containers

## Monitoring

- Health checks configured for all services
- Log rotation enabled
- Resource usage monitoring

## Maintenance

### Backup Procedures

1. MongoDB Backup:
```bash
./scripts/backup/backup-mongodb.sh
```

### Health Checks

Run health checks:
```bash
./scripts/monitoring/healthcheck.sh
```

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