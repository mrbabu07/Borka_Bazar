# Borka Bazar - Partial Payment System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Payment Flow](#payment-flow)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [User Guide](#user-guide)
9. [Admin Guide](#admin-guide)
10. [Configuration](#configuration)

---

## Overview

The Borka Bazar Partial Payment System is a modern e-commerce payment solution that allows customers to:
- Pay delivery fees upfront via bKash or Nagad
- Pay the remaining product cost via Cash on Delivery (COD)
- Track their orders in real-time
- Receive payment verification within 24 hours

### Key Features
- ✅ Two-step payment process (Delivery Fee + COD)
- ✅ Manual payment verification (no automated gateway)
- ✅ Support for bKash and Nagad
- ✅ Unique order code generation
- ✅ Transaction ID validation
- ✅ Admin dashboard for payment management
- ✅ User order tracking
- ✅ Professional invoice generation

### Payment Methods
- **bKash**: Mobile money service in Bangladesh
- **Nagad**: Mobile money service in Bangladesh
- **Cash on Delivery**: Pay remaining amount when order arrives

---

## System Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: React.js + Tailwind CSS
- **Authentication**: Firebase Authentication
- **Payment Processing**: Manual verification (no third-party gateway)

### Project Structure
```
Borka_Bazar/
├── Server/
│   ├── models/
│   │   └── Order.js                 # Order schema
│   ├── controllers/
│   │   └── orderController.js       # Order business logic
│   ├── routes/
│   │   └── orderRoutes.js           # Order API endpoints
│   ├── middleware/
│   │   └── auth.js                  # Firebase authentication
│   └── index.js                     # Server entry point
│
└── Client/
    └── src/
        ├── pages/
        │   ├── CheckoutPartialPayment.jsx    # Simple payment page
        │   ├── CheckoutModern.jsx            # 4-step checkout
        │   ├── Orders.jsx                    # User orders page
        │   └── OrderConfirmation.jsx         # Order confirmation
        ├── components/
        │   └── checkout/
        │       ├── CheckoutProgress.jsx
        │       └── steps/
        │           ├── AddressStep.jsx
        │           ├── ReviewStep.jsx
        │           ├── PaymentStep.jsx
        │           └── ConfirmationStep.jsx
        ├── services/
        │   └── api.js                        # API calls
        └── utils/
            └── printTemplate.js              # Invoice template
```

---

## Payment Flow

### User Payment Journey

```
1. User adds products to cart
   ↓
2. User proceeds to checkout
   ↓
3. User selects payment method (bKash/Nagad)
   ↓
4. System generates unique Order Code (ORD-XXXXXX)
   ↓
5. User sends delivery fee via bKash/Nagad
   ↓
6. User enters Transaction ID
   ↓
7. Order is created with "Pending" payment status
   ↓
8. User receives order confirmation
   ↓
9. Admin verifies payment within 24 hours
   ↓
10. Payment status changes to "Confirmed" or "Rejected"
   ↓
11. Order proceeds to "Processing" → "Shipped" → "Delivered"
   ↓
12. User pays remaining amount on delivery (COD)
```

### Payment Breakdown Example
```
Product Cost:        ৳1,000
Delivery Fee:        ৳200
─────────────────────────
Total:               ৳1,200

Pay Now (bKash):     ৳200 (Delivery Fee)
Pay on Delivery:     ৳1,000 (Product Cost)
```

---

## Backend Implementation

### Order Model (MongoDB Schema)

```javascript
{
  orderCode: String,              // Unique: ORD-123456
  customer: {
    name: String,                 // Customer name
    phone: String,                // Customer phone
    email: String,                // Customer email (for order lookup)
    address: String               // Delivery address
  },
  products: [{
    productId: ObjectId,          // Reference to Product
    title: String,                // Product name
    price: Number,                // Product price (BDT)
    quantity: Number,             // Quantity ordered
    image: String,                // Product image URL
    size: String,                 // Selected size
    color: String                 // Selected color
  }],
  pricing: {
    subtotal: Number,             // Sum of (price × quantity)
    deliveryFee: Number,          // Fixed: ৳200
    total: Number,                // subtotal + deliveryFee
    remainingAmount: Number       // Amount to pay on delivery
  },
  payment: {
    method: String,               // 'bKash' or 'Nagad'
    transactionId: String,        // Unique transaction ID
    status: String,               // 'Pending', 'Confirmed', 'Rejected'
    confirmedAt: Date,            // When payment was confirmed
    rejectionReason: String       // Reason if rejected
  },
  order: {
    status: String,               // 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
    notes: String                 // Admin notes
  },
  admin: {
    confirmedBy: ObjectId,        // Admin who confirmed payment
    rejectedBy: ObjectId          // Admin who rejected payment
  },
  createdAt: Date,                // Order creation time
  updatedAt: Date                 // Last update time
}
```

### Order Controller Functions

#### 1. Create Order
```javascript
POST /api/orders/create

Request Body:
{
  customerName: "Ahmed Hassan",
  customerPhone: "01978305319",
  customerEmail: "ahmed@example.com",
  customerAddress: "123 Main St, Dhaka",
  products: [
    {
      productId: "507f1f77bcf86cd799439011",
      title: "T-Shirt",
      price: 500,
      quantity: 2,
      image: "url",
      size: "L",
      color: "Blue"
    }
  ],
  subtotal: 1000,
  deliveryFee: 200,
  paymentMethod: "bKash"
}

Response:
{
  success: true,
  message: "Order created successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    total: 1200,
    deliveryFee: 200,
    remainingAmount: 1000
  }
}
```

#### 2. Get User Orders
```javascript
GET /api/orders/my-orders
Headers: Authorization: Bearer {firebaseToken}

Response:
{
  success: true,
  data: [
    {
      _id: "507f1f77bcf86cd799439012",
      orderCode: "ORD-123456",
      customer: {...},
      products: [...],
      pricing: {...},
      payment: {...},
      order: {...},
      createdAt: "2024-01-15T10:30:00Z"
    }
  ],
  pagination: {
    total: 5,
    page: 1,
    limit: 10,
    pages: 1
  }
}
```

#### 3. Get All Orders (Admin)
```javascript
GET /api/orders?status=Pending&paymentStatus=Pending&page=1&limit=10
Headers: Authorization: Bearer {adminToken}

Query Parameters:
- status: Order status filter (Pending, Processing, Shipped, Delivered, Cancelled)
- paymentStatus: Payment status filter (Pending, Confirmed, Rejected)
- page: Page number (default: 1)
- limit: Items per page (default: 10)

Response: Same as user orders
```

#### 4. Confirm Payment (Admin)
```javascript
PATCH /api/orders/{orderId}/confirm-payment
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  transactionId: "TXN123456789",
  adminId: "admin_user_id"
}

Response:
{
  success: true,
  message: "Payment confirmed successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    paymentStatus: "Confirmed",
    orderStatus: "Processing"
  }
}
```

#### 5. Reject Payment (Admin)
```javascript
PATCH /api/orders/{orderId}/reject-payment
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  reason: "Transaction ID not found",
  adminId: "admin_user_id"
}

Response:
{
  success: true,
  message: "Payment rejected successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    paymentStatus: "Rejected",
    orderStatus: "Cancelled"
  }
}
```

#### 6. Update Order Status (Admin)
```javascript
PATCH /api/orders/{orderId}/update-status
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  status: "Shipped",
  notes: "Order dispatched from warehouse"
}

Response:
{
  success: true,
  message: "Order status updated successfully",
  data: {...}
}
```

#### 7. Get Order Statistics (Admin)
```javascript
GET /api/orders/stats/overview
Headers: Authorization: Bearer {adminToken}

Response:
{
  success: true,
  data: {
    totalOrders: 150,
    pendingPayments: 25,
    confirmedPayments: 120,
    rejectedPayments: 5,
    totalRevenue: 180000
  }
}
```

---

## Frontend Implementation

### Checkout Pages

#### 1. CheckoutPartialPayment.jsx (Simple Payment Page)
**Location**: `Client/src/pages/CheckoutPartialPayment.jsx`

**Features**:
- Order summary display
- Payment method selector (bKash/Nagad)
- Payment instructions with copy buttons
- Transaction ID input
- Direct payment submission

**Key Components**:
```javascript
// Get user data
const { user } = useAuth();

// Get cart items
const { cart, clearCart } = useCart();

// Format prices
const { formatPrice } = useCurrency();

// State management
const [paymentData, setPaymentData] = useState({
  method: 'bKash',
  transactionId: ''
});

// Order creation
const orderData = {
  customerName: user?.displayName || 'User',
  customerPhone: '01978305319',
  customerEmail: user?.email || '',
  customerAddress: 'Address will be collected from checkout',
  products: cart.map(item => ({...})),
  subtotal: orderSummary.subtotal,
  deliveryFee: orderSummary.deliveryFee,
  paymentMethod: paymentData.method,
  transactionId: paymentData.transactionId
};
```

#### 2. CheckoutModern.jsx (4-Step Checkout)
**Location**: `Client/src/pages/CheckoutModern.jsx`

**Features**:
- Step 1: Address collection
- Step 2: Order review
- Step 3: Payment method & transaction ID
- Step 4: Confirmation
- Progress indicator
- Sticky order summary

**Step Components**:
- `AddressStep.jsx`: Collect delivery address
- `ReviewStep.jsx`: Review order details
- `PaymentStep.jsx`: Select payment method and enter transaction ID
- `ConfirmationStep.jsx`: Show success message

### API Service

**Location**: `Client/src/services/api.js`

```javascript
// Create order
export const createPartialPaymentOrder = (data) => 
  api.post("/orders/create", data);

// Get user orders
export const getUserOrders = () => 
  api.get("/orders/my-orders");

// Get all orders (admin)
export const getAllOrders = () => 
  api.get("/orders");

// Confirm payment (admin)
export const confirmOrderPayment = (id, data) =>
  api.patch(`/orders/${id}/confirm-payment`, data);

// Reject payment (admin)
export const rejectOrderPayment = (id, data) =>
  api.patch(`/orders/${id}/reject-payment`, data);

// Get order statistics (admin)
export const getOrderStats = () => 
  api.get("/orders/stats/overview");
```

### Invoice Template

**Location**: `Client/src/utils/printTemplate.js`

**Features**:
- Professional invoice design
- Order details
- Product list with images
- Payment information
- Delivery address
- Print-friendly layout

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/create` | Create new order |
| GET | `/api/orders/:id` | Get order by ID |

### User Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/my-orders` | Get user's orders |

### Admin Endpoints (Requires Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (with filters) |
| PATCH | `/api/orders/:id/confirm-payment` | Confirm payment |
| PATCH | `/api/orders/:id/reject-payment` | Reject payment |
| PATCH | `/api/orders/:id/update-status` | Update order status |
| GET | `/api/orders/stats/overview` | Get order statistics |

---

## Database Schema

### Order Collection Indexes

```javascript
// Fast payment status queries
orderSchema.index({ 'payment.status': 1, createdAt: -1 });

// Fast customer phone queries
orderSchema.index({ 'customer.phone': 1 });

// Fast order code queries
orderSchema.index({ orderCode: 1 });
```

### Data Validation

**Phone Number**: 10-15 digits
**Payment Method**: 'bKash' or 'Nagad'
**Order Status**: 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
**Payment Status**: 'Pending', 'Confirmed', 'Rejected'

---

## User Guide

### How to Place an Order

#### Step 1: Add Products to Cart
1. Browse products on the website
2. Click "Add to Cart"
3. Select size and color if applicable
4. Confirm quantity

#### Step 2: Go to Checkout
1. Click "Checkout" button
2. Choose payment method: "Partial Payment" or "Cash on Delivery"
3. Select "Partial Payment"

#### Step 3: Choose Payment Method
1. Select bKash or Nagad
2. Note the payment number: **01978305319**
3. Note the amount to send (delivery fee)

#### Step 4: Make Payment
1. Open your bKash/Nagad app
2. Select "Send Money"
3. Enter recipient: **01978305319**
4. Enter amount: **৳200** (or as shown)
5. Use order code as reference
6. Complete the transaction

#### Step 5: Submit Transaction ID
1. Copy the transaction ID from your payment confirmation
2. Paste it in the "Transaction ID" field
3. Click "Submit Payment"

#### Step 6: Wait for Verification
1. You'll receive a confirmation message
2. Admin will verify within 24 hours
3. You'll receive a notification when verified
4. Order will proceed to processing

#### Step 7: Receive Order
1. Track your order status
2. Pay remaining amount on delivery (COD)
3. Receive your products

### Tracking Your Order

1. Go to **Orders** page
2. View all your orders
3. Check payment status:
   - **Pending**: Waiting for admin verification
   - **Confirmed**: Payment verified, order processing
   - **Rejected**: Payment rejected, contact support
4. Check order status:
   - **Pending**: Order received
   - **Processing**: Being prepared
   - **Shipped**: On the way
   - **Delivered**: Received

### Payment Information

**Payment Number**: 01978305319
**Payment Methods**: bKash, Nagad
**Delivery Fee**: ৳200 (fixed)
**Verification Time**: Within 24 hours

---

## Admin Guide

### Accessing Admin Dashboard

1. Login with admin account
2. Go to **Admin** → **Orders**
3. View all pending orders

### Verifying Payments

#### Step 1: Review Pending Orders
1. Filter by "Payment Status: Pending"
2. Check customer details
3. Verify transaction ID format

#### Step 2: Confirm Payment
1. Click "Confirm Payment" button
2. Enter the transaction ID
3. Click "Confirm"
4. Order status changes to "Processing"

#### Step 3: Reject Payment (if needed)
1. Click "Reject Payment" button
2. Enter rejection reason
3. Click "Reject"
4. Order status changes to "Cancelled"

### Managing Orders

#### Update Order Status
1. Select order
2. Click "Update Status"
3. Choose new status:
   - **Processing**: Being prepared
   - **Shipped**: Dispatched
   - **Delivered**: Received by customer
   - **Cancelled**: Order cancelled
4. Add notes if needed
5. Save changes

#### View Order Statistics
1. Go to **Admin** → **Dashboard**
2. View:
   - Total orders
   - Pending payments
   - Confirmed payments
   - Rejected payments
   - Total revenue

### Best Practices

1. **Verify Transactions**: Always verify transaction IDs with payment provider
2. **Timely Verification**: Verify payments within 24 hours
3. **Clear Communication**: Add notes for customer reference
4. **Track Revenue**: Monitor payment statistics regularly
5. **Handle Disputes**: Document rejection reasons clearly

---

## Configuration

### Environment Variables

**Server (.env)**:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/Borka_Bazar
PORT=5000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email@firebase.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your_private_key
```

**Client (.env.local)**:
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Payment Configuration

**Payment Number**: 01978305319
**Delivery Fee**: ৳200 (fixed)
**Payment Methods**: bKash, Nagad
**Verification Timeout**: 24 hours

To change these values, update:
- `Client/src/pages/CheckoutPartialPayment.jsx`
- `Client/src/pages/CheckoutModern.jsx`
- `Server/controllers/orderController.js`

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required fields" | Incomplete order data | Ensure all fields are filled |
| "Invalid payment method" | Wrong payment method | Select bKash or Nagad |
| "Transaction ID already exists" | Duplicate transaction ID | Use unique transaction ID |
| "Order not found" | Invalid order ID | Check order ID |
| "Cannot confirm payment" | Payment already confirmed/rejected | Check payment status |

### Error Responses

```javascript
// 400 Bad Request
{
  success: false,
  message: "Missing required fields"
}

// 404 Not Found
{
  success: false,
  message: "Order not found"
}

// 500 Internal Server Error
{
  success: false,
  message: "Failed to create order",
  error: "error details"
}
```

---

## Security Considerations

1. **Authentication**: All user endpoints require Firebase authentication
2. **Authorization**: Admin endpoints require admin role verification
3. **Validation**: All inputs are validated on frontend and backend
4. **Unique Constraints**: Order codes and transaction IDs are unique
5. **Data Encryption**: Sensitive data is encrypted in transit (HTTPS)
6. **Rate Limiting**: Implement rate limiting for API endpoints
7. **Input Sanitization**: All user inputs are sanitized

---

## Performance Optimization

1. **Database Indexes**: Optimized queries with proper indexing
2. **Pagination**: Orders are paginated (default: 10 per page)
3. **Caching**: Implement caching for frequently accessed data
4. **Lazy Loading**: Images and components are lazy-loaded
5. **Code Splitting**: Frontend code is split for faster loading

---

## Troubleshooting

### Orders Not Showing
**Problem**: User's orders not visible in Orders page
**Solution**: 
1. Ensure user email matches order email
2. Check Firebase authentication token
3. Verify user is logged in

### Payment Verification Delayed
**Problem**: Payment not verified within 24 hours
**Solution**:
1. Contact admin support
2. Provide order code and transaction ID
3. Check payment provider confirmation

### Transaction ID Rejected
**Problem**: "Transaction ID already exists" error
**Solution**:
1. Use unique transaction ID
2. Check if order already exists
3. Contact support if duplicate

---

## Support & Contact

**Email**: info@borkabazar.com
**Phone**: 01978305319
**WhatsApp**: https://api.whatsapp.com/message/OSBDQIJSDBKUP1
**Facebook**: https://www.facebook.com/anamulhaque.joy.188

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release |
| 1.1.0 | 2024-01-20 | Added order tracking |
| 1.2.0 | 2024-01-25 | Added invoice printing |

---

## License

This payment system is proprietary to Borka Bazar. All rights reserved.

---

**Last Updated**: January 2024
**Documentation Version**: 1.2.0
