# Payment Gateway Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Payment Gateway System                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
            ┌─────▼─────┐  ┌───────▼────────┐  ┌────▼──────┐
            │  Dashboard │  │   Checkout     │  │   API     │
            │  (Port 3000)│  │  (Port 3001)   │  │(Port 8000)│
            └─────┬─────┘  └───────┬────────┘  └────┬──────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                            ┌──────▼──────┐
                            │   Nginx     │
                            │   Gateway   │
                            └──────┬──────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                   ┌────▼────┐         ┌─────▼─────┐
                   │  Spring │         │ PostgreSQL│
                   │  Boot   │         │ Database  │
                   │   API   │         │           │
                   └────┬────┘         └─────┬─────┘
                        │                    │
                  ┌─────┴────────────────────┘
                  │
         ┌────────▼──────────┐
         │  Payment Services │
         │  - Validation     │
         │  - Processing     │
         │  - Auth           │
         └───────────────────┘
```

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.1.5
- **Language**: Java 17
- **Build Tool**: Maven 3.9.4
- **Database**: PostgreSQL 15
- **ORM**: JPA (Hibernate)

### Frontend
- **Framework**: React 18
- **Language**: JavaScript (JSX)
- **Build Tool**: npm (React Scripts)
- **State Management**: React State Hooks
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Web Server**: Nginx (Alpine)
- **Database Server**: PostgreSQL (Alpine)

## Application Architecture

### Backend (Spring Boot)

#### Layered Architecture

```
┌─────────────────────────────────┐
│       REST Controllers           │ (API Layer)
├─────────────────────────────────┤
│      Business Services           │ (Service Layer)
├─────────────────────────────────┤
│      Data Repositories           │ (Data Access Layer)
├─────────────────────────────────┤
│      JPA Entities & Models       │ (Domain Layer)
├─────────────────────────────────┤
│      PostgreSQL Database         │ (Persistence Layer)
└─────────────────────────────────┘
```

#### Core Components

1. **Controllers**
   - `HealthController`: System health and status
   - `OrderController`: Order CRUD operations
   - `PaymentController`: Payment processing and querying
   - `TestController`: Test endpoints for evaluation

2. **Services**
   - `OrderService`: Order creation and retrieval logic
   - `PaymentService`: Payment processing and async handling
   - `ValidationService`: Input validation (VPA, Card, Expiry)

3. **Models (Entities)**
   - `Merchant`: Merchant account information
   - `Order`: Payment order details
   - `Payment`: Payment transaction details

4. **Repositories (JPA)**
   - `MerchantRepository`: Merchant data access
   - `OrderRepository`: Order data access
   - `PaymentRepository`: Payment data access

5. **Configuration**
   - `ApiAuthenticationFilter`: API key/secret authentication
   - `CorsConfig`: Cross-origin resource sharing setup
   - `DataSeederConfig`: Automatic test merchant seeding

### Frontend (React)

#### Component Hierarchy

```
App.jsx
├── Login (Route: /login)
│   └── Login Form
│       ├── Email Input
│       ├── Password Input
│       └── Submit Button
│
├── Dashboard (Route: /dashboard)
│   ├── API Credentials Display
│   │   ├── API Key
│   │   └── API Secret
│   └── Stats Container
│       ├── Total Transactions
│       ├── Total Amount
│       └── Success Rate
│
└── Transactions (Route: /dashboard/transactions)
    └── Transactions Table
        ├── Payment ID
        ├── Order ID
        ├── Amount
        ├── Method
        ├── Status
        └── Created Date
```

#### Checkout Page

```
Checkout.jsx
├── Order Summary
│   ├── Amount
│   └── Order ID
│
├── Payment Method Selection
│   ├── UPI Button
│   └── Card Button
│
├── UPI Form (conditional)
│   └── VPA Input
│
├── Card Form (conditional)
│   ├── Card Number Input
│   ├── Expiry Input
│   ├── CVV Input
│   └── Cardholder Name Input
│
└── Status States
    ├── Processing (Spinner)
    ├── Success (Confirmation)
    └── Failure (Retry)
```

## Data Flow

### Order Creation Flow

```
1. Merchant requests POST /api/v1/orders
   ↓
2. ApiAuthenticationFilter validates API Key/Secret
   ↓
3. OrderController extracts request data
   ↓
4. Input validation (amount >= 100)
   ↓
5. OrderService generates unique order ID
   ↓
6. Order persisted to PostgreSQL
   ↓
7. OrderDTO returned with 201 Created
```

### Payment Processing Flow

```
1. Request POST /api/v1/payments
   ↓
2. Authentication filter validates credentials
   ↓
3. PaymentController validates order belongs to merchant
   ↓
4. Method-specific validation:
   - UPI: VPA format validation
   - Card: Luhn algorithm, expiry, network detection
   ↓
5. Payment created with status "processing"
   ↓
6. PaymentService spawns async processing thread
   ↓
7. 5-10 second simulated processing delay
   ↓
8. Random success determination (90% UPI, 95% card)
   ↓
9. Status updated to "success" or "failed"
   ↓
