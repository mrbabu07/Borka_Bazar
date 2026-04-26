# Automated Test Checklist - Checkout to Order Flow

## Pre-Test Verification

### Backend Checks
- [ ] Server running on port 5000
- [ ] MongoDB connected
- [ ] All routes registered
- [ ] No startup errors

**Verification Command:**
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Expected response:
# { "status": "ok" }
```

### Frontend Checks
- [ ] Dev server running on port 5173
- [ ] No build errors
- [ ] All dependencies installed
- [ ] No console errors on load

**Verification Command:**
```bash
# Check if frontend is running
curl http://localhost:5173

# Expected: HTML response (no errors)
```

### Database Checks
- [ ] MongoDB running
- [ ] Database exists: `borka_bazar`
- [ ] Collections exist: users, products, orders
- [ ] No connection errors

**Verification Command:**
```bash
# Connect to MongoDB
mongo

# Check database
use borka_bazar
show collections

# Expected collections:
# - users
# - products
# - orders
# - etc.
```

---

## Test Execution Checklist

### PHASE 1: CUSTOMER CHECKOUT

#### 1.1 Customer Registration/Login
- [ ] Customer account exists or created
- [ ] Email: testcustomer@example.com
- [ ] Password: TestPassword123!
- [ ] Login successful
- [ ] Redirected to home page

**API Check:**
```bash
# Check user exists in database
curl -X GET http://localhost:5000/api/users/testcustomer@example.com

# Expected: User object with email
```

---

#### 1.2 Add Product to Cart
- [ ] Product selected: T-Shirt
- [ ] Size selected: M
- [ ] Color selected: Blue
- [ ] Quantity: 2
- [ ] Added to cart successfully
- [ ] Cart count updated
- [ ] No console errors

**Local Storage Check:**
```javascript
// In browser console
localStorage.getItem('cart')

// Expected: Array with product object
```

---

#### 1.3 Checkout Page Load
- [ ] Checkout page loads
- [ ] Cart items displayed
- [ ] Subtotal: ৳1,000
- [ ] Delivery fee: ৳120
- [ ] Total: ৳1,120
- [ ] No console errors

**Console Check:**
```javascript
// Should see delivery settings applied
console.log('Delivery settings:', deliverySettings)
```

---

#### 1.4 Fill Shipping Information
- [ ] Name field: "Test Customer"
- [ ] Phone field: "01521721946"
- [ ] Address field: "123 Main Street"
- [ ] City field: "Dhaka"
- [ ] Area field: "Gulshan"
- [ ] Zip code field: "1212"
- [ ] All fields accept input
- [ ] No validation errors

**Form Validation Check:**
```javascript
// In browser console
document.querySelector('form').checkValidity()

// Expected: true
```

---

#### 1.5 Select Payment Method
- [ ] COD option selected
- [ ] Payment method: "cod"
- [ ] No payment gateway appears
- [ ] Order summary shows correct totals

**Form Data Check:**
```javascript
// In browser console
formData.paymentMethod

// Expected: "cod"
```

---

#### 1.6 Place Order
- [ ] "Place Order" button clicked
- [ ] Loading state appears
- [ ] No console errors
- [ ] API call made to POST /api/orders

**Network Check:**
```
Request:
- Method: POST
- URL: http://localhost:5000/api/orders
- Status: 201 Created

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "order_id",
    "orderCode": "ORD-XXXXXX",
    "advancePayment": {
      "method": "bKash",
      "amount": 120,
      "status": "Pending"
    }
  }
}
```

---

#### 1.7 Order Confirmation
- [ ] Redirected to /orders page
- [ ] Success notification appears
- [ ] Order visible in list
- [ ] Status: "Pending"
- [ ] Advance payment: "৳120 - Pending" (yellow)

**Database Check:**
```javascript
// In MongoDB
db.orders.findOne({ orderCode: "ORD-XXXXXX" })

// Expected fields:
{
  "orderCode": "ORD-XXXXXX",
  "orderStatus": "Pending",
  "advancePayment": {
    "method": "bKash",
    "amount": 120,
    "status": "Pending"
  },
  "totalPrice": 1120,
  "subtotal": 1000,
  "deliveryCharge": 120
}
```

---

### PHASE 2: ADMIN CONFIRMATION

#### 2.1 Admin Login
- [ ] Admin account exists or created
- [ ] Email: admin@example.com
- [ ] Password: AdminPassword123!
- [ ] Login successful
- [ ] Admin role verified

**Database Check:**
```javascript
// In MongoDB
db.users.findOne({ email: "admin@example.com" })

