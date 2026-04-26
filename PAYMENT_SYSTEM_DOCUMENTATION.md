# Borka Bazar - 2-Step Payment Tracking System Documentation

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

The Borka Bazar 2-Step Payment Tracking System is an advanced e-commerce payment solution that tracks both advance payment (delivery fee) and remaining payment (product cost) separately. This system provides complete payment visibility and control.

### Key Features
- ✅ **Advance Payment Tracking**: Delivery fee payment via bKash/Nagad
- ✅ **Remaining Payment Tracking**: Product cost payment via COD or online
- ✅ **Dual Payment Status**: Track advance and remaining payments separately
- ✅ **Overall Payment Status**: Shows if order is "partial" or "full" paid
- ✅ **Manual Verification**: Admin manually verifies each payment
- ✅ **Payment Breakdown**: Clear display of payment components
- ✅ **Transaction ID Validation**: Unique transaction IDs per payment
- ✅ **Real-time Status Updates**: Instant payment status changes

### Payment Methods
- **Advance Payment**: bKash or Nagad (Delivery Fee: ৳200)
- **Remaining Payment**: Cash on Delivery (COD) or bKash/Nagad (Product Cost)
- **Payment Number**: 01978305319 (for all online payments)

---

## System Architecture

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Frontend**: React.js + Tailwind CSS
- **Authentication**: Firebase Authentication
- **Payment Processing**: Manual verification (no third-party gateway)

### Payment Structure

```
Order Total = Subtotal + Delivery Fee

Example:
├── Subtotal (Products): ৳1,000
├── Delivery Fee: ৳200
└── Total: ৳1,200

Payment Breakdown:
├── Advance Payment (Delivery Fee): ৳200
│   ├── Method: bKash/Nagad
│   ├── Status: Pending → Confirmed → Rejected
│   └── Transaction ID: TXN123456789
│
└── Remaining Payment (Products): ৳1,000
    ├── Method: COD/bKash/Nagad
    ├── Status: Pending → Paid
    └── Transaction ID: TXN987654321 (if online)

Overall Payment Status:
├── Partial: Advance Confirmed + Remaining Pending
└── Full: Advance Confirmed + Remaining Paid
```

---

## Payment Flow

### Complete User Journey

```
1. User adds products to cart
   ↓
2. User proceeds to checkout
   ↓
3. User selects payment method (bKash/Nagad) for delivery fee
   ↓
4. System generates unique Order Code (ORD-XXXXXX)
   ↓
5. Order created with:
   - Advance Payment: Pending
   - Remaining Payment: Pending
   - Payment Status: Partial
   ↓
6. User sends delivery fee (৳200) via bKash/Nagad
   ↓
7. User enters Transaction ID
   ↓
8. Admin verifies advance payment within 24 hours
   ↓
9. Advance Payment Status: Confirmed
   - Order Status: Processing
   - Payment Status: Still Partial
   ↓
10. Order is prepared and shipped
   ↓
11. User receives order and pays remaining amount (COD)
   ↓
12. User submits remaining payment (if online method)
   ↓
13. Admin verifies remaining payment
   ↓
14. Remaining Payment Status: Paid
    - Payment Status: Full
    - Order Status: Delivered
```

### Payment Status Logic

```javascript
if (advance.status === "Confirmed" && remaining.status === "Paid") {
  paymentStatus = "full"
} else {
  paymentStatus = "partial"
}
```

---

## Backend Implementation

### Order Model (MongoDB Schema)

```javascript
{
  orderCode: String,              // Unique: ORD-123456
  customer: {
    name: String,                 // Customer name
    phone: String,                // Customer phone (11 digits)
    email: String,                // Customer email
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
    // ADVANCE PAYMENT (Delivery Fee)
    advance: {
      method: String,             // 'bKash' or 'Nagad'
      transactionId: String,      // Unique transaction ID
      status: String,             // 'Pending', 'Confirmed', 'Rejected'
      amount: Number,             // Delivery fee (৳200)
      confirmedAt: Date,          // When confirmed
      rejectionReason: String     // Reason if rejected
    },
    
    // REMAINING PAYMENT (Product Cost)
    remaining: {
      method: String,             // 'COD', 'bKash', or 'Nagad'
      transactionId: String,      // Unique transaction ID (if online)
      status: String,             // 'Pending' or 'Paid'
      amount: Number,             // Product cost (subtotal)
      paidAt: Date                // When paid
    },
    
    // OVERALL PAYMENT STATUS
    paymentStatus: String         // 'partial' or 'full'
  },
  order: {
    status: String,               // 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
    notes: String                 // Admin notes
  },
  admin: {
    confirmedBy: ObjectId,        // Admin who confirmed advance payment
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
    remainingAmount: 1000,
    paymentStatus: "partial"
  }
}
```

