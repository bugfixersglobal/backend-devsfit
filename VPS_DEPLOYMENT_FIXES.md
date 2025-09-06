# Devsfit VPS Deployment Issues & Fixes

## Issues Identified

### 1. Critical .dockerignore Issue ❌
**Problem**: All service `.dockerignore` files were excluding `Dockerfile*` files, preventing Docker from finding the Dockerfiles during build.

**Files affected**: All services' `.dockerignore` files
- `services/api-gateway/.dockerignore`
- `services/auth-service/.dockerignore`
- `services/package-service/.dockerignore`
- `services/billing-service/.dockerignore`
- `services/payment-service/.dockerignore`
- And all other services

**Fix**: Removed `Dockerfile*` line from all `.dockerignore` files.

### 2. Missing .env Files ❌
**Problem**: The `.env.staging` and `.env.production` files were being ignored by `.gitignore`, so they weren't available on the VPS.

**Fix**: Created `.env.staging` and `.env.production` files in the root directory with proper configuration.

### 3. Deployment Script Typo ❌
**Problem**: In the deployment commands, there was a typo: `.env.productio` instead of `.env.production`.

**Fix**: Created corrected deployment scripts (`deploy-vps.sh` and `fix-vps.sh`).

### 4. Missing tsconfig.json in Docker Build ❌
**Problem**: Some `.dockerignore` files were excluding `tsconfig.json`, which is needed for TypeScript compilation.

**Fix**: Ensured `tsconfig.json` is explicitly included in all `.dockerignore` files.

## Root Cause Analysis

The main issue was that the `.dockerignore` files were too aggressive in excluding files needed for the Docker build process. When Docker tries to build an image, it:

1. Reads the `.dockerignore` file
2. Excludes files matching the patterns
3. Copies the remaining files to the build context
4. Runs the Dockerfile

Since `Dockerfile*` was excluded, Docker couldn't find the Dockerfile to use for building the image.

## Files Created/Fixed

### New Files Created:
- `.env.staging` - Staging environment configuration
- `.env.production` - Production environment configuration  
- `deploy-vps.sh` - Corrected deployment script
- `fix-vps.sh` - Comprehensive fix script

### Files Fixed:
- All service `.dockerignore` files (removed `Dockerfile*` exclusion)
- Deployment scripts (fixed typo)

## VPS Deployment Instructions

### Step 1: Upload the fixes to your VPS
```bash
# Copy the fixed files to your VPS
scp .env.staging .env.production deploy-vps.sh fix-vps.sh user@your-vps:/opt/devsfit/
```

### Step 2: Run the fix script on VPS
```bash
# SSH into your VPS
ssh user@your-vps

# Navigate to project directory
cd /opt/devsfit

# Make scripts executable
chmod +x fix-vps.sh deploy-vps.sh

# Run the fix script
./fix-vps.sh
```

### Step 3: Deploy staging environment
```bash
# Deploy staging
./deploy-vps.sh staging

# Check health
./deploy-vps.sh health

# View logs if needed
./deploy-vps.sh logs-staging
```

### Step 4: Deploy production environment
```bash
# Deploy production
./deploy-vps.sh production

# Check health
./deploy-vps.sh health

# View logs if needed
./deploy-vps.sh logs-production
```

## Verification Steps

### 1. Check Docker Build Works
```bash
cd /opt/devsfit/services/api-gateway
docker build -f Dockerfile.dev -t test-build .
```

### 2. Check Container Status
```bash
docker ps
docker-compose -f docker-compose.staging.yml ps
```

### 3. Test Health Endpoints
```bash
# Staging
curl http://localhost:3000/health
curl http://localhost:3020/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health

# Production
curl http://localhost:3001/health
curl http://localhost:3021/health
curl http://localhost:3006/health
curl http://localhost:3008/health
curl http://localhost:3009/health
```

## Environment Variables to Update

Before deploying, make sure to update these critical environment variables in your `.env.staging` and `.env.production` files:

### Database Passwords
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `RABBITMQ_PASSWORD`

### JWT Secrets
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### External Service Credentials
- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD`
- `EMAIL_PASS`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

### Security Keys
- `SESSION_SECRET`
- `BACKUP_ENCRYPTION_KEY`
- `GRAFANA_ADMIN_PASSWORD`

## Troubleshooting

### If containers still fail to start:
1. Check logs: `docker-compose -f docker-compose.staging.yml logs -f`
2. Verify environment variables are set correctly
3. Ensure all required files are present
4. Check Docker daemon is running: `sudo systemctl status docker`

### If build fails:
1. Check if Dockerfile exists: `ls -la services/*/Dockerfile*`
2. Verify .dockerignore doesn't exclude needed files
3. Check Docker build context: `docker build --no-cache -f Dockerfile.dev .`

### If services are unhealthy:
1. Wait longer for services to start (some take 30-60 seconds)
2. Check database connectivity
3. Verify Redis connection
4. Check for port conflicts

## Summary

The main issue was the `.dockerignore` files excluding essential build files. With these fixes:

✅ Dockerfiles are now accessible during build
✅ Environment files are properly configured
✅ Deployment scripts are corrected
✅ Comprehensive fix and deployment scripts are provided

Your VPS deployment should now work correctly!
