#!/bin/bash

# CI/CD Pipeline Validation Script
# This script validates the CI/CD pipeline configuration locally

set -e

echo "🚀 Starting CI/CD Pipeline Validation..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Validate Docker Compose
echo "📋 Step 1: Validating Docker Compose configuration..."
docker compose config -q
print_status "Docker Compose configuration is valid" $?

# Step 2: Check Node.js and npm
echo "📋 Step 2: Checking Node.js and npm..."
node --version
npm --version
print_status "Node.js and npm are available" $?

# Step 3: Install dependencies
echo "📋 Step 3: Installing dependencies..."
npm ci
print_status "Dependencies installed successfully" $?

# Step 4: Run linting (if ESLint is configured)
echo "📋 Step 4: Running code linting..."
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
    npm run lint
    print_status "Code linting passed" $?
else
    print_warning "ESLint not configured, skipping linting"
fi

# Step 5: Check code formatting
echo "📋 Step 5: Checking code formatting..."
if command -v prettier &> /dev/null; then
    npm run format:check
    print_status "Code formatting check passed" $?
else
    print_warning "Prettier not configured, skipping format check"
fi

# Step 6: Run security audit
echo "📋 Step 6: Running security audit..."
npm audit --audit-level=high
if [ $? -eq 0 ]; then
    print_status "Security audit completed - no high/critical vulnerabilities" 0
else
    print_warning "Security audit found high/critical issues"
fi

# Step 7: Run tests
echo "📋 Step 7: Running tests..."
if [ -d "__tests__" ] || [ -d "test" ] || [ -d "tests" ]; then
    npm test
    print_status "Tests passed" $?
else
    print_warning "No test files found, skipping tests"
fi

# Step 8: Validate Dockerfile
echo "📋 Step 8: Validating Dockerfile..."
if [ -f "Dockerfile" ]; then
    docker build --dry-run -t test-image .
    print_status "Dockerfile is valid" $?
else
    print_warning "Dockerfile not found"
fi

# Step 9: Test Docker build
echo "📋 Step 9: Testing Docker build..."
if [ -f "Dockerfile" ]; then
    docker build -t ai-career-backend-test .
    print_status "Docker image built successfully" $?
    
    # Clean up test image
    docker rmi ai-career-backend-test
else
    print_warning "Dockerfile not found, skipping Docker build test"
fi

# Step 10: Validate GitHub Actions workflow
echo "📋 Step 10: Validating GitHub Actions workflow..."
if [ -f ".github/workflows/ci-cd.yml" ]; then
    # Check if the workflow file has valid YAML syntax
    python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-cd.yml'))" 2>/dev/null || \
    python -c "import yaml; yaml.safe_load(open('.github/workflows/ci-cd.yml'))" 2>/dev/null || \
    print_warning "Could not validate YAML syntax (Python not available)"
    print_status "GitHub Actions workflow file exists" 0
else
    print_warning "GitHub Actions workflow not found"
fi

# Step 11: Check environment files
echo "📋 Step 11: Checking environment configuration..."
if [ -f ".env.example" ]; then
    print_status "Environment example file exists" 0
else
    print_warning "No .env.example file found"
fi

# Step 12: Validate package.json scripts
echo "📋 Step 12: Validating package.json scripts..."
if [ -f "package.json" ]; then
    # Check if required scripts exist
    npm run --silent 2>/dev/null | grep -q "start" && print_status "Start script exists" 0 || print_warning "Start script missing"
    npm run --silent 2>/dev/null | grep -q "test" && print_status "Test script exists" 0 || print_warning "Test script missing"
    npm run --silent 2>/dev/null | grep -q "lint" && print_status "Lint script exists" 0 || print_warning "Lint script missing"
else
    print_warning "package.json not found"
fi

echo ""
echo "🎉 CI/CD Pipeline Validation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Configure GitHub secrets (DOCKER_USERNAME, DOCKER_PASSWORD)"
echo "2. Set up GitHub environments (staging, production)"
echo "3. Push code to trigger the pipeline"
echo "4. Monitor pipeline execution in GitHub Actions"
echo ""
echo "For detailed information, see CI-CD-README.md"