// Expected: role: "admin"
```

---

#### 2.2 Navigate to Admin Orders
- [ ] Admin orders page loads
- [ ] Order list displays
- [ ] Test order visible
- [ ] Status: "Pending"
- [ ] No console errors

**API Check:**
```bash
# Get all orders (admin)
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer <admin_token>"

# Expected: Array of orders including test order
```

---

#### 2.3 Expand Order Details
- [ ] Order expands
- [ ] Shows order items
- [ ] Shows customer info
- [ ] Shows delivery address
- [ ] Shows "Confirm Advance Payment" button (yellow)

**UI Check:**
```javascript
// In browser console
document.querySelector('[class*="Confirm Advance Payment"]')

// Expected: Button element exists
```

---

#### 2.4 Open Payment Modal
- [ ] "Confirm Advance Payment" button clicked
- [ ] Modal opens
- [ ] Shows payment details
- [ ] Transaction ID input field visible
- [ ] "Confirm Payment" button disabled (empty input)

**Modal Check:**
```javascript
// In browser console
document.querySelector('[role="dialog"]')

// Expected: Modal element exists
```

---

#### 2.5 Enter Transaction ID
- [ ] Transaction ID input accepts text
- [ ] Value: "TXN20250115001"
- [ ] "Confirm Payment" button becomes enabled

**Input Check:**
```javascript
// In browser console
document.querySelector('input[placeholder*="Transaction"]').value

// Expected: "TXN20250115001"
```

---

#### 2.6 Confirm Payment
- [ ] "Confirm Payment" button clicked
- [ ] Loading state appears
- [ ] API call made to PATCH /api/orders/:id/confirm-advance-payment
- [ ] Success response received (200 OK)
- [ ] Modal closes
- [ ] Success toast appears

**Network Check:**
```
Request:
- Method: PATCH
- URL: http://localhost:5000/api/orders/:id/confirm-advance-payment
- Status: 200 OK

Request Body:
{
  "transactionId": "TXN20250115001",
  "adminId": "admin_user_id"
}

Response:
{
  "success": true,
  "message": "Advance payment confirmed successfully",
  "data": {
    "orderId": "order_id",
    "orderCode": "ORD-XXXXXX",
    "advancePaymentStatus": "Confirmed",
    "orderStatus": "Processing"
  }
}
```

---

#### 2.7 Verify Order Status Updated
- [ ] Order status changed to "Processing"
- [ ] "Confirm Advance Payment" button disappeared
- [ ] Order card updated in list

**Database Check:**
```javascript
// In MongoDB
db.orders.findOne({ orderCode: "ORD-XXXXXX" })

// Expected:
{
  "orderStatus": "Processing",
  "advancePayment": {
    "status": "Confirmed",
    "transactionId": "TXN20250115001",
    "confirmedAt": <timestamp>,
    "confirmedBy": <admin_id>
  }
}
```

---

### PHASE 3: CUSTOMER SEES CONFIRMATION

#### 3.1 Customer Refreshes Order Page
- [ ] Customer logged in
- [ ] Order page loads
- [ ] Order status: "Processing"
- [ ] No yellow payment highlight
- [ ] Advance payment shows as "Confirmed" (green)

**UI Check:**
```javascript
// In browser console
document.querySelector('[class*="Confirmed"]')

// Expected: Element with "Confirmed" status
```

---

#### 3.2 View Order Details
- [ ] Order detail modal opens
- [ ] Shows "✓ Confirmed" status (green)
- [ ] Shows transaction ID: "TXN20250115001"
- [ ] Shows confirmation date

**Modal Check:**
```javascript
// In browser console
document.querySelector('[class*="Advance Payment"]').textContent

// Expected: Contains "Confirmed" and transaction ID
```

---

### PHASE 4: ORDER PROCESSING

#### 4.1 Admin Updates Order Status
- [ ] Admin logged in
- [ ] Order page loads
- [ ] Status dropdown available
- [ ] Can select "Shipped"
- [ ] Status updates successfully

**API Check:**
```bash
# Update order status
curl -X PATCH http://localhost:5000/api/orders/:id/update-status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'

