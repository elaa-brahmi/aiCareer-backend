@echo off
REM CI/CD Pipeline Validation Script for Windows
REM This script validates the CI/CD pipeline configuration locally

echo 🚀 Starting CI/CD Pipeline Validation...
echo ========================================

REM Step 1: Validate Docker Compose
echo 📋 Step 1: Validating Docker Compose configuration...
docker compose config -q
if %errorlevel% neq 0 (
    echo ❌ Docker Compose configuration is invalid
    exit /b 1
) else (
    echo ✅ Docker Compose configuration is valid
)

REM Step 2: Check Node.js and npm
echo 📋 Step 2: Checking Node.js and npm...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not available
    exit /b 1
) else (
    echo ✅ Node.js is available
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    exit /b 1
) else (
    echo ✅ npm is available
)

REM Step 3: Install dependencies
echo 📋 Step 3: Installing dependencies...
npm ci
if %errorlevel% neq 0 (
    echo ❌ Dependencies installation failed
    exit /b 1
) else (
    echo ✅ Dependencies installed successfully
)



REM Step 6: Run security audit
echo 📋 Step 6: Running security audit...
npm audit --audit-level=moderate
if %errorlevel% neq 0 (
    echo ⚠️  Security audit found issues
) else (
    echo ✅ Security audit completed
)

REM Step 7: Run tests
echo 📋 Step 7: Running tests...
if exist "__tests__" (
    npm test
    if %errorlevel% neq 0 (
        echo ❌ Tests failed
        exit /b 1
    ) else (
        echo ✅ Tests passed
    )
) else (
    echo ⚠️  No test files found, skipping tests
)

REM Step 8: Validate Dockerfile
echo 📋 Step 8: Validating Dockerfile...
if exist "Dockerfile" (
    docker build --dry-run -t test-image .
    if %errorlevel% neq 0 (
        echo ❌ Dockerfile is invalid
        exit /b 1
    ) else (
        echo ✅ Dockerfile is valid
    )
) else (
    echo ⚠️  Dockerfile not found
)

REM Step 9: Test Docker build
echo 📋 Step 9: Testing Docker build...
if exist "Dockerfile" (
    docker build -t ai-career-backend-test .
    if %errorlevel% neq 0 (
        echo ❌ Docker image build failed
        exit /b 1
    ) else (
        echo ✅ Docker image built successfully
        docker rmi ai-career-backend-test
    )
) else (
    echo ⚠️  Dockerfile not found, skipping Docker build test
)

REM Step 10: Validate GitHub Actions workflow
echo 📋 Step 10: Validating GitHub Actions workflow...
if exist ".github\workflows\ci-cd.yml" (
    echo ✅ GitHub Actions workflow file exists
) else (
    echo ⚠️  GitHub Actions workflow not found
)

REM Step 11: Check environment files
echo 📋 Step 11: Checking environment configuration...
if exist ".env.example" (
    echo ✅ Environment example file exists
) else (
    echo ⚠️  No .env.example file found
)

REM Step 12: Validate package.json scripts
echo 📋 Step 12: Validating package.json scripts...
if exist "package.json" (
    npm run --silent 2>nul | findstr "start" >nul
    if %errorlevel% equ 0 (
        echo ✅ Start script exists
    ) else (
        echo ⚠️  Start script missing
    )
    
    npm run --silent 2>nul | findstr "test" >nul
    if %errorlevel% equ 0 (
        echo ✅ Test script exists
    ) else (
        echo ⚠️  Test script missing
    )
    
    npm run --silent 2>nul | findstr "lint" >nul
    if %errorlevel% equ 0 (
        echo ✅ Lint script exists
    ) else (
        echo ⚠️  Lint script missing
    )
) else (
    echo ⚠️  package.json not found
)

echo.
echo 🎉 CI/CD Pipeline Validation Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Configure GitHub secrets (DOCKER_USERNAME, DOCKER_PASSWORD)
echo 2. Set up GitHub environments (staging, production)
echo 3. Push code to trigger the pipeline
echo 4. Monitor pipeline execution in GitHub Actions
echo.
echo For detailed information, see CI-CD-README.md
pause
