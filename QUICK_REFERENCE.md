# Borka Bazar 2-Step Payment System - Quick Reference

## 🚀 Quick Start

### For Users
1. Add products to cart
2. Go to checkout
3. Pay delivery fee (৳200) via bKash/Nagad
4. Enter transaction ID
5. Wait for admin verification (24 hours)
6. Pay remaining amount on delivery (COD) or online

### For Admins
1. Go to Admin → Orders
2. Verify advance payment (delivery fee)
3. Verify remaining payment (product cost)
4. Update order status
5. View payment statistics

---

## 📱 Payment Methods

### Advance Payment (Delivery Fee)
- **Amount**: ৳200 (fixed)
- **Methods**: bKash, Nagad
- **Phone**: 01978305319
- **Status**: Pending → Confirmed → Rejected

### Remaining Payment (Product Cost)
- **Amount**: Subtotal (product cost)
- **Methods**: COD, bKash, Nagad
- **Status**: Pending → Paid

---

## 🔗 API Endpoints

### Create Order
```
POST /api/orders/create
Body: {
  customerName, customerPhone, customerEmail, customerAddress,
  products, subtotal, deliveryFee, paymentMethod
}
```

### Get User Orders
```
GET /api/orders/my-orders
Headers: Authorization: Bearer {token}
```

### Confirm Advance Payment (Admin)
```
PATCH /api/orders/{id}/confirm-advance-payment
Body: { transactionId, adminId }
```

### Pay Remaining Amount (User)
```
PATCH /api/orders/{id}/pay-remaining
Body: { method, transactionId }
```

### Confirm Remaining Payment (Admin)
```
PATCH /api/orders/{id}/confirm-remaining
Body: { adminId }
```

---

## 📊 Payment Status Logic

```javascript
// Advance Payment Status
'Pending'   → Waiting for admin verification
'Confirmed' → Payment verified, order processing
'Rejected'  → Payment rejected, order cancelled

// Remaining Payment Status
'Pending' → Waiting for payment or admin verification
'Paid'    → Payment confirmed

// Overall Payment Status
'partial' → Advance Confirmed + Remaining Pending
'full'    → Advance Confirmed + Remaining Paid
```

---

## 🗂️ File Structure

```
Backend:
├── Server/models/Order.js                    # Schema
├── Server/controllers/orderController.js     # Logic
└── Server/routes/orderRoutes.js              # Routes

Frontend:
├── Client/src/pages/Orders.jsx               # Orders page
├── Client/src/components/PaymentBreakdown.jsx
├── Client/src/components/PayRemainingForm.jsx
└── Client/src/services/api.js                # API calls
```

---

## 🔧 Configuration

**Payment Number**: 01978305319
**Delivery Fee**: ৳200
**Verification Time**: 24 hours

To change:
- Update `Client/src/components/PayRemainingForm.jsx`
- Update `Server/controllers/orderController.js`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Orders not showing | Check Firebase token, ensure email matches |
| "Pay Remaining" button not showing | Ensure advance payment is confirmed |
| Transaction ID error | Use unique transaction ID |
| 500 error | Check server logs, verify database connection |

---

## 📈 Database Queries

### Get Pending Advance Payments
```javascript
Order.find({ 'payment.advance.status': 'Pending' })
```

### Get Pending Remaining Payments
```javascript
Order.find({ 'payment.remaining.status': 'Pending' })
```

### Get Fully Paid Orders
```javascript
Order.find({ 'payment.paymentStatus': 'full' })
```

### Get User Orders
```javascript
Order.find({ 'customer.email': userEmail })
```

---

## 🎯 Key Components

### PaymentBreakdown
- Shows overall payment status
- Displays pricing breakdown
- Shows advance and remaining payment details
- Displays transaction IDs and dates

### PayRemainingForm
- Payment method selector
- Transaction ID input
- Payment instructions
- Form validation

### Orders Page
- Displays PaymentBreakdown
- Shows "Pay Remaining" button
- Opens payment modal
- Refreshes after submission

---

## 📝 Order Lifecycle

```
1. Order Created
   ├── Advance: Pending
   ├── Remaining: Pending
   └── Status: Partial

2. Advance Payment Confirmed
   ├── Advance: Confirmed
   ├── Remaining: Pending
   ├── Status: Partial
   └── Order: Processing

3. Remaining Payment Submitted
   ├── Advance: Confirmed
   ├── Remaining: Pending (waiting for admin)
   └── Status: Partial

4. Remaining Payment Confirmed
   ├── Advance: Confirmed
   ├── Remaining: Paid
   ├── Status: Full
   └── Order: Delivered
```

---

## 🔐 Security

- Firebase authentication required
- Admin role verification
- Input validation
- Unique transaction IDs
- HTTPS encryption
- Input sanitization

---

## 📞 Support

**Phone**: 01978305319
**Email**: info@borkabazar.com
**WhatsApp**: https://api.whatsapp.com/message/OSBDQIJSDBKUP1

---

## 📚 Documentation

- **Full Documentation**: `PAYMENT_SYSTEM_DOCUMENTATION.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Quick Reference**: `QUICK_REFERENCE.md` (this file)

---

## ✅ Checklist

- [x] Backend implementation complete
- [x] Frontend components created
- [x] Orders page integrated
- [x] API endpoints working
- [x] Database schema optimized
- [x] Documentation complete
- [x] Bug fixes applied
- [x] Testing completed
- [x] Production ready

---

**Last Updated**: April 20, 2024
**Version**: 2.0.0
**Status**: ✅ Production Ready
