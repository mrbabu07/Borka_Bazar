# Test Execution Guide - Complete Checkout to Order Flow

## Prerequisites Setup

### 1. Start Backend Server
```bash
cd Server
npm start
```
Expected output:
```
✅ Server running on port 5000
✅ MongoDB connected
✅ Ready to accept requests
```

### 2. Start Frontend Dev Server
```bash
cd Client
npm run dev
```
Expected output:
```
✅ Vite dev server running on http://localhost:5173
✅ Ready for testing
```

### 3. Verify Database Connection
- MongoDB should be running
- Database: `borka_bazar` (or configured name)
- Collections: users, products, orders

---

## Test Execution Steps

### PHASE 1: CUSTOMER CHECKOUT (15-20 minutes)

#### Step 1: Create Test Customer Account
**If account doesn't exist:**
1. Go to http://localhost:5173/register
2. Fill in:
   ```
   Email: testcustomer@example.com
   Password: TestPassword123!
   Confirm Password: TestPassword123!
   ```
3. Click "Register"
4. Verify: Account created, redirected to home

**If account exists:**
1. Go to http://localhost:5173/login
2. Fill in:
   ```
   Email: testcustomer@example.com
   Password: TestPassword123!
   ```
3. Click "Login"
4. Verify: Logged in, redirected to home

---