#### 2. Confirm Advance Payment (Admin)
```javascript
PATCH /api/orders/{orderId}/confirm-advance-payment
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  transactionId: "TXN123456789",
  adminId: "admin_user_id"
}

Response:
{
  success: true,
  message: "Advance payment confirmed successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    advancePaymentStatus: "Confirmed",
    paymentStatus: "partial",
    orderStatus: "Processing"
  }
}
```

#### 3. Reject Advance Payment (Admin)
```javascript
PATCH /api/orders/{orderId}/reject-advance-payment
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  reason: "Transaction ID not found",
  adminId: "admin_user_id"
}

Response:
{
  success: true,
  message: "Advance payment rejected successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    advancePaymentStatus: "Rejected",
    orderStatus: "Cancelled"
  }
}
```

#### 4. Pay Remaining Amount (User)
```javascript
PATCH /api/orders/{orderId}/pay-remaining
Headers: Authorization: Bearer {userToken}

Request Body:
{
  method: "bKash",              // 'COD', 'bKash', or 'Nagad'
  transactionId: "TXN987654321" // Required for online methods
}

Response:
{
  success: true,
  message: "Remaining payment submitted for bKash",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    remainingPaymentStatus: "Pending",
    paymentStatus: "partial"
  }
}
```

#### 5. Confirm Remaining Payment (Admin)
```javascript
PATCH /api/orders/{orderId}/confirm-remaining
Headers: Authorization: Bearer {adminToken}

Request Body:
{
  adminId: "admin_user_id"
}

Response:
{
  success: true,
  message: "Remaining payment confirmed successfully",
  data: {
    orderId: "507f1f77bcf86cd799439012",
    orderCode: "ORD-123456",
    remainingPaymentStatus: "Paid",
    paymentStatus: "full"
  }
}
```

#### 6. Get User Orders
```javascript
GET /api/orders/my-orders?page=1&limit=10
Headers: Authorization: Bearer {userToken}

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
      payment: {
        advance: {...},
        remaining: {...},
        paymentStatus: "partial"
      },
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

---

## Frontend Implementation

### Components

#### 1. PaymentBreakdown Component
**Location**: `Client/src/components/PaymentBreakdown.jsx`

**Features**:
- Display overall payment status (Partial/Full)
- Show pricing breakdown (subtotal, delivery fee, total)
- Display advance payment details with status badge
- Display remaining payment details with status badge
- Show transaction IDs and dates
- Status legend

**Usage**:
```javascript
<PaymentBreakdown order={order} />
```

#### 2. PayRemainingForm Component
**Location**: `Client/src/components/PayRemainingForm.jsx`

**Features**:
- Payment method selector (COD/bKash/Nagad)
- Transaction ID input for online methods
- Payment instructions with copy buttons
- Form validation
- Loading state

**Usage**:
```javascript
<PayRemainingForm 
  order={order}
  onPaymentSubmitted={(data) => {
    // Handle payment submission
    fetchOrders();
  }}
/>
```

#### 3. Orders Page Integration
**Location**: `Client/src/pages/Orders.jsx`

**Features**:
- Display PaymentBreakdown in order card
- Show "Pay Remaining" button when eligible
- Modal for PayRemainingForm
- Refresh orders after payment submission

**Key States**:
```javascript
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
```

### API Service Functions

**Location**: `Client/src/services/api.js`

```javascript
// Pay remaining amount (User)
export const payRemainingAmount = (orderId, data) =>
  api.patch(`/orders/${orderId}/pay-remaining`, data);

// Confirm advance payment (Admin)
export const confirmAdvancePayment = (orderId, data) =>
  api.patch(`/orders/${orderId}/confirm-advance-payment`, data);

// Reject advance payment (Admin)
export const rejectAdvancePayment = (orderId, data) =>
  api.patch(`/orders/${orderId}/reject-advance-payment`, data);

// Confirm remaining payment (Admin)
export const confirmRemainingPayment = (orderId, data) =>
  api.patch(`/orders/${orderId}/confirm-remaining`, data);
```

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
| PATCH | `/api/orders/:id/pay-remaining` | Submit remaining payment |

### Admin Endpoints (Requires Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (with filters) |
| PATCH | `/api/orders/:id/confirm-advance-payment` | Confirm advance payment |
| PATCH | `/api/orders/:id/reject-advance-payment` | Reject advance payment |
| PATCH | `/api/orders/:id/confirm-remaining` | Confirm remaining payment |
| PATCH | `/api/orders/:id/update-status` | Update order status |
| GET | `/api/orders/stats/overview` | Get order statistics |

---

## Database Schema

### Order Collection Indexes

```javascript
// Fast payment status queries
orderSchema.index({ 'payment.advance.status': 1, createdAt: -1 });
orderSchema.index({ 'payment.remaining.status': 1, createdAt: -1 });
orderSchema.index({ 'payment.paymentStatus': 1, createdAt: -1 });