# Expected: 200 OK with updated order
```

---

#### 4.2 Update to Delivered
- [ ] Status changed to "Shipped"
- [ ] Can select "Delivered"
- [ ] Status updates to "Delivered"
- [ ] Success notification appears

**Database Check:**
```javascript
// In MongoDB
db.orders.findOne({ orderCode: "ORD-XXXXXX" })

// Expected: orderStatus: "Delivered"
```

---

#### 4.3 Customer Sees Final Status
- [ ] Customer refreshes order page
- [ ] Order shows "Delivered" status
- [ ] All order details visible
- [ ] Confirmed payment info shown

---

## Error Handling Checks

### 401 Unauthorized
- [ ] Admin token is valid
- [ ] Authorization header sent correctly
- [ ] Firebase token obtained
- [ ] Error message clear

**Check:**
```javascript
// In browser console
localStorage.getItem('token')

// Expected: Valid JWT token
```

### 404 Not Found
- [ ] Backend server running
- [ ] Route is PATCH (not PUT)
- [ ] Order ID is correct
- [ ] Error message clear

**Check:**
```bash
# Verify route exists
curl -X OPTIONS http://localhost:5000/api/orders/:id/confirm-advance-payment

# Expected: 200 OK
```

### Validation Errors
- [ ] Required fields validated
- [ ] Transaction ID required
- [ ] Order status checked
- [ ] Error messages clear

**Check:**
```bash
# Try to confirm without transaction ID
curl -X PATCH http://localhost:5000/api/orders/:id/confirm-advance-payment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": ""}'

# Expected: 400 Bad Request with error message
```

---

## Performance Checks

### Page Load Times
- [ ] Checkout page: < 2 seconds
- [ ] Admin orders page: < 2 seconds
- [ ] Order detail modal: < 1 second

**Check:**
```javascript
// In browser console
performance.measure('pageLoad')
performance.getEntriesByName('pageLoad')
```

### API Response Times
- [ ] Create order: < 1 second
- [ ] Confirm payment: < 1 second
- [ ] Get orders: < 1 second

**Check:**
```javascript
// In Network tab
// Check "Time" column for each request
```

### Bundle Size
- [ ] Main bundle: < 400 KB (gzipped)
- [ ] No unused dependencies
- [ ] No console warnings

**Check:**
```bash
# Check bundle size
npm run build

# Expected: "built in X.XXs"
```

---

## Security Checks

### Authentication
- [ ] Firebase token required
- [ ] Token validated on backend
- [ ] Unauthorized requests rejected (401)
- [ ] Admin role verified

**Check:**
```bash
# Try without token
curl -X GET http://localhost:5000/api/orders

# Expected: 401 Unauthorized
```

### Authorization
- [ ] Only admins can confirm payments
- [ ] Only order owner can view order
- [ ] Transaction ID validated
- [ ] Duplicate transaction ID rejected

**Check:**
```bash
# Try to confirm with duplicate transaction ID
curl -X PATCH http://localhost:5000/api/orders/:id/confirm-advance-payment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TXN20250115001"}'

# Expected: 400 Bad Request - "Transaction ID already used"
```

### Data Validation
- [ ] Required fields validated
- [ ] Input sanitized
- [ ] No SQL injection possible
- [ ] No XSS vulnerabilities

---

## Final Verification

### All Tests Pass If:
- [x] Order created with correct amounts
- [x] Advance payment initialized as "Pending"
- [x] Customer sees pending payment (yellow)
- [x] Admin can confirm payment
- [x] Order status changes to "Processing"
- [x] Customer sees confirmed payment (green)
- [x] Admin can update order status
- [x] Customer sees status updates
- [x] No console errors
- [x] No network errors
- [x] No database errors
- [x] All API calls succeed
- [x] All validations work
- [x] Performance acceptable
- [x] Security verified

---

## Test Results

**Date**: _______________
**Tester**: _______________
**Environment**: 
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- Database: MongoDB

**Results**:
- [ ] All tests passed ✅
- [ ] Some tests failed ❌
- [ ] Issues found: _______________

**Issues Found**:
1. _______________
2. _______________
3. _______________

**Fixes Applied**:
1. _______________
2. _______________
3. _______________

**Re-test Results**:
- [ ] All tests passed ✅
- [ ] Some tests still failing ❌

**Sign-off**: _______________

---

**Status**: READY FOR TESTING
