# Advance Payment (Delivery Fee) System Documentation

## Overview
The Advance Payment system allows customers to pay delivery fees upfront during checkout. Admin can then verify and confirm these payments, which triggers order processing.

## System Architecture

### 1. Database Schema (Backend)

#### Order Model - advancePayment Field
```javascript
advancePayment: {
  method: {
    type: String,
    enum: ['bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer'],
    default: 'bKash',
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  transactionId: {
    type: String,
    sparse: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Paid', 'Failed', 'Rejected'],
    default: 'Pending',
  },
  paidAt: Date,
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  confirmedAt: Date,
}
```

### 2. Backend API Endpoints

#### Create Order
**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "orderItems": [...],
  "shippingInfo": {...},
  "subtotal": 1000,
  "deliveryCharge": 120,
  "total": 1120,
  "paymentMethod": "COD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderCode": "ORD-123456",
    "advancePayment": {
      "method": "bKash",
      "amount": 120,
      "status": "Pending"
    }
  }
}
```

#### Confirm Advance Payment (Admin)
**Endpoint:** `PUT /api/orders/:id/confirm-advance-payment`

**Request Body:**
```json
{
  "transactionId": "TXN123456789",
  "adminId": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Advance payment confirmed successfully",
  "data": {
    "orderId": "order_id",
    "orderCode": "ORD-123456",
    "advancePaymentStatus": "Confirmed",
    "orderStatus": "Processing"
  }
}
```

### 3. Frontend Components

#### Helper Functions (Orders.jsx)

```javascript
// Get advance payment details
const getAdvancePaymentInfo = (order) => {
  return order.advancePayment || order.payment?.advance || null;
};

// Check if advance payment is pending
const isAdvancePaymentPending = (order) => {
  const advancePayment = getAdvancePaymentInfo(order);
  return advancePayment?.status === 'Pending';
};
```

#### Grid Card Display
Shows advance payment information in yellow highlight when pending:
- Payment method (bKash, Nagad, etc.)
- Amount (delivery fee)
- Status (Pending/Confirmed)

#### Detail Modal Display
Shows comprehensive advance payment information:
- **Pending State (Yellow):**
  - Method and amount
  - Status badge
  - Message: "Awaiting confirmation"
  
- **Confirmed State (Green):**
  - Method and amount
  - Status badge
  - Transaction ID
  - Confirmation timestamp
  - Checkmark icon

## Payment Flow

### Step 1: Order Creation
1. Customer places order with COD payment method
2. Delivery fee is calculated (e.g., ৳120)
3. Order created with `advancePayment.status = 'Pending'`
4. Order status: `Pending`

### Step 2: Customer Pays Delivery Fee
1. Customer pays ৳120 via bKash/Nagad/Rocket/Upay
2. Customer receives transaction ID
3. Customer provides transaction ID to admin (via support/email)

### Step 3: Admin Confirms Payment
1. Admin views order in admin panel
2. Admin sees "Advance Payment: ৳120 - Pending"
3. Admin verifies payment in payment gateway
4. Admin enters transaction ID and clicks "Confirm"
5. Backend updates:
   - `advancePayment.status = 'Confirmed'`
   - `advancePayment.transactionId = 'TXN123456789'`
   - `advancePayment.confirmedAt = new Date()`
   - `advancePayment.confirmedBy = adminId`
   - `orderStatus = 'Processing'`

### Step 4: Order Processing
1. Order status changes to "Processing"
2. Customer sees confirmed payment in order page
3. Admin can now process order for shipment
4. Customer will pay remaining amount (product price) on delivery

## Frontend Display Examples

### Grid Card - Pending Payment
```
Order #ABC123
Status: Pending
Product: T-Shirt
Total: ৳1,120
Delivery: ৳120
⏳ Advance Payment: ৳120
```

### Grid Card - Confirmed Payment
```
Order #ABC123
Status: Processing
Product: T-Shirt
Total: ৳1,120
Delivery: ৳120
```

### Detail Modal - Pending Payment
```
💳 Advance Payment (Delivery Fee)
Method: bKash
Amount: ৳120
Status: Pending

⏳ Awaiting confirmation from admin
```

### Detail Modal - Confirmed Payment
```
💳 Advance Payment (Delivery Fee)
Method: bKash
Amount: ৳120
Status: ✓ Confirmed

Transaction ID: TXN123456789
✓ Confirmed on Jan 15, 2025
```

## Admin Panel Integration

### Pending Payments View
Admin should see:
- List of orders with pending advance payments
- Order code and customer name
- Payment method and amount
- "Confirm Payment" button

### Confirmation Process
1. Admin clicks "Confirm Payment"
2. Modal opens asking for transaction ID
3. Admin enters transaction ID
4. Admin clicks "Confirm"
5. System validates and updates order

## Error Handling

### Duplicate Transaction ID
```json
{
  "success": false,
  "message": "Transaction ID already used"
}
```

### Invalid Status
```json
{
  "success": false,
  "message": "Cannot confirm advance payment. Current status: Confirmed"
}
```

### Missing Transaction ID
```json
{
  "success": false,
  "message": "Transaction ID is required"
}
```

## Backward Compatibility

The system maintains backward compatibility with legacy payment structures:
- New orders use `advancePayment` field
- Legacy orders use `payment.advance` field
- Both structures are checked and updated
- Frontend handles both structures gracefully

## Testing Checklist

- [ ] Order created with advance payment marked as Pending
- [ ] Grid card shows advance payment amount in yellow
- [ ] Detail modal shows advance payment details
- [ ] Admin can confirm payment with transaction ID
- [ ] Order status changes to Processing after confirmation
- [ ] Confirmed payment shows in green on customer's order page
- [ ] Transaction ID is validated for uniqueness
- [ ] Duplicate transaction IDs are rejected
- [ ] Confirmation timestamp is recorded
- [ ] Admin ID is recorded for audit trail

## Future Enhancements

1. **Automated Payment Verification**
   - Integrate with payment gateway APIs
   - Auto-confirm payments when verified

2. **Payment Reminders**
   - Send SMS/email reminders for pending payments
   - Auto-cancel orders after X days of pending payment

3. **Partial Payments**
   - Allow customers to pay partial delivery fee
   - Track partial payment status

4. **Payment History**
   - Show payment history in order details
   - Track all payment attempts and confirmations

5. **Refund Management**
   - Handle refunds for cancelled orders
   - Track refund status and dates
