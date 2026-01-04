# Node.js Payment Gateway API

Node.js/Express implementation of the Payment Gateway API.

## Setup

```bash
cd backend
npm install
```

## Environment Variables

```bash
PORT=8000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_NAME=payment_gateway
DB_PORT=5432
TEST_MODE=false
TEST_PAYMENT_SUCCESS=false
TEST_PROCESSING_DELAY=5000
```

## Running

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Project Structure

```
backend/
├── server.js              # Express app and middleware
├── package.json           # Dependencies
├── services/
│   ├── ValidationService.js  # Payment validation logic
│   ├── OrderService.js       # Order business logic
│   └── PaymentService.js     # Payment business logic
└── routes/
    ├── health.js          # Health check endpoint
    ├── orders.js          # Order routes
    ├── payments.js        # Payment routes
    └── test.js            # Test routes
```

## API Endpoints

All endpoints are the same as the Java version - see README.md for complete documentation.

## Key Features

- Express.js REST API
- PostgreSQL database connection pooling
- UUID and secure ID generation
- Luhn algorithm for card validation
- VPA validation for UPI
- Asynchronous payment processing
- Test merchant auto-seeding
- CORS support for frontend applications
