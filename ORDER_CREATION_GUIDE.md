# Order Creation Guide

## Quick Start

### 1. **Using cURL (Command Line)**

```bash
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -d '{
    "amount": 5000,
    "currency": "INR",
    "receipt": "ORDER_001",
    "notes": {
      "customer_name": "John Doe",
      "customer_email": "john@example.com"
    }
  }'
```

### 2. **Using JavaScript/Axios**

```javascript
const axios = require('axios');

async function createOrder() {
  try {
    const response = await axios.post('http://localhost:8080/api/v1/orders', {
      amount: 5000,           // Amount in paise (₹50.00)
      currency: 'INR',        // Optional, defaults to INR
      receipt: 'ORDER_001',   // Optional, your receipt reference
      notes: {                // Optional, custom metadata
        customer_name: 'John Doe',
        customer_email: 'john@example.com'
      }
    }, {
      headers: {
        'X-Api-Key': 'key_test_abc123',
        'X-Api-Secret': 'secret_test_xyz789'
      }
    });

    console.log('Order Created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error.response.data);
  }
}

createOrder();
```

### 3. **Using Python (Requests)**

```python
import requests
import json

def create_order():
    url = "http://localhost:8080/api/v1/orders"
    
    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": "key_test_abc123",
        "X-Api-Secret": "secret_test_xyz789"
    }
    
    payload = {
        "amount": 5000,
        "currency": "INR",
        "receipt": "ORDER_001",
        "notes": {
            "customer_name": "John Doe",
            "customer_email": "john@example.com"
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    print(json.dumps(response.json(), indent=2))
    return response.json()

create_order()
```

---

## API Endpoint Details

### **POST** `/api/v1/orders`

Create a new order for payment processing.

#### **Required Headers**
| Header | Value |
|--------|-------|
| `X-Api-Key` | `key_test_abc123` |
| `X-Api-Secret` | `secret_test_xyz789` |
| `Content-Type` | `application/json` |

#### **Request Body**

| Field | Type | Required | Min Value | Description |
|-------|------|----------|-----------|-------------|
| `amount` | Number | ✅ Yes | 100 | Amount in paise (₹1 = 100 paise) |
| `currency` | String | ❌ No | - | Currency code (default: `INR`) |
| `receipt` | String | ❌ No | - | Your internal receipt reference |
| `notes` | Object | ❌ No | - | Custom metadata as key-value pairs |

#### **Example Request Body**

```json
{
  "amount": 5000,
  "currency": "INR",
  "receipt": "ORDER_12345",
  "notes": {
    "customer_id": "cust_001",
    "order_type": "subscription",
    "promo_code": "SAVE10"
  }
}
```

---

## Success Response

### **Status: 201 Created**

```json
{
  "id": "order_aBcDeFgHiJkLmNoP",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 5000,
  "currency": "INR",
  "receipt": "ORDER_001",
  "notes": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com"
  },
  "status": "created",
  "created_at": "2026-01-04T12:30:45.123Z",
  "updated_at": "2026-01-04T12:30:45.123Z"
}
```

---

## Error Responses

### **Missing Required Field**
```json
{
  "code": "BAD_REQUEST_ERROR",
  "description": "Missing required field: amount"
}
```

### **Amount Too Small**
```json
{
  "code": "BAD_REQUEST_ERROR",
  "description": "Amount must be at least 100 paise"
}
```

### **Authentication Failed**
```json
{
  "code": "AUTHENTICATION_ERROR",
  "description": "Invalid API Key or API Secret"
}
```

---

## Next Steps: Payment Processing

After creating an order, proceed with payment:

1. **Get checkout URL** - Use the order ID to generate checkout link
2. **Payment initiation** - Send payment details to `/api/v1/payments`
3. **Status tracking** - Check order status anytime with `/api/v1/orders/{order_id}`

---

## Testing Credentials

| Field | Value |
|-------|-------|
| **API Key** | `key_test_abc123` |
| **API Secret** | `secret_test_xyz789` |
| **API Base URL** | `http://localhost:8080` |
| **Dashboard** | `http://localhost:3000` |

### Dashboard Login
- **Email**: `test@example.com`
- **Password**: Any value

---

## Amount Conversion

| Amount (₹) | Amount (Paise) | Request |
|------------|----------------|---------|
| ₹1.00 | 100 | `"amount": 100` |
| ₹10.00 | 1000 | `"amount": 1000` |
| ₹50.00 | 5000 | `"amount": 5000` |
| ₹100.00 | 10000 | `"amount": 10000` |
| ₹1,000.00 | 100000 | `"amount": 100000` |

---

## Best Practices

1. **Always include receipt reference** - Helps with reconciliation
2. **Use notes for metadata** - Store customer/order context
3. **Handle errors gracefully** - Check response status codes
4. **Store order ID** - Use it for payment and status tracking
5. **Implement retries** - Handle network timeouts appropriately

---

## Integration Example (Full Flow)

```javascript
async function processPayment(customerEmail, amount) {
  const apiKey = 'key_test_abc123';
  const apiSecret = 'secret_test_xyz789';
  
  // Step 1: Create Order
  const orderResponse = await axios.post(
    'http://localhost:8080/api/v1/orders',
    {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `ORDER_${Date.now()}`,
      notes: { customer_email }
    },
    {
      headers: {
        'X-Api-Key': apiKey,
        'X-Api-Secret': apiSecret
      }
    }
  );

  const orderId = orderResponse.data.id;
  console.log(`✅ Order created: ${orderId}`);

  // Step 2: Redirect to checkout
  const checkoutUrl = `http://localhost:3001/checkout?order_id=${orderId}`;
  console.log(`🔗 Checkout URL: ${checkoutUrl}`);

  return { orderId, checkoutUrl };
}

// Usage
processPayment('customer@example.com', 50);
```

