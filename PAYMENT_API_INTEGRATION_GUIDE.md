# Payment System - API Integration Guide

## Overview

This guide provides detailed information on integrating the Borka Bazar payment system into your application.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Order Creation](#order-creation)
3. [Order Retrieval](#order-retrieval)
4. [Payment Management](#payment-management)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [Testing](#testing)

---

## Authentication

### Firebase Authentication

All user endpoints require Firebase authentication tokens.

#### Getting a Token

```javascript
import { auth } from './firebase/firebase.config';

// Get current user token
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  // Use token in API calls
}
```

#### Using Token in API Calls

```javascript
const response = await fetch('/api/orders/my-orders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Axios Interceptor

```javascript
// In api.js
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Order Creation

### Endpoint

```
POST /api/orders/create
```

### Request Headers

```
Content-Type: application/json
```

### Request Body

```javascript
{
  // Customer Information
  "customerName": "Ahmed Hassan",           // Required: String
  "customerPhone": "01978305319",           // Required: String (10-15 digits)
  "customerEmail": "ahmed@example.com",     // Required: String
  "customerAddress": "123 Main St, Dhaka",  // Required: String

  // Products
  "products": [                             // Required: Array
    {
      "productId": "507f1f77bcf86cd799439011",  // Required: MongoDB ObjectId
      "title": "T-Shirt",                       // Required: String
      "price": 500,                             // Required: Number (BDT)
      "quantity": 2,                            // Required: Number (min: 1)
      "image": "https://example.com/image.jpg", // Optional: String (URL)
      "size": "L",                              // Optional: String
      "color": "Blue"                           // Optional: String
    }
  ],

  // Pricing
  "subtotal": 1000,                         // Required: Number (BDT)
  "deliveryFee": 200,                       // Required: Number (BDT)

  // Payment
  "paymentMethod": "bKash"                  // Required: 'bKash' or 'Nagad'
}
```

### Response (Success)

```javascript
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439012",
    "orderCode": "ORD-123456",
    "total": 1200,
    "deliveryFee": 200,
    "remainingAmount": 1000
  }
}
```

### Response (Error)

```javascript
// 400 Bad Request
{
  "success": false,
  "message": "Missing required fields"
}

// 400 Bad Request
{
  "success": false,
  "message": "Invalid payment method"
}

// 500 Internal Server Error
{
  "success": false,
  "message": "Failed to create order",
  "error": "error details"
}
```

### JavaScript Example

```javascript
async function createOrder(orderData) {
  try {
    const response = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create order');
    }

    console.log('Order created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
const orderData = {
  customerName: 'Ahmed Hassan',
  customerPhone: '01978305319',
  customerEmail: 'ahmed@example.com',
  customerAddress: '123 Main St, Dhaka',
  products: [
    {
      productId: '507f1f77bcf86cd799439011',
      title: 'T-Shirt',
      price: 500,
      quantity: 2,
      image: 'url',
      size: 'L',
      color: 'Blue'
    }
  ],
  subtotal: 1000,
  deliveryFee: 200,
  paymentMethod: 'bKash'
};

createOrder(orderData)
  .then(order => console.log('Order:', order))
  .catch(error => console.error('Error:', error));
```

---

## Order Retrieval

### Get User Orders

#### Endpoint

```
GET /api/orders/my-orders?page=1&limit=10
```

#### Headers

```
Authorization: Bearer {firebaseToken}
Content-Type: application/json
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | Number | 1 | Page number |
| limit | Number | 10 | Items per page |

#### Response (Success)

```javascript
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "orderCode": "ORD-123456",
      "customer": {
        "name": "Ahmed Hassan",
        "phone": "01978305319",
        "email": "ahmed@example.com",
        "address": "123 Main St, Dhaka"
      },
      "products": [
        {
          "productId": "507f1f77bcf86cd799439011",
          "title": "T-Shirt",
          "price": 500,
          "quantity": 2,
          "image": "url",
          "size": "L",
          "color": "Blue"
        }
      ],
      "pricing": {
        "subtotal": 1000,
        "deliveryFee": 200,
        "total": 1200,
        "remainingAmount": 1000
      },
      "payment": {
        "method": "bKash",
        "transactionId": "TXN123456789",
        "status": "Confirmed",
        "confirmedAt": "2024-01-15T10:30:00Z"
      },
      "order": {
        "status": "Processing",
        "notes": "Order dispatched"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Order by ID

#### Endpoint

```
GET /api/orders/{orderId}
```

#### Response

```javascript
{
  "success": true,
  "data": {
    // Same as above
  }
}
```

### JavaScript Example

```javascript
async function getUserOrders(page = 1, limit = 10) {
  try {
    const response = await fetch(
      `/api/orders/my-orders?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch orders');
    }

    return result;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
getUserOrders(1, 10)
  .then(result => {
    console.log('Orders:', result.data);
    console.log('Total:', result.pagination.total);
  })
  .catch(error => console.error('Error:', error));
```

---

## Payment Management

### Confirm Payment (Admin)

#### Endpoint

```
PATCH /api/orders/{orderId}/confirm-payment
```

#### Headers

```
Authorization: Bearer {adminToken}
Content-Type: application/json
```

#### Request Body

```javascript
{
  "transactionId": "TXN123456789",  // Required: String
  "adminId": "admin_user_id"        // Optional: String
}
```

#### Response (Success)

```javascript
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439012",
    "orderCode": "ORD-123456",
    "paymentStatus": "Confirmed",
    "orderStatus": "Processing"
  }
}
```

### Reject Payment (Admin)

#### Endpoint

```
PATCH /api/orders/{orderId}/reject-payment
```

#### Request Body

```javascript
{
  "reason": "Transaction ID not found",  // Optional: String
  "adminId": "admin_user_id"             // Optional: String
}
```

#### Response (Success)

```javascript
{
  "success": true,
  "message": "Payment rejected successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439012",
    "orderCode": "ORD-123456",
    "paymentStatus": "Rejected",
    "orderStatus": "Cancelled"
  }
}
```

### Update Order Status (Admin)

#### Endpoint

```
PATCH /api/orders/{orderId}/update-status
```

#### Request Body

```javascript
{
  "status": "Shipped",              // Required: String
  "notes": "Order dispatched"       // Optional: String
}
```

#### Valid Statuses

- `Pending`: Order received
- `Processing`: Being prepared
- `Shipped`: On the way
- `Delivered`: Received by customer
- `Cancelled`: Order cancelled

#### Response (Success)

```javascript
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    // Full order object
  }
}
```

### JavaScript Example (Admin)

```javascript
async function confirmPayment(orderId, transactionId, adminId) {
  try {
    const response = await fetch(
      `/api/orders/${orderId}/confirm-payment`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId,
          adminId
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to confirm payment');
    }

    return result.data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
confirmPayment('507f1f77bcf86cd799439012', 'TXN123456789', 'admin_id')
  .then(data => console.log('Payment confirmed:', data))
  .catch(error => console.error('Error:', error));
```

---

## Error Handling

### Common Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Missing required fields | Incomplete order data |
| 400 | Invalid payment method | Wrong payment method |
| 400 | Transaction ID already exists | Duplicate transaction ID |
| 404 | Order not found | Invalid order ID |
| 401 | No token provided | Missing authentication |
| 403 | Admin access required | Not an admin user |
| 500 | Failed to create order | Server error |

### Error Handling Pattern

```javascript
async function handleOrderOperation(operation) {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    // Handle specific errors
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Validation Error',
        message: error.response.data.message
      };
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication Error',
        message: 'Please login again'
      };
    }

    if (error.response?.status === 403) {
      return {
        success: false,
        error: 'Authorization Error',
        message: 'You do not have permission'
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Not Found',
        message: 'Resource not found'
      };
    }

    return {
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred'
    };
  }
}
```

---

## Code Examples

### Complete Order Flow

```javascript
// 1. Create Order
async function placeOrder(cartItems, userInfo, paymentMethod) {
  const orderData = {
    customerName: userInfo.name,
    customerPhone: userInfo.phone,
    customerEmail: userInfo.email,
    customerAddress: userInfo.address,
    products: cartItems.map(item => ({
      productId: item._id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      size: item.selectedSize,
      color: item.selectedColor?.name
    })),
    subtotal: calculateSubtotal(cartItems),
    deliveryFee: 200,
    paymentMethod
  };

  const result = await createOrder(orderData);
  return result;
}

