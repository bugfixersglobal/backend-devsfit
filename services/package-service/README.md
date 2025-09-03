# Package Service - Professional SaaS Package Management

## Overview

This package service implements a comprehensive SaaS package management system with multi-step purchase flow, SSLCOMMERZ payment integration, and professional caching system for optimal performance in microservice architecture.

## Features

### 🚀 Multi-Step Purchase Flow

#### Step 1: Plan Information
- **Package Selection**: Choose from available SaaS packages
- **Billing Cycle**: Monthly, Yearly, Quarterly options
- **Coupon Validation**: Real-time coupon code validation
- **Pricing Calculation**: Dynamic pricing with discounts and taxes

#### Step 2: Business Information
- **Business Details**: Company name, type, address
- **Contact Information**: Email, phone, website
- **Validation**: Real-time form validation

#### Step 3: Payment Details
- **Payment Methods**: Card and Digital Payment options
- **SSLCOMMERZ Integration**: Secure payment gateway
- **Terms Agreement**: Terms and auto-renewal options

### 💳 SSLCOMMERZ Payment Integration

- **Sandbox Mode**: Test environment with SSLCOMMERZ sandbox
- **Production Ready**: Easy switch to live SSLCOMMERZ
- **Payment Validation**: Secure payment verification
- **Callback Handling**: Automated payment status updates
- **Refund Support**: Full refund processing capabilities
- **IPN (Instant Payment Notification)**: Real-time payment status updates
- **Timeout & Retry Logic**: Robust handling of payment gateway delays
- **Health Monitoring**: Check SSLCOMMERZ service health
- **Transaction Status**: Real-time payment status tracking
- **Payment Logs**: Comprehensive logging of all payment activities

### 📊 Professional Features

#### Caching System
- **Redis Integration**: High-performance caching
- **Cache Metrics**: `/cache/metrics` for performance monitoring
- **Cache Health**: `/cache/health` for system monitoring
- **Smart Invalidation**: Automatic cache management

#### Super Admin Panel
- **Package Management**: Create, update, delete packages
- **Client Management**: View all client subscriptions
- **Analytics**: Revenue and usage analytics
- **Bulk Operations**: Mass updates and actions

#### Billing & Invoices
- **Billing History**: Complete transaction records
- **Invoice Generation**: Professional invoice creation
- **Payment Tracking**: Real-time payment status
- **Tax Calculation**: Automated tax handling

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Configure database, Redis, and SSLCOMMERZ settings
```

### 3. Setup SSLCOMMERZ Sandbox
```bash
# Get sandbox credentials from https://sslcommerz.com/
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
SSLCOMMERZ_SANDBOX=true
```

### 4. Start Services
```bash
# Using Docker Compose
docker-compose up -d

