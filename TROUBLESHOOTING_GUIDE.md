# Troubleshooting Guide - Borka Bazar Orders & Payment System

**Date**: April 26, 2026  
**Status**: ✅ Issues Identified & Fixed

---

## Common Issues & Solutions

### Issue 1: 500 Error on Order Creation

**Error Message**:
```
POST /api/orders 500 (Internal Server Error)
Order creation failed: AxiosError
```

**Cause**: Payment method case sensitivity
- Frontend sending `'cod'` (lowercase)
- Backend expects `'COD'` (uppercase)

**Solution**: ✅ FIXED
- Updated all checkout pages to use uppercase `'COD'`
- Files fixed:
  - Checkout.jsx
  - CheckoutPremium.jsx
  - GuestCheckout.jsx

**Verification**:
```javascript
// Check in browser console
// Should see order created successfully
// Order should appear in /orders page
```

---

### Issue 2: 500 Error on Confirm Advance Payment

**Error Message**:
```
PATCH /api/orders/:id/confirm-advance-payment 500 (Internal Server Error)
Payment confirmation error: Error: Failed to confirm advance payment
```

**Cause**: Null reference error when accessing `order.admin` object

**Solution**: ✅ FIXED
- Initialize `admin` object if it doesn't exist
- Added better error logging
- File fixed: Server/controllers/orderController.js

**Verification**:
```javascript
// Check backend logs for detailed error
// Should see: "Advance payment confirmed successfully"
// Order status should change to "Processing"
```

---

### Issue 3: HTML Nesting Error in Admin Dashboard

**Error Message**:
```
In HTML, <div> cannot be a descendant of <p>. This will cause a hydration error.
```

**Cause**: Invalid HTML structure in RealtimeStats component
- `<div>` element nested inside `<p>` tag

**Solution**: ✅ FIXED
- Moved `<div>` outside of `<p>` tag
- Restructured conditional rendering
- File fixed: Client/src/components/admin/RealtimeStats.jsx

**Verification**:
```javascript
// Go to /admin/orders
// RealtimeStats should display without errors
// No console errors about HTML nesting
```

---

## Debugging Steps

### Step 1: Check Backend Logs

```bash
# Terminal 1: Start backend
cd Server
npm start

# Look for error messages like:
# ✅ Server running on port 5000
# ❌ Confirm advance payment error: [error details]
```

### Step 2: Check Browser Console

```javascript
// Press F12 to open DevTools
// Go to Console tab
// Look for errors like:
// - "Order creation failed"
// - "Payment confirmation error"
// - "In HTML, <div> cannot be a descendant of <p>"
```

### Step 3: Check Network Tab

```javascript
// Press F12 to open DevTools
// Go to Network tab
// Look for failed requests:
// - POST /api/orders (should be 201)
// - PATCH /api/orders/:id/confirm-advance-payment (should be 200)
// - GET /api/orders (should be 200)
```

### Step 4: Check Database

```javascript
// Connect to MongoDB
use borka_bazar

// Find the test order
db.orders.findOne({ 
  "shippingInfo.email": "testcustomer@example.com" 
})

// Check advancePayment field
// Should have: status: "Pending" or "Confirmed"
```

---

## Testing Checklist

### Pre-Testing
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Firebase configured
- [ ] Build successful (no errors)

### Order Creation Test
- [ ] Go to checkout page
- [ ] Select "Cash on Delivery (COD)"
- [ ] Fill in all required fields
- [ ] Click "Place Order"
- [ ] **Expected**: Order created (no 500 error)
- [ ] **Expected**: Redirected to /orders page
- [ ] **Expected**: Order appears in list with "Pending" status
- [ ] **Expected**: Yellow highlight for pending payment

### Admin Confirmation Test
- [ ] Login as admin
- [ ] Go to /admin/orders
- [ ] **Expected**: RealtimeStats displays (no errors)
- [ ] Find test order
- [ ] Click "Confirm Advance Payment" button
- [ ] Enter transaction ID: `TXN20250115001`
- [ ] Click "Confirm Payment"
- [ ] **Expected**: Success toast notification
- [ ] **Expected**: Order status changes to "Processing"
- [ ] **Expected**: Payment shows as "Confirmed" (green)