10. Checkout page polls /api/v1/payments/{id}/public
   ↓
11. Frontend updates UI with result
```

### Checkout Page Flow

```
1. User navigates to /checkout?order_id=xxx
   ↓
2. Order details fetched from /api/v1/orders/{id}/public
   ↓
3. Display order amount and ID
   ↓
4. User selects payment method (UPI or Card)
   ↓
5. Appropriate form displayed based on selection
   ↓
6. User submits payment details
   ↓
7. Request sent to /api/v1/payments/public
   ↓
8. Payment created with "processing" status
   ↓
9. Frontend shows spinner ("Processing payment...")
   ↓
10. Poll /api/v1/payments/{id}/public every 2 seconds
   ↓
11. When status changes to "success" or "failed":
    - Hide spinner
    - Display appropriate confirmation/error message
    ↓
12. On failure: Show retry button to reset form
```

## Database Schema Relationships

```
┌─────────────────────┐
│     merchants       │
├─────────────────────┤
│ id (UUID) PRIMARY   │
│ name                │
│ email UNIQUE        │
│ api_key UNIQUE      │
│ api_secret          │
│ webhook_url         │
│ is_active           │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────┐
│      orders         │
├─────────────────────┤
│ id (VARCHAR) PK     │
│ merchant_id FK ─────┼──→ merchants
│ amount              │
│ currency            │
│ receipt             │
│ notes (JSON)        │
│ status              │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────┐
│    payments         │
├─────────────────────┤
│ id (VARCHAR) PK     │
│ order_id FK ────────┼──→ orders
│ merchant_id FK ─────┼──→ merchants
│ amount              │
│ currency            │
│ method              │
│ vpa                 │
│ card_network        │
│ card_last4          │
│ status              │
│ error_code          │
│ error_description   │
│ created_at          │
│ updated_at          │
└─────────────────────┘

Indexes:
- orders.merchant_id
- payments.order_id
- payments.status
```

## Authentication & Authorization

### API Authentication

```
Request Headers:
├── X-Api-Key: [merchant api_key]
└── X-Api-Secret: [merchant api_secret]

