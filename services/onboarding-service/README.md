# Onboarding Service - Professional Implementation

## Overview
This service handles the complete customer onboarding flow for gym companies buying subscription packages. It implements a **payment-first approach** where all business entities (company, user, subscription) are only created after successful payment.

## Features

### ✅ Payment-First Architecture
- Payment processing via SSL Commerz
- Business entities created only after successful payment
- Automatic rollback on payment failure

### ✅ Professional Implementation
- Single endpoint for complete purchase flow
- Comprehensive validation and error handling
- Database transactions for data consistency
- Professional logging and monitoring

### ✅ Screenshot-Based Fields
Based on your UI screenshots, the service handles:

**Step 1: Plan Selection**
- Package selection (Basic, Pro)
- Billing cycle (Monthly, Yearly)
- Coupon code application
- Real-time pricing calculation

**Step 2: Business Information**
- Business name (e.g., "XposeFitness")
- Business type (Personal, Corporate)
- Address, city, zip
- Mobile number
- Business email
- Website URL

**Step 3: Personal Information**
- First name, last name
- Personal email
- Phone number

## Quick Start

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. **Clone and navigate to the service:**
```bash
cd services/onboarding-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start with Docker Compose:**
```bash
docker-compose up -d
```

5. **Or start locally:**
```bash
npm run start:dev
```

## API Endpoints

### Complete Purchase
```http
POST /api/v1/onboarding/complete-purchase
```

**Request Body:**
```json
{
  "planSelection": {
    "packageId": "uuid",
    "billingCycle": "MONTHLY",
    "couponCode": "WELCOME10"
  },
  "businessInfo": {
    "businessName": "XposeFitness",
    "businessType": "PERSONAL",
    "addressLine1": "123 Gym Street",
    "city": "Dhaka",
    "zip": "1200",
    "mobile": "+8801712345678",
    "businessEmail": "info@xposefitness.com",
    "websiteUrl": "https://xposefitness.com"
  },
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "personalEmail": "john.doe@email.com",
    "phone": "+8801712345678"
  }
}
```

### Get Purchase Status
```http
GET /api/v1/purchase-flow/purchase/{purchaseId}/status
```

### Health Check
```http
GET /api/v1/purchase-flow/health
```

## Database Schema

### Purchase Table
Stores all purchase data and tracks the complete flow:
- Plan selection details
- Business information
- Personal information
- Pricing details
- Status tracking
- Created entity references

### Company Table
Created after successful payment:
- Business details
- Contact information
- Status management

### User Table
Created after successful payment:
- Personal details
- Company association
- Role management

### Subscription Table
Created after successful payment:
- Package association
- Billing cycle
- Status tracking

## Flow Process

1. **Validation & Pricing**: Validate all data and calculate pricing with coupons
2. **Purchase Record**: Create purchase record in database
3. **Payment Processing**: Process payment via SSL Commerz
4. **Business Creation**: If payment successful, create company, user, subscription
5. **Email Notifications**: Send welcome emails to both personal and business emails
6. **Status Update**: Mark purchase as completed

## Docker Setup

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker build -t purchase-flow-service .
docker run -p 3007:3007 purchase-flow-service
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Monitoring

### Health Checks
- Service health: `/api/v1/purchase-flow/health`
- Database connectivity
- Redis connectivity

### Metrics
- Purchase success/failure rates
- Payment processing times
- Error rates

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking

## Integration Points

- **Package Service**: Get package details and pricing
- **Billing Service**: Validate coupons and calculate taxes
- **Payment Service**: SSL Commerz integration
- **Notification Service**: Send confirmation emails
- **Company Service**: Create company profile
- **User Service**: Create user account
- **Subscription Service**: Create subscription

## Security Features

- Input validation with class-validator
- SQL injection prevention with Prisma
- Rate limiting protection
- Comprehensive error logging
- Secure payment processing

## Development Workflow

### Git Hooks (Husky)
- **pre-commit**: Linting, type checking, tests
- **commit-msg**: Conventional commit format
- **pre-push**: Full test suite

### Code Quality
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Conventional commits

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Run `npm run db:generate`

2. **Redis Connection Failed**
   - Check Redis is running
   - Verify REDIS_URL in .env

3. **Payment Processing Failed**
   - Check SSL Commerz credentials
   - Verify sandbox/production mode

### Logs
```bash
# Docker logs
docker-compose logs purchase-flow-service

# Application logs
npm run start:dev
```

## Contributing

1. Follow conventional commit format
2. Write tests for new features
3. Update documentation
4. Run linting and formatting

## License

This project is part of the Devsfit gym management system.