# Or start manually
npm run start:dev
```

### 5. Test Purchase Flow
```bash
npm run test:purchase
```

## API Endpoints

### Purchase Flow
- `POST /purchase/session/start` - Start purchase session
- `GET /purchase/session/:sessionId` - Get session details
- `POST /purchase/step1/plan-information` - Step 1: Plan selection
- `POST /purchase/step2/business-information` - Step 2: Business details
- `POST /purchase/step3/payment-details` - Step 3: Payment processing
- `POST /purchase/complete` - Complete purchase

### Package Management
- `GET /packages/saas` - Get available packages
- `POST /packages/subscribe` - Subscribe to package
- `GET /packages/my-subscription` - Get current subscription
- `GET /packages/upgrade-options` - Get upgrade options

### Billing & Payments
- `GET /purchase/billing-history` - Get billing history
- `GET /purchase/invoices/:invoiceId` - Get invoice details
- `POST /purchase/payment/callback` - SSLCOMMERZ callback
- `GET /purchase/payment/status/:transactionId` - Check payment status
- `POST /purchase/refund` - Process payment refund
- `GET /purchase/refund/status/:transactionId` - Check refund status

### IPN (Instant Payment Notification)
- `POST /ipn/sslcommerz` - Handle SSLCOMMERZ IPN callbacks
- `GET /ipn/status/:transactionId` - Check IPN status
- `GET /ipn/logs` - View IPN processing logs
- `POST /ipn/test` - Test IPN functionality

### Super Admin
- `GET /super-admin/packages` - Manage packages
- `GET /super-admin/subscriptions` - View all subscriptions
- `GET /super-admin/analytics/packages` - Package analytics
- `GET /super-admin/analytics/revenue` - Revenue analytics

### Cache Management
- `GET /cache/metrics` - Cache performance metrics
- `GET /cache/health` - Cache health check
- `DELETE /cache/clear` - Clear all cache

## SSLCOMMERZ Integration

### Sandbox Testing
```bash
# Test Card Details (Sandbox)
Card Number: 4111111111111111
Expiry: 12/25
CVV: 123
```

### Production Setup
1. Register at [SSLCOMMERZ](https://sslcommerz.com/)
2. Get your Store ID and Store Password
3. Update environment variables:
```bash
SSLCOMMERZ_STORE_ID=your_live_store_id
SSLCOMMERZ_STORE_PASSWORD=your_live_store_password
SSLCOMMERZ_SANDBOX=false
```

### Payment Flow
1. **Initiate Payment**: Create transaction with SSLCOMMERZ
2. **Redirect User**: Send user to SSLCOMMERZ gateway
3. **Payment Processing**: User completes payment
4. **IPN Notification**: Real-time notification of payment status
5. **Callback Handling**: SSLCOMMERZ sends payment status
6. **Validation**: Verify payment with SSLCOMMERZ
7. **Subscription Activation**: Activate user subscription
8. **Refund Handling**: Process refunds if needed

### Enhanced Features
- **Timeout & Retry**: Automatic retry on network failures
- **Health Monitoring**: Check SSLCOMMERZ service status
- **Transaction Tracking**: Real-time payment status updates
- **IPN Processing**: Handle webhook notifications
- **Refund Management**: Full refund processing workflow

## Architecture

### Service Layers
1. **Controller Layer** - HTTP request handling
2. **Service Layer** - Business logic implementation
3. **Repository Layer** - Data access abstraction
4. **Use Case Layer** - Complex business operations
5. **Entity Layer** - Data models and validation

### Cache Strategy
- **TTL**: 30 minutes for purchase sessions
- **Pattern**: `purchase:session:{sessionId}`
- **Invalidation**: Automatic expiry
- **Fallback**: Database query if cache fails

### Database Schema
- **SaasPackage**: Package definitions and pricing
- **CompanySubscription**: User subscriptions
- **Coupon**: Discount codes and validation
- **SubscriptionUpgrade**: Upgrade/downgrade history

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Purchase Flow Tests
```bash
npm run test:purchase
```

### SSLCOMMERZ Tests
```bash
npm run test:payment
npm run test:sslcommerz-enhanced
```

## Monitoring

### Health Checks
- `GET /health` - Service health
- `GET /health/database` - Database connectivity
- `GET /health/cache` - Cache health
- `GET /health/payment` - Payment gateway health

### Metrics
- `GET /cache/metrics` - Cache performance
- `GET /super-admin/analytics/*` - Business analytics
- OpenTelemetry integration for observability

## Deployment

### Docker
```bash
# Build image
docker build -t devsfit-package-service .

# Run container
docker run -p 3004:3004 devsfit-package-service
```

### Kubernetes
```bash
# Apply manifests
kubectl apply -f kubernetes/

# Check status
kubectl get pods -n package-service
```

## Security

### Authentication
- JWT-based authentication
- Role-based access control
- Company admin guards
- Super admin guards

### Payment Security
- SSLCOMMERZ PCI DSS compliance
- Encrypted payment data
- Secure callback validation
- Tokenized payment methods

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting

## Support

### Documentation
- Swagger API docs: `/api/docs`
- OpenAPI specification
- Integration examples

### Troubleshooting
- Check logs: `npm run logs`
- Health checks: `GET /health`
- Cache status: `GET /cache/health`

### SSLCOMMERZ Support
- [SSLCOMMERZ Documentation](https://developer.sslcommerz.com/)
- [Sandbox Testing](https://developer.sslcommerz.com/doc/v4/#sandbox)
- [Integration Guide](https://developer.sslcommerz.com/doc/v4/#integration)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 