// 2. Get User Orders
async function fetchUserOrders() {
  const result = await getUserOrders(1, 10);
  return result.data;
}

// 3. Track Order Status
async function trackOrder(orderId) {
  const response = await fetch(`/api/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();
  return result.data;
}

// 4. Admin: Confirm Payment
async function adminConfirmPayment(orderId, transactionId) {
  const result = await confirmPayment(orderId, transactionId, adminId);
  return result;
}

// 5. Admin: Update Order Status
async function adminUpdateOrderStatus(orderId, newStatus) {
  const response = await fetch(
    `/api/orders/${orderId}/update-status`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        notes: 'Status updated'
      })
    }
  );

  const result = await response.json();
  return result.data;
}
```

### React Component Example

```javascript
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

export function OrderTracker() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch('/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      setOrders(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>My Orders</h1>
      {orders.map(order => (
        <div key={order._id}>
          <h3>{order.orderCode}</h3>
          <p>Status: {order.order.status}</p>
          <p>Payment: {order.payment.status}</p>
          <p>Total: ৳{order.pricing.total}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing

### Using cURL

```bash
# Create Order
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "01978305319",
    "customerEmail": "test@example.com",
    "customerAddress": "Test Address",
    "products": [{
      "productId": "507f1f77bcf86cd799439011",
      "title": "Test Product",
      "price": 500,
      "quantity": 1,
      "image": "url"
    }],
    "subtotal": 500,
    "deliveryFee": 200,
    "paymentMethod": "bKash"
  }'

# Get User Orders
curl -X GET http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer {token}"

# Confirm Payment
curl -X PATCH http://localhost:5000/api/orders/{orderId}/confirm-payment \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN123456789",
    "adminId": "admin_id"
  }'