### Customer View Test
- [ ] Logout admin
- [ ] Login as customer
- [ ] Go to /orders
- [ ] Click on order
- [ ] **Expected**: Payment shows as "Confirmed" (green)
- [ ] **Expected**: Transaction ID visible
- [ ] **Expected**: Confirmation date shown

---

## Error Reference

### Backend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Order validation failed: paymentInfo.method: 'cod' is not a valid enum value` | Lowercase payment method | Use uppercase 'COD' |
| `Cannot confirm advance payment. Current status: Pending` | Payment already confirmed | Check order status |
| `Transaction ID already used` | Duplicate transaction ID | Use unique transaction ID |
| `Order not found` | Invalid order ID | Verify order ID is correct |
| `Failed to confirm advance payment` | Null reference error | Initialize admin object |

### Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Order creation failed: AxiosError` | 500 error from backend | Check backend logs |
| `Payment confirmation error: Error: Failed to confirm advance payment` | 500 error from backend | Check backend logs |
| `In HTML, <div> cannot be a descendant of <p>` | Invalid HTML structure | Fix component structure |
| `Failed to load resource: net::ERR_CONNECTION_TIMED_OUT` | Backend not responding | Restart backend server |
| `Failed to load resource: the server responded with a status of 401` | Authentication error | Verify Firebase token |

---

## Performance Optimization

### Slow Order Creation
**Symptoms**: Order creation takes >5 seconds

**Solutions**:
1. Check MongoDB connection
2. Check network latency
3. Check backend CPU usage
4. Verify no blocking operations

### Slow Admin Dashboard
**Symptoms**: RealtimeStats takes >3 seconds to load

**Solutions**:
1. Check database query performance
2. Verify indexes are created
3. Check for N+1 queries
4. Optimize aggregation pipeline

---

## Security Checklist

- [ ] Firebase tokens are valid
- [ ] Admin role is verified
- [ ] Transaction IDs are unique
- [ ] Order IDs are validated
- [ ] User permissions are checked
- [ ] No sensitive data in logs
- [ ] HTTPS enabled in production

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] No network errors
- [ ] Build successful
- [ ] Database backups created
- [ ] Rollback plan ready

### Deployment
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify all endpoints
- [ ] Test order creation
- [ ] Test admin confirmation
- [ ] Monitor logs

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user feedback
- [ ] Document any issues
- [ ] Plan improvements

---

## Support Resources

### Documentation
- `MANUAL_TEST_GUIDE.md` - Step-by-step testing guide
- `ADVANCE_PAYMENT_SYSTEM.md` - System documentation
- `PROJECT_COMPLETION_REPORT.md` - Project overview
- `BUG_FIX_REPORT_APRIL26.md` - Bug fixes applied

### Logs
- Backend logs: `npm start` output
- Frontend logs: Browser console (F12)
- Database logs: MongoDB logs

### Contact
- For backend issues: Check Server logs
- For frontend issues: Check browser console
- For database issues: Check MongoDB connection

---

## Quick Reference

### Common Commands

```bash
# Start backend
cd Server
npm start

# Start frontend
cd Client
npm run dev

# Build frontend
cd Client
npm run build

# Run tests
node e2e-test.js

# Check MongoDB
mongo
use borka_bazar
db.orders.find()
```

### Common URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Admin Orders: http://localhost:5173/admin/orders
- Customer Orders: http://localhost:5173/orders
- Checkout: http://localhost:5173/checkout

### Test Credentials

```
Customer:
Email: testcustomer@example.com
Password: TestPassword123!

Admin:
Email: admin@example.com
Password: AdminPassword123!
```

---

## Frequently Asked Questions

### Q: Why is order creation failing?
**A**: Check if payment method is uppercase 'COD'. See Issue 1 above.

### Q: Why can't I confirm payment?
**A**: Check if you're logged in as admin. Verify Firebase token is valid.

### Q: Why is the admin dashboard showing errors?
**A**: Check for HTML nesting errors. See Issue 3 above.

### Q: How do I check if the backend is running?
**A**: Go to http://localhost:5000 - should see API info.

### Q: How do I check if the frontend is running?
**A**: Go to http://localhost:5173 - should see home page.

### Q: How do I verify the database connection?
**A**: Check backend logs for "✅ MongoDB connected".

---

## Conclusion

All identified issues have been fixed and documented. The system is ready for testing and deployment.

**Status**: ✅ READY FOR TESTING

For any issues not covered here, check the backend logs and browser console for detailed error messages.

