# Payment Gateway System

A complete payment gateway system similar to Razorpay or Stripe, with merchant onboarding, payment order management, multi-method payment processing (UPI and Cards), and a hosted checkout page.

## Features

- **Merchant Onboarding**: API key and secret-based authentication
- **Order Management**: RESTful API for creating and querying payment orders
- **Payment Processing**: Support for UPI and Card payment methods
  - UPI with VPA validation
  - Card payments with Luhn algorithm validation
  - Card network detection (Visa, Mastercard, Amex, RuPay)
  - Expiry date validation
- **Hosted Checkout Page**: Professional UI for customers to complete payments
- **Merchant Dashboard**: View API credentials and transaction history
- **Database Persistence**: PostgreSQL with proper schema and relationships
- **Dockerized Deployment**: Single command deployment with docker-compose

## Technology Stack

- **Backend**: Node.js/Express.js
- **Database**: PostgreSQL 15
- **Frontend**: React 18
- **Server**: Nginx
- **Containerization**: Docker & Docker Compose

## Project Structure

```
payment-gateway/
├── docker-compose.yml          # Docker Compose orchestration
├── .env.example                # Environment variables template
├── README.md                   # This file
├── backend/                    # Express.js API service
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js               # Express app entry point
│   ├── .env                    # Environment configuration
│   ├── services/               # Business logic
│   │   ├── ValidationService.js
│   │   ├── OrderService.js
│   │   └── PaymentService.js
│   ├── routes/                 # API endpoints
│   │   ├── health.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── test.js
│   └── schema.sql              # Database schema
├── frontend/                   # Merchant Dashboard
│   ├── Dockerfile
│   ├── package.json
│   ├── nginx.conf
│   ├── public/index.html
│   └── src/
│       ├── App.jsx
│       ├── index.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           └── Transactions.jsx
└── checkout-page/             # Customer Checkout
    ├── Dockerfile
    ├── package.json
    ├── nginx.conf
    ├── public/index.html
    └── src/
        ├── index.jsx
        └── pages/
            └── Checkout.jsx
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

### Deployment

1. **Clone the repository** (or extract the provided files)

```bash
cd Payment-Gateway-System
```

2. **Start all services** (single command)

```bash
docker-compose up -d
```

This will:
- Create and start PostgreSQL database
- Build and start the API server
- Build and start the merchant dashboard
- Build and start the checkout page
- Auto-seed test merchant credentials

3. **Verify services are running**

```bash
docker-compose ps
```

All services should show "healthy" or "running" status.

## Accessing the System

### Test Merchant Credentials

- **Email**: test@example.com
- **API Key**: key_test_abc123
- **API Secret**: secret_test_xyz789

### Endpoints

- **API**: http://localhost:8000
- **Merchant Dashboard**: http://localhost:3000
- **Checkout Page**: http://localhost:3001/checkout?order_id={order_id}

## API Endpoints

### Health Check

```
GET /health
```

Returns system health status including database connectivity.

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Create Order

```
POST /api/v1/orders
Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789

Request Body:
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}
```

Returns order details with generated order ID.

### Get Order

```
GET /api/v1/orders/{order_id}
Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
```

Returns order details.

### Create Payment

```
POST /api/v1/payments
Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789

Request Body (UPI):
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "upi",
  "vpa": "user@paytm"
}

Request Body (Card):
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
```

Returns payment details with generated payment ID and processing status.

### Get Payment

```
GET /api/v1/payments/{payment_id}
Headers:
  X-Api-Key: key_test_abc123
  X-Api-Secret: secret_test_xyz789
```

Returns payment details including current status.

### Public Endpoints (for Checkout Page)

```
GET /api/v1/orders/{order_id}/public
POST /api/v1/payments/public
```

No authentication required for checkout flow.

## Testing

### Test with cURL

```bash
# Create an order
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "test_receipt_123"
  }'