```

### Using Postman

1. Import the API collection
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `token`: Your Firebase token
   - `adminToken`: Admin Firebase token
3. Run requests from the collection

### Unit Testing Example

```javascript
describe('Order API', () => {
  it('should create an order', async () => {
    const orderData = {
      customerName: 'Test User',
      customerPhone: '01978305319',
      customerEmail: 'test@example.com',
      customerAddress: 'Test Address',
      products: [{
        productId: '507f1f77bcf86cd799439011',
        title: 'Test Product',
        price: 500,
        quantity: 1
      }],
      subtotal: 500,
      deliveryFee: 200,
      paymentMethod: 'bKash'
    };

    const result = await createOrder(orderData);

    expect(result.success).toBe(true);
    expect(result.data.orderCode).toBeDefined();
    expect(result.data.total).toBe(700);
  });

  it('should fetch user orders', async () => {
    const result = await getUserOrders(1, 10);

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.pagination).toBeDefined();
  });

  it('should confirm payment', async () => {
    const result = await confirmPayment(
      'orderId',
      'TXN123456789',
      'adminId'
    );

    expect(result.success).toBe(true);
    expect(result.data.paymentStatus).toBe('Confirmed');
  });
});
```

---

## Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Example: 100 requests per 15 minutes
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

app.use('/api/orders/', limiter);
```

---

## Pagination

All list endpoints support pagination:

```javascript
// Get page 2 with 20 items per page
GET /api/orders/my-orders?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "pages": 8
  }
}
```

---

## Webhooks (Future)

Future implementation for real-time notifications:

```javascript
// Example webhook payload
{
  "event": "payment.confirmed",
  "orderId": "507f1f77bcf86cd799439012",
  "orderCode": "ORD-123456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Support

For API support, contact:
- Email: info@borkabazar.com
- Phone: 01978305319

---

**Last Updated**: January 2024
**API Version**: 1.0.0
