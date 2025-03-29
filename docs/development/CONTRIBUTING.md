# Contributing to Everleigh

Thank you for your interest in contributing to Everleigh! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. **Prerequisites**
   - Node.js 20.x
   - Docker and Docker Compose
   - Git

2. **Local Development**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/everleigh.git
   cd everleigh

   # Copy environment files
   cp config/env/.env.example config/env/.env.local

   # Start development environment
   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml up -d
   ```

3. **Development Workflow**
   ```bash
   # Create a new branch
   git checkout -b feature/your-feature-name

   # Make your changes
   # ...

   # Run tests
   npm test

   # Run linting
   npm run lint

   # Commit your changes
   git commit -m "feat: your feature description"

   # Push to your branch
   git push origin feature/your-feature-name
   ```

## Code Style

- Follow the [Next.js Style Guide](https://nextjs.org/docs/basic-features/eslint)
- Use TypeScript for all new code
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
- Keep functions small and focused
- Write meaningful comments
- Include tests for new features

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PRs
- Include integration tests for API endpoints
- Test across different browsers and devices

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the docs/ with any new documentation
3. The PR will be merged once you have the sign-off of at least one other developer
4. Make sure the CI checks pass

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Documentation

- Update relevant documentation for any changes
- Add JSDoc comments for new functions
- Keep the API documentation up to date
- Document any new environment variables

## Release Process

1. Update version in package.json
2. Create a new tag
3. Update CHANGELOG.md
4. Create a release on GitHub

## Getting Help

- Check the [documentation](docs/)
- Open an issue
- Join our community chat

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 