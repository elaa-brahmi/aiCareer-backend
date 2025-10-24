# AI Career Backend - CI/CD Pipeline

This repository contains a comprehensive CI/CD pipeline for the AI Career Backend application.

## 🚀 CI/CD Pipeline Overview

The CI/CD pipeline is configured using GitHub Actions and includes the following stages:

### 1. Code Quality & Linting
- **Security Audit**: npm audit for vulnerability scanning

### 2. Docker Validation
- **Docker Compose**: Configuration validation
- **Dockerfile**: Build validation

### 3. Build & Test
- **Node.js Setup**: Node.js 18 LTS environment
- **Database**: PostgreSQL with pgvector extension
- **Dependencies**: npm ci for clean installs
- **Tests**: Jest test suite execution
- **Health Checks**: Application startup validation

### 4. Docker Build & Push
- **Multi-platform**: Build for multiple architectures
- **Caching**: GitHub Actions cache for faster builds
- **Registry**: Push to Docker Hub

### 5. Deployment
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch
- **Health Checks**: Post-deployment validation

## 📋 Prerequisites

### Required Secrets
Configure the following secrets in your GitHub repository:

```bash
# Docker Hub credentials
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Environment variables (if needed)
PINECONE_API_KEY=your-pinecone-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
STRIPE_SECRET_KEY=your-stripe-secret-key
FRONTEND_URL=your-frontend-url
```

### Required Environments
Set up the following environments in GitHub:
- `staging`: For staging deployments
- `production`: For production deployments

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Setup
```bash
# Install dependencies
npm install

# Start database
docker compose up -d

# Run in development mode
npm run dev
```

### Available Scripts
```bash
# Development
npm run dev              # Start with nodemon
npm start               # Start production server

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# Docker
npm run docker:build           # Build Docker image
npm run docker:run            # Run Docker container
npm run docker:compose:up     # Start with docker-compose
npm run docker:compose:down   # Stop docker-compose
npm run docker:compose:logs   # View logs
```

## 🐳 Docker Configuration

### Dockerfile
- **Base Image**: Node.js 18 Alpine
- **Security**: Non-root user
- **Health Check**: Built-in health monitoring
- **Optimization**: Multi-stage build ready

### Docker Compose
- **Database**: PostgreSQL with pgvector extension
- **Persistence**: Volume for data persistence
- **Networking**: Proper port mapping

## 🧪 Testing

### Test Structure
```
__tests__/
├── health.test.js      # Health check tests
└── ...                 # Additional test files
```

### Test Configuration
- **Framework**: Jest
- **Environment**: Node.js test environment
- **Coverage**: Comprehensive coverage reporting
- **Mocking**: External services mocked

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Health Checks

### Health Endpoint
The application exposes a health check endpoint:
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Docker Health Check
The Dockerfile includes a built-in health check that validates the application is responding correctly.

## 🔧 Configuration Files

### CI/CD Pipeline
- `.github/workflows/ci-cd.yml`: Main pipeline configuration

### Docker
- `Dockerfile`: Application containerization
- `docker-compose.yml`: Local development setup
- `.dockerignore`: Docker build optimization

### Code Quality
- `.eslintrc.js`: ESLint configuration
- `.prettierrc`: Prettier configuration
- `jest.config.js`: Jest test configuration

### Package Management
- `package.json`: Dependencies and scripts
- `package-lock.json`: Locked dependency versions

## 🚨 Troubleshooting

### Common Issues

1. **Docker Build Fails**
   - Check Dockerfile syntax
   - Verify all dependencies are listed in package.json
   - Ensure .dockerignore is properly configured

2. **Tests Fail**
   - Verify database connection
   - Check environment variables
   - Ensure all dependencies are installed

3. **Deployment Issues**
   - Verify secrets are configured
   - Check environment permissions
   - Validate server connectivity

### Debug Commands
```bash
# Validate docker-compose
docker compose config -q

# Check application logs
docker compose logs -f

# Test database connection
docker compose exec db psql -U postgres -d aiCareer
```

## 📈 Pipeline Metrics

The pipeline provides the following metrics:
- **Build Time**: Total pipeline execution time
- **Test Coverage**: Code coverage percentage
- **Security Score**: Vulnerability assessment
- **Deployment Status**: Success/failure rates

## 🔄 Continuous Improvement

### Regular Updates
- Update dependencies monthly
- Review security advisories
- Optimize Docker images
- Enhance test coverage

### Monitoring
- Set up alerts for failed deployments
- Monitor application performance
- Track error rates
- Review pipeline metrics

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