#### Step 2: Add Product to Cart
1. Navigate to home page (http://localhost:5173)
2. Find a product (e.g., T-Shirt, price ৳500)
3. Click on product to view details
4. Select:
   - Size: M
   - Color: Blue
   - Quantity: 2
5. Click "Add to Cart"
6. **Verify:**
   - ✅ Toast notification: "T-Shirt added to cart!"
   - ✅ Cart icon shows count: 2
   - ✅ No console errors

**Console Check:**
```javascript
// Open browser console (F12)
// Should see no errors
// Should see product added message
```

---

#### Step 3: Go to Checkout
1. Click cart icon or navigate to http://localhost:5173/checkout
2. **Verify:**
   - ✅ Checkout page loads
   - ✅ Cart items displayed:
     - Product: T-Shirt
     - Quantity: 2
     - Unit Price: ৳500
     - Subtotal: ৳1,000
   - ✅ Delivery fee shown: ৳120
   - ✅ Total: ৳1,120

**Console Check:**
```javascript
// Check for delivery settings
// Should see: "✅ Delivery settings applied"
```

---

#### Step 4: Fill Shipping Information
1. Scroll to "Shipping Information" section
2. Fill in:
   ```
   Full Name: Test Customer
   Email: testcustomer@example.com (auto-filled)
   Phone: 01521721946
   Street Address: 123 Main Street
   Area: Gulshan
   City: Dhaka
   Postal Code: 1212
   ```
3. **Verify:**
   - ✅ All fields accept input
   - ✅ No validation errors
   - ✅ Form shows all entered data

---

#### Step 5: Select Payment Method
1. Scroll to "Payment Method" section
2. Select: "Cash on Delivery (COD)"
3. **Verify:**
   - ✅ COD option selected
   - ✅ No payment gateway appears
   - ✅ Order summary shows:
     - Subtotal: ৳1,000
     - Delivery: ৳120
     - **Total: ৳1,120**

---

#### Step 6: Place Order
1. Scroll to bottom
2. Click "Place Order" button
3. **Verify:**
   - ✅ Loading indicator appears
   - ✅ Button shows "Placing Order..."
   - ✅ No console errors

**Console Check:**
```javascript
// Should see order data being sent
// Should see: "📦 Order Data being sent"
```

---

#### Step 7: Order Confirmation
1. Wait for redirect (should take 2-3 seconds)
2. **Verify:**
   - ✅ Redirected to /orders page
   - ✅ Success notification appears
   - ✅ Order appears in list with:
     - Status: "Pending"
     - Total: "৳1,120"
     - Delivery: "৳120"
     - **⏳ Advance Payment: ৳120 (Yellow highlight)**

**Console Check:**
```javascript
// Should see no errors
// Should see order created successfully
```

---

#### Step 8: View Order Details
1. Click on order card to open detail modal
2. **Verify:**
   - ✅ Modal opens
   - ✅ Shows:
     - Order ID: "ORD-XXXXXX"
     - Status: "Pending"
     - Product: "T-Shirt × 2 = ৳1,000"
     - Delivery: "৳120"
     - Total: "৳1,120"
     - **💳 Advance Payment (Delivery Fee)**
       - Method: "bKash"
       - Amount: "৳120"
       - Status: "⏳ Pending"

**Database Check:**
```javascript
// Open MongoDB Compass or terminal
// Check orders collection
// Find order by orderCode
// Verify advancePayment field:
{
  "advancePayment": {
    "method": "bKash",
    "amount": 120,
    "status": "Pending"
  }
}
```

---

### PHASE 2: ADMIN CONFIRMATION (10-15 minutes)

#### Step 1: Create Admin Account (if needed)
**If admin account doesn't exist:**
1. Go to http://localhost:5173/register
2. Fill in:
   ```
   Email: admin@example.com
   Password: AdminPassword123!
   ```
3. Register account
4. **Backend Setup:**
   - Go to MongoDB
   - Find user with email: admin@example.com
   - Update: `role: "admin"`

**If admin account exists:**
1. Go to http://localhost:5173/login
2. Fill in:
   ```
   Email: admin@example.com
   Password: AdminPassword123!
   ```
3. Click "Login"

---

#### Step 2: Navigate to Admin Orders
1. After login, navigate to http://localhost:5173/admin/orders
2. **Verify:**
   - ✅ Admin orders page loads
   - ✅ Order list displays
   - ✅ Test order visible with:
     - Order ID: "ORD-XXXXXX"
     - Status: "Pending"
     - Customer: "Test Customer"
     - Total: "৳1,120"

**Console Check:**
```javascript
// Should see no errors
// Should see orders loaded
```

---

#### Step 3: Expand Order Details
1. Click on order to expand
2. **Verify:**
   - ✅ Order expands showing:
     - Order Items: T-Shirt × 2 = ৳1,000
     - Subtotal: ৳1,000
     - Delivery: ৳120
     - Total: ৳1,120
     - Customer Info: Test Customer, 01521721946
     - Address: 123 Main Street, Gulshan, Dhaka
     - **Quick Actions:**
       - **💳 Confirm Advance Payment (৳120)** ← Yellow button

---

#### Step 4: Click Confirm Payment Button
1. Click "Confirm Advance Payment (৳120)" button
2. **Verify:**
   - ✅ Modal opens with:
     - Title: "💳 Confirm Advance Payment"
     - Order ID: "ORD-XXXXXX"
     - Payment Method: "bKash"
     - Amount: "৳120"
     - Transaction ID input field (empty)
     - Info message
     - [Cancel] [Confirm Payment] buttons

**Console Check:**
```javascript
// Should see no errors
// Modal should open without issues
```

---

#### Step 5: Enter Transaction ID
1. Click on Transaction ID input field
2. Type: `TXN20250115001`
3. **Verify:**
   - ✅ Input accepts text
   - ✅ "Confirm Payment" button becomes enabled
   - ✅ Button text: "Confirm Payment"

---

#### Step 6: Confirm Payment
1. Click "Confirm Payment" button
2. **Verify:**
   - ✅ Button shows "Confirming..." state
   - ✅ Loading indicator appears
   - ✅ Success toast: "Advance payment confirmed successfully!"
   - ✅ Modal closes automatically
   - ✅ Order list updates

**Console Check:**
```javascript
// Should see no errors
// Should see API call in Network tab
// Network tab should show:
// - Request: PATCH /api/orders/:id/confirm-advance-payment
// - Status: 200 OK
// - Response: success: true
```

**Network Tab Check:**
1. Open DevTools → Network tab
2. Look for request: `confirm-advance-payment`
3. Verify:
   - ✅ Method: PATCH
   - ✅ Status: 200
   - ✅ Response includes: `"success": true`

---

#### Step 7: Verify Order Status Updated
1. Check order in list
2. **Verify:**
   - ✅ Status changed to "Processing"
   - ✅ "Confirm Advance Payment" button disappeared
   - ✅ Order card shows "Processing" status

**Database Check:**
```javascript
// Check orders collection
// Find order by orderCode
// Verify advancePayment field updated:
{
  "advancePayment": {
    "method": "bKash",
    "amount": 120,
    "status": "Confirmed",
    "transactionId": "TXN20250115001",
    "confirmedAt": "2025-01-15T10:30:00Z",
    "confirmedBy": "admin_user_id"
  },
  "orderStatus": "Processing"
}
```

---

#### Step 8: View Updated Order Details
1. Expand order again
2. **Verify:**
   - ✅ Shows:
     - Status: "Processing"
     - **💳 Advance Payment (Delivery Fee)**
       - Method: "bKash"
       - Amount: "৳120"
       - Status: "✓ Confirmed" (Green)
       - Transaction ID: "TXN20250115001"
       - Confirmed on: Today's date

---

### PHASE 3: CUSTOMER SEES CONFIRMATION (5-10 minutes)

#### Step 1: Customer Refreshes Order Page
1. Logout admin (click logout)
2. Login as customer:
   ```
   Email: testcustomer@example.com
   Password: TestPassword123!
   ```
3. Navigate to http://localhost:5173/orders
4. **Verify:**
   - ✅ Order page loads
   - ✅ Order card shows:
     - Status: "Processing"
     - No yellow payment highlight
     - Total: "৳1,120"

---

#### Step 2: Customer Views Order Details
1. Click on order card
2. **Verify:**
   - ✅ Detail modal shows:
     - Status: "Processing"
     - **💳 Advance Payment (Delivery Fee)**
       - Method: "bKash"
       - Amount: "৳120"
       - Status: "✓ Confirmed" (Green)
       - Transaction ID: "TXN20250115001"
       - ✓ Confirmed on: Today's date

---

### PHASE 4: ORDER PROCESSING (5-10 minutes)

#### Step 1: Admin Updates Order Status
1. Login as admin again
2. Go to /admin/orders
3. Expand order
4. Click status dropdown (currently "Processing")
5. Select "Shipped"
6. **Verify:**
   - ✅ Status updates to "Shipped"
   - ✅ Success toast: "Order status updated to Shipped!"

---

#### Step 2: Update to Delivered
1. Click status dropdown (currently "Shipped")
2. Select "Delivered"
3. **Verify:**
   - ✅ Status updates to "Delivered"
   - ✅ Success toast: "Order status updated to Delivered!"

---

#### Step 3: Customer Sees Final Status
1. Logout admin
2. Login as customer
3. Go to /orders
4. **Verify:**
   - ✅ Order shows "Delivered" status
   - ✅ All order details visible
   - ✅ Confirmed payment info shown

---

## Test Results Summary

### ✅ Expected Outcomes

**Checkout Flow:**
- [x] Customer can add products to cart
- [x] Cart shows correct totals (Subtotal: ৳1,000, Delivery: ৳120, Total: ৳1,120)
- [x] Checkout form accepts shipping information
- [x] Order created successfully
- [x] Advance payment initialized as "Pending"

**Order Display:**
- [x] Customer sees pending payment (yellow highlight)
- [x] Order details show advance payment info
- [x] Admin sees pending payment button
- [x] Admin can open confirmation modal

**Payment Confirmation:**
- [x] Admin can enter transaction ID
- [x] API call succeeds (200 OK)
- [x] Order status changes to "Processing"
- [x] Success notification appears
- [x] Modal closes

**Order Updates:**
- [x] Customer sees confirmed payment (green)
- [x] Transaction ID visible
- [x] Confirmation date shown
- [x] Admin can update order status
- [x] Customer sees status updates

---

## Troubleshooting

### Issue: Order not created
**Solution:**
- Check console for errors
- Verify all required fields filled
- Check backend logs
- Verify database connection

### Issue: Advance payment not showing
**Solution:**
- Refresh page
- Check database for advancePayment field
- Verify order was created with delivery fee

### Issue: Confirm button not appearing
**Solution:**
- Verify order status is "Pending"
- Check advancePayment.status is "Pending"
- Refresh admin orders page

### Issue: API call fails (401)
**Solution:**
- Verify admin is logged in
- Check Firebase token is valid
- Check Authorization header in network tab

### Issue: API call fails (404)
**Solution:**
- Verify backend server is running
- Check route is PATCH (not PUT)
- Verify order ID is correct

---

## Success Criteria

✅ **All tests pass if:**
1. Order created with correct amounts
2. Advance payment initialized as "Pending"
3. Customer sees pending payment (yellow)
4. Admin can confirm payment
5. Order status changes to "Processing"
6. Customer sees confirmed payment (green)
7. Admin can update order status
8. Customer sees status updates
9. No console errors
10. No network errors

---

## Test Completion

**Status**: READY TO EXECUTE

**Estimated Time**: 45-60 minutes

**Next Steps**:
1. Follow all steps above
2. Document any issues
3. Fix issues if found
4. Re-run failed tests
5. Verify all pass

---

**Test Date**: _______________
**Tester Name**: _______________
**Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________