// Fast customer queries
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.phone': 1 });

// Fast order code queries
orderSchema.index({ orderCode: 1 });
```

### Data Validation

**Phone Number**: 10-15 digits
**Payment Methods**: 'bKash', 'Nagad', 'COD'
**Advance Status**: 'Pending', 'Confirmed', 'Rejected'
**Remaining Status**: 'Pending', 'Paid'
**Payment Status**: 'partial', 'full'
**Order Status**: 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

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
2. Enter delivery address
3. Review order details

#### Step 3: Choose Payment Method
1. Select "Partial Payment"
2. Choose bKash or Nagad for delivery fee
3. Note the payment number: **01978305319**
4. Note the delivery fee: **৳200**

#### Step 4: Make Advance Payment
1. Open your bKash/Nagad app
2. Select "Send Money"
3. Enter recipient: **01978305319**
4. Enter amount: **৳200**
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
2. When order arrives, pay remaining amount (COD)
3. Receive your products

#### Step 8: Pay Remaining Amount (Optional - if online)
1. Go to **Orders** page
2. Find your order
3. Click "Pay Remaining Amount" button
4. Select payment method (COD/bKash/Nagad)
5. If online, enter transaction ID
6. Submit payment
7. Admin will verify and confirm

### Tracking Your Order

1. Go to **Orders** page
2. View all your orders
3. Check **Payment Breakdown**:
   - **Advance Payment**: Status of delivery fee payment
   - **Remaining Payment**: Status of product cost payment
   - **Overall Status**: Partial or Full
4. Check **Order Status**:
   - **Pending**: Order received
   - **Processing**: Being prepared
   - **Shipped**: On the way
   - **Delivered**: Received

### Payment Information

**Payment Number**: 01978305319
**Advance Payment**: ৳200 (Delivery Fee)
**Remaining Payment**: Product Cost (via COD or online)
**Verification Time**: Within 24 hours

---

## Admin Guide

### Accessing Admin Dashboard

1. Login with admin account
2. Go to **Admin** → **Orders**
3. View all orders with payment status

### Verifying Advance Payments

#### Step 1: Review Pending Orders
1. Filter by "Advance Payment Status: Pending"
2. Check customer details
3. Verify transaction ID format

#### Step 2: Confirm Advance Payment
1. Click "Confirm Advance Payment" button
2. Enter the transaction ID
3. Click "Confirm"
4. Order status changes to "Processing"
5. Payment status remains "Partial"

#### Step 3: Reject Advance Payment (if needed)
1. Click "Reject Advance Payment" button
2. Enter rejection reason
3. Click "Reject"
4. Order status changes to "Cancelled"

### Verifying Remaining Payments

#### Step 1: Review Pending Remaining Payments
1. Filter by "Remaining Payment Status: Pending"
2. Check payment method
3. If online, verify transaction ID

#### Step 2: Confirm Remaining Payment
1. Click "Confirm Remaining Payment" button
2. Click "Confirm"
3. Remaining payment status changes to "Paid"
4. Overall payment status changes to "Full"

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
   - Pending advance payments
   - Confirmed advance payments
   - Pending remaining payments
   - Paid remaining payments
   - Total revenue

### Best Practices

1. **Verify Transactions**: Always verify transaction IDs with payment provider
2. **Timely Verification**: Verify payments within 24 hours
3. **Clear Communication**: Add notes for customer reference
4. **Track Revenue**: Monitor payment statistics regularly
5. **Handle Disputes**: Document rejection reasons clearly
6. **Follow Up**: Contact customers for pending payments after 24 hours

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
**Advance Payment Methods**: bKash, Nagad
**Remaining Payment Methods**: COD, bKash, Nagad
**Verification Timeout**: 24 hours

To change these values, update:
- `Client/src/components/PayRemainingForm.jsx`
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
| "Advance payment must be confirmed" | Trying to pay remaining before advance | Confirm advance payment first |
| "Remaining amount already paid" | Trying to pay twice | Check payment status |

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
8. **Transaction Verification**: Manual verification prevents fraud

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

### Cannot Pay Remaining Amount
**Problem**: "Pay Remaining" button not showing
**Solution**:
1. Ensure advance payment is confirmed
2. Check if remaining payment is already paid
3. Refresh page to update status

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
| 2.0.0 | 2024-04-20 | Complete 2-step payment tracking system |

---

## License

This payment system is proprietary to Borka Bazar. All rights reserved.

---

**Last Updated**: April 20, 2024
**Documentation Version**: 2.0.0