Flow:
1. ApiAuthenticationFilter intercepts all /api/v1/* requests
2. Extracts headers from request
3. Queries MerchantRepository for merchant with api_key
4. Verifies api_secret matches stored value
5. Stores merchant in request attribute for controller access
6. Rejects with 401 if credentials invalid
```

### Public Endpoints

Endpoints with `/public` in path bypass authentication:
- `GET /api/v1/orders/{id}/public`
- `POST /api/v1/payments/public`
- `GET /api/v1/payments/{id}/public`

Used by checkout page for customer payment flow.

## Validation Logic

### VPA Validation

```
Pattern: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$

Components:
├── Before @: [a-zA-Z0-9._-]+
│   └── Alphanumeric, dot, underscore, hyphen (1+ chars)
└── After @: [a-zA-Z0-9]+
    └── Alphanumeric only (1+ chars)

Examples:
✓ user@paytm
✓ john.doe@okhdfcbank
✗ user @paytm (space not allowed)
✗ user (missing @)
```

### Card Number Validation (Luhn)

```
Algorithm:
1. Remove spaces and dashes
2. Verify all digits, length 13-19
3. Process from right to left:
   └── Double every 2nd digit (from right)
   └── If > 9, subtract 9
4. Sum all digits
5. Valid if sum % 10 == 0

Example: 4111111111111111
Position: 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
Digit:     4  1  1  1  1  1  1  1 1 1 1 1 1 1 1 1
Double:       2     2     2    2   2   2   2   2
Result:    4  2  1  2  1  2  1  2 1 2 1 2 1 2 1 1
Sum = 40, 40 % 10 = 0 ✓ Valid
```

### Card Network Detection

```
Network Detection by BIN (Bank Identification Number):
├── Visa: First digit = 4
├── Mastercard: First 2 digits = 51-55
├── Amex: First 2 digits = 34 or 37
├── RuPay: First 2 digits = 60, 65, or 81-89
└── Unknown: No match

Detection Priority: Check in order above
```

### Expiry Validation

```
Input: Month (1-12), Year (2 or 4 digits)

Validation:
1. Parse month: 1 ≤ month ≤ 12
2. Parse year:
   - 2-digit: Add 2000 (25 → 2025)
   - 4-digit: Use as-is
3. Compare with current YearMonth
4. Valid if expiry_month/year >= current_month/year

Example:
Current: January 2024
Expiry: 12/2024
Status: Valid (December 2024 is in future)
```

## Asynchronous Payment Processing

### Implementation

```
1. Payment created immediately with status "processing"
   └── Request returns with 201 Created
   
2. PaymentService.createAndProcessPayment():
   └── Starts new Thread with async processing
   
3. Async Thread:
   ├── Sleep for 5-10 seconds (random)
   ├── Determine success/failure:
   │  ├── UPI: 90% success probability
   │  └── Card: 95% success probability
   ├── Fetch payment from database
   └── Update status and error info
   
4. Frontend polls every 2 seconds:
   └── GET /api/v1/payments/{id}/public
   └── Updates UI when status changes
```

### Test Mode Override

```
Environment variables:
├── TEST_MODE=true
│   └── Enables deterministic outcomes
├── TEST_PAYMENT_SUCCESS=true/false
│   └── Forces payment success/failure
└── TEST_PROCESSING_DELAY=1000
    └── Fixed delay in milliseconds
```

## Security Considerations

### Data Protection

```
Card Information:
├── Full card number: Validated but NOT stored
├── CVV: Validated but NOT stored
├── Last 4 digits: STORED for reference
└── Network: STORED for transaction categorization

VPA Information:
├── Validated for format
└── Stored with payment for reference

API Credentials:
├── api_key: UNIQUE, stored in plain text (design note)
└── api_secret: UNIQUE, stored in plain text (design note)
   Note: In production, should hash secrets
```

### Input Validation

```
Order Creation:
├── Amount: >= 100 paise (₹1.00 minimum)
├── Currency: Optional, defaults to "INR"
└── Notes: JSON validation

Payment Validation:
├── Order ownership: Verify merchant_id match
├── Method-specific: VPA format, Card Luhn, Expiry
└── Error responses: Don't leak internal details
```

## Performance Optimization

### Database

```
Indexes Created:
├── orders.merchant_id
│   └── Fast merchant order queries
├── payments.order_id
│   └── Fast order payment lookups
└── payments.status
    └── Fast status-based queries (e.g., "success" count)

Connection Pooling:
└── HikariCP default settings (Spring Boot)
    ├── max-lifetime: 1800000 ms
    ├── maximum-pool-size: 10
    └── minimum-idle: 10
```

### API

```
Response Optimization:
├── DTO mapping: Only required fields serialized
├── JSON compression: Spring default gzip
└── CORS headers: Browser caching enabled

Asynchronous Processing:
└── Payments process in background
    └── Frees request thread immediately
    └── Frontend polls for completion
```

### Frontend

```
Nginx Caching:
├── Static assets: 1-year cache TTL
├── Cache-Control: public, immutable
└── Build optimization: Production build compression

React Optimization:
├── Component memoization (for future enhancements)
├── Event handler optimization
└── Efficient re-renders via hooks
```

## Scaling Considerations

### Current Architecture Limitations

```
Single Instance:
├── No horizontal scaling
├── No load balancing
├── No session replication
└── Monolithic API structure
```

### For Production Scaling

```
Recommended Enhancements:
├── API Gateway (Kong, Nginx reverse proxy)
├── Database Connection Pooling (increase limits)
├── Caching Layer (Redis)
├── Asynchronous Job Queue (RabbitMQ, Kafka)
├── Microservices Split:
│  ├── Auth Service
│  ├── Order Service
│  ├── Payment Service
│  └── Notification Service
├── Load Balancing
│  ├── Round-robin DNS
│  └── Container orchestration (Kubernetes)
└── Monitoring & Logging
   ├── Prometheus metrics
   ├── ELK stack
   └── APM (Application Performance Monitoring)
```

## Deployment Architecture

### Docker Compose Stack

```
Services:
├── postgres (Database)
│   └── Volume: postgres_data
├── api (Spring Boot)
│   └── Depends on: postgres (healthy)
├── dashboard (React + Nginx)
│   └── Depends on: api
└── checkout (React + Nginx)
    └── Depends on: api

Networks:
└── Default compose network
    └── Service-to-service DNS: {service_name}:{port}
```

## Testing Strategy

### Unit Testing

```
Recommended:
├── ValidationService tests
│  ├── VPA format validation
│  ├── Luhn algorithm
│  ├── Card network detection
│  └── Expiry validation
├── ID generation tests
│  ├── Order ID uniqueness
│  └── Payment ID uniqueness
└── Repository tests
   └── Mock database interactions
```

### Integration Testing

```
Recommended:
├── Controller tests
│  ├── Valid request paths
│  ├── Invalid request paths
│  └── Authentication failures
├── Service layer tests
│  ├── Order creation flow
│  ├── Payment processing flow
│  └── Status transitions
└── Database tests
   └── Entity persistence and retrieval
```

### End-to-End Testing

```
Recommended:
├── API testing
│  ├── Full order creation flow
│  ├── Full payment processing
│  └── Status polling
├── Frontend testing
│  ├── Selenium for UI automation
│  └── data-test-id attribute verification
└── Checkout flow testing
   ├── UPI payment E2E
   ├── Card payment E2E
   └── Success/Failure handling
```

## Monitoring & Logging

### Application Logs

```
Location: Docker logs via docker-compose logs [service]

Levels:
├── DEBUG: Detailed trace information
├── INFO: General informational messages
├── WARN: Warning conditions
└── ERROR: Error events
```

### Metrics to Monitor

```
API Performance:
├── Request latency
├── Payment processing time
├── Database query time
└── Error rates

Business Metrics:
├── Total transactions
├── Success/failure rates
├── Average transaction amount
└── Active merchant count
```