# Response includes order_id, use it in checkout URL
```

### Test Merchant Dashboard

1. Navigate to http://localhost:3000
2. Login with email: test@example.com
3. View API credentials and integration instructions

### Test Checkout Page

1. Create an order via API (see above)
2. Navigate to http://localhost:3001/checkout?order_id={order_id}
3. Select payment method (UPI or Card)
4. Complete payment form
5. Payment will be processed and status updated in real-time

### Test Cards

For testing card payments:

- **Valid Card**: 4111111111111111 (Visa)
- **Valid Expiry**: Any future date (e.g., 12/2025)
- **Valid CVV**: Any 3 digits (e.g., 123)

For testing UPI:

- **Valid VPA**: username@bankname (e.g., user@paytm, john@okhdfcbank)

## Database Schema

### Merchants Table

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  api_secret VARCHAR(64) NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table

```sql
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  receipt VARCHAR(255),
  notes JSONB,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
)
```

### Payments Table

```sql
CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing',
  vpa VARCHAR(255),
  card_network VARCHAR(20),
  card_last4 VARCHAR(4),
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
)
```

## Validation Logic

### VPA Validation

VPA (Virtual Payment Address) must match pattern: `^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$`

Valid examples:
- user@paytm
- john.doe@okhdfcbank
- user_123@phonepe

### Card Validation (Luhn Algorithm)

1. Remove spaces and dashes
2. Verify contains only digits and 13-19 characters
3. Apply Luhn algorithm:
   - Start from rightmost digit
   - Double every second digit (moving left)
   - If doubled digit > 9, subtract 9
   - Sum all digits
   - Valid if sum modulo 10 equals 0

### Card Network Detection

- **Visa**: Starts with 4
- **Mastercard**: Starts with 51-55
- **Amex**: Starts with 34 or 37
- **RuPay**: Starts with 60, 65, or 81-89

### Expiry Validation

- Month must be 1-12
- Year format: 2-digit (25) or 4-digit (2025)
- Expiry date must be in future or current month

## Payment Processing

### Flow

1. Payment created with status "processing"
2. Simulated delay of 5-10 seconds (random)
3. Success determined randomly:
   - UPI: 90% success rate
   - Card: 95% success rate
4. Status updated to "success" or "failed"
5. On failure, error_code and error_description populated

### Test Mode

For deterministic testing, set environment variables:

```
TEST_MODE=true
TEST_PAYMENT_SUCCESS=true      # Force success
TEST_PROCESSING_DELAY=1000     # Delay in milliseconds
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: API server port (default: 8000)
- `TEST_MERCHANT_EMAIL`: Email for auto-seeded test merchant
- `TEST_API_KEY`: API key for test merchant
- `TEST_API_SECRET`: API secret for test merchant
- `UPI_SUCCESS_RATE`: Success rate for UPI payments (0.0-1.0)
- `CARD_SUCCESS_RATE`: Success rate for card payments (0.0-1.0)
- `TEST_MODE`: Enable deterministic testing
- `TEST_PAYMENT_SUCCESS`: Force payment success/failure in test mode
- `TEST_PROCESSING_DELAY`: Fixed processing delay in test mode (milliseconds)

## Troubleshooting

### Services Not Starting

Check Docker logs:

```bash
docker-compose logs -f [service_name]
# Examples: postgres, api, dashboard, checkout
```

### Database Connection Error

Ensure PostgreSQL is healthy:

```bash
docker-compose ps postgres
```

Should show "healthy" status.

### API Not Responding

Wait for API to initialize (first build may take 2-3 minutes):

```bash
docker-compose logs api
```

Look for "Started PaymentGatewayApplication" message.

### Frontend Not Loading

Check Nginx configuration:

```bash
docker-compose logs dashboard
```

Or rebuild:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Performance Considerations

- Database indexes on frequently queried fields (merchant_id, order_id, status)
- Asynchronous payment processing to avoid blocking requests
- Nginx caching for static assets
- Connection pooling in JPA/Hibernate

## Security Features

- API key and secret authentication for all protected endpoints
- Card CVV never stored in database
- Only last 4 digits of card number stored
- Input validation on all endpoints
- PostgreSQL prepared statements (via JPA)
- CORS headers properly configured

## Stopping Services

```bash
docker-compose down
```

To remove all data (volumes):

```bash
docker-compose down -v
```

## Logs

View real-time logs:

```bash
docker-compose logs -f [service_name]
```

All services:

```bash
docker-compose logs -f
```

## Support

For issues or questions about the implementation, refer to the API documentation above or check individual service logs.

## License

This is a demonstration project for educational purposes.
