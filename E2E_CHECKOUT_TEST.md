# End-to-End Checkout & Order Flow Test

## Test Objective
Verify the complete flow from product selection → checkout → order creation → admin confirmation → order processing.

## Test Data

### Test Customer
```
Email: testcustomer@example.com
Password: TestPassword123!
Name: Test Customer
Phone: 01521721946
Address: 123 Main Street, Gulshan
City: Dhaka
Area: Gulshan
Zip Code: 1212
```

### Test Product
```
Product: T-Shirt
Price: ৳500
Size: M
Color: Blue
Quantity: 2
Subtotal: ৳1,000
```

### Test Order
```
Subtotal: ৳1,000
Delivery Fee: ৳120
Total: ৳1,120
Payment Method: COD (Cash on Delivery)
```

---

## Test Steps

### PHASE 1: CUSTOMER CHECKOUT

#### Step 1.1: Login as Customer
**Action**: Navigate to login page and sign in
```
Email: testcustomer@example.com
Password: TestPassword123!
```

**Expected Result**:
- ✅ Login successful
- ✅ Redirected to home page
- ✅ User profile shows customer name

**Verification**:
- Check browser console for no errors
- Verify user is authenticated

---

#### Step 1.2: Browse Products
**Action**: Navigate to product catalog
```
Path: /
```

**Expected Result**:
- ✅ Products displayed
- ✅ Product cards show price, image, title
- ✅ Add to cart button visible

**Verification**:
- Products load without errors
- Images display correctly

---

#### Step 1.3: Add Product to Cart
**Action**: Click "Add to Cart" on T-Shirt product
```
Product: T-Shirt
Size: M
Color: Blue
Quantity: 2
```

**Expected Result**:
- ✅ Product added to cart
- ✅ Cart count increases
- ✅ Success notification appears
- ✅ Toast shows: "T-Shirt added to cart!"

**Verification**:
- Check cart icon shows count
- Verify product in cart

---

#### Step 1.4: View Cart
**Action**: Click cart icon or navigate to /cart

**Expected Result**:
- ✅ Cart page loads
- ✅ Product displayed with:
  - Product image
  - Product name: "T-Shirt"
  - Size: "M"
  - Color: "Blue"
  - Quantity: 2
  - Unit price: ৳500
  - Subtotal: ৳1,000
- ✅ Cart total shows: ৳1,000
- ✅ "Proceed to Checkout" button visible

**Verification**:
- All product details correct
- Calculations accurate

---

#### Step 1.5: Proceed to Checkout
**Action**: Click "Proceed to Checkout" button

**Expected Result**:
- ✅ Redirected to checkout page
- ✅ Checkout form displays with sections:
  1. Shipping Information
  2. Order Summary
  3. Payment Method
  4. Order Review

**Verification**:
- All sections visible
- Form fields ready for input

---

#### Step 1.6: Enter Shipping Information
**Action**: Fill in shipping form
```
Full Name: Test Customer
Phone: 01521721946
Email: testcustomer@example.com
Street Address: 123 Main Street
Area: Gulshan
City: Dhaka
Postal Code: 1212
```

**Expected Result**:
- ✅ All fields accept input
- ✅ Form validates input
- ✅ No error messages

**Verification**:
- Fields populate correctly
- No validation errors

---

#### Step 1.7: Review Order Summary
**Action**: Check order summary section

**Expected Result**:
- ✅ Order summary shows:
  - Product: T-Shirt × 2
  - Subtotal: ৳1,000
  - Delivery Fee: ৳120
  - **Total: ৳1,120**

**Verification**:
- All amounts correct
- Delivery fee calculated

---

#### Step 1.8: Select Payment Method
**Action**: Select "Cash on Delivery (COD)"

**Expected Result**:
- ✅ COD option selected
- ✅ Payment method shows: "COD"
- ✅ No payment gateway appears

**Verification**:
- COD selected correctly
- No payment form shown

---

#### Step 1.9: Place Order
**Action**: Click "Place Order" button

**Expected Result**:
- ✅ Order processing starts
- ✅ Loading indicator appears
- ✅ Order created successfully
- ✅ Redirected to order confirmation page
- ✅ Order ID displayed (e.g., "ORD-123456")

**Verification**:
- Check browser console for no errors
- Verify order ID format

---

#### Step 1.10: View Order Confirmation
**Action**: Check order confirmation page

**Expected Result**:
- ✅ Confirmation page displays:
  - Order ID: "ORD-XXXXXX"
  - Order Status: "Pending"
  - Customer Name: "Test Customer"
  - Delivery Address: "123 Main Street, Gulshan, Dhaka"
  - Product: "T-Shirt × 2"
  - Subtotal: "৳1,000"
  - Delivery Fee: "৳120"
  - **Total: ৳1,120**
  - **Advance Payment (Delivery Fee): ৳120 - Pending**

**Verification**:
- All order details correct
- Advance payment shows as pending
- Status shows "Pending"

---

### PHASE 2: CUSTOMER VIEWS ORDER

#### Step 2.1: Navigate to My Orders
**Action**: Go to /orders page

**Expected Result**:
- ✅ Orders page loads
- ✅ Order appears in grid view
- ✅ Order card shows:
  - Order ID: "ORD-XXXXXX"
  - Status: "Pending"
  - Product: "T-Shirt"
  - Total: "৳1,120"
  - Delivery: "৳120"
  - **⏳ Advance Payment: ৳120 (Yellow highlight)**

**Verification**:
- Order visible in list
- Yellow highlight for pending payment
- All details correct

---

#### Step 2.2: View Order Details
**Action**: Click on order card to open detail modal

**Expected Result**:
- ✅ Detail modal opens
- ✅ Shows:
  - Order ID: "ORD-XXXXXX"
  - Status: "Pending"
  - Order Date: Today's date
  - Product: "T-Shirt × 2 = ৳1,000"
  - Delivery Fee: "৳120"
  - Total: "৳1,120"
  - **💳 Advance Payment (Delivery Fee)**
    - Method: "bKash"
    - Amount: "৳120"
    - Status: "⏳ Pending"
    - Message: "⏳ Awaiting confirmation from admin"

**Verification**:
- Modal displays correctly
- Advance payment shows as pending
- All information accurate

---

### PHASE 3: ADMIN CONFIRMATION

#### Step 3.1: Admin Login
**Action**: Logout customer and login as admin
```
Email: admin@example.com
Password: AdminPassword123!
```

**Expected Result**:
- ✅ Admin login successful
- ✅ Redirected to admin dashboard
- ✅ Admin menu visible

**Verification**:
- Admin authenticated
- Admin dashboard accessible

---

#### Step 3.2: Navigate to Admin Orders
**Action**: Go to /admin/orders

**Expected Result**:
- ✅ Admin orders page loads
- ✅ Order list displays
- ✅ Test order visible with:
  - Order ID: "ORD-XXXXXX"
  - Status: "Pending"
  - Customer: "Test Customer"
  - Total: "৳1,120"
  - Items: "2 items"

**Verification**:
- Order appears in list
- All details visible

---

#### Step 3.3: Expand Order Details
**Action**: Click on order to expand details

**Expected Result**:
- ✅ Order expands showing:
  - Order Items (2):
    - T-Shirt × 2 = ৳1,000
  - Order Summary:
    - Subtotal: ৳1,000
    - Delivery: ৳120
    - Total: ৳1,120
  - Customer Information:
    - Name: "Test Customer"
    - Phone: "01521721946"
    - Email: "testcustomer@example.com"
  - Delivery Address:
    - 123 Main Street
    - Gulshan, Dhaka 1212
  - **Quick Actions:**
    - **💳 Confirm Advance Payment (৳120)** ← Yellow button

**Verification**:
- All details displayed
- Confirm button visible and yellow

---

#### Step 3.4: Click Confirm Advance Payment
**Action**: Click "Confirm Advance Payment (৳120)" button

**Expected Result**:
- ✅ Payment confirmation modal opens
- ✅ Modal shows:
  - Title: "💳 Confirm Advance Payment"
  - Order ID: "ORD-XXXXXX"
  - Payment Method: "bKash"
  - Amount: "৳120"
  - Transaction ID input field (empty)
  - Info: "After confirmation: Order status will change to 'Processing'"
  - Buttons: [Cancel] [Confirm Payment]

**Verification**:
- Modal displays correctly
- All information accurate
- Input field ready

---

#### Step 3.5: Enter Transaction ID
**Action**: Enter transaction ID in modal
```
Transaction ID: TXN20250115001
```

**Expected Result**:
- ✅ Transaction ID input accepts text
- ✅ "Confirm Payment" button becomes enabled
- ✅ Button text: "Confirm Payment"

**Verification**:
- Input field accepts text
- Button state changes

---

#### Step 3.6: Confirm Payment
**Action**: Click "Confirm Payment" button

**Expected Result**:
- ✅ Button shows "Confirming..." state
- ✅ Loading indicator appears
- ✅ API call succeeds (200 OK)
- ✅ Success toast appears: "Advance payment confirmed successfully!"
- ✅ Modal closes automatically
- ✅ Order list updates

**Verification**:
- Check browser console for no errors
- Verify API call in network tab
- Confirm success notification

---

#### Step 3.7: Verify Order Status Updated
**Action**: Check order in list after confirmation

**Expected Result**:
- ✅ Order status changed to "Processing"
- ✅ "Confirm Advance Payment" button disappeared
- ✅ Order card shows:
  - Status: "Processing" (blue badge)
  - No yellow payment highlight

**Verification**:
- Status updated correctly
- Button no longer visible

---

#### Step 3.8: View Updated Order Details
**Action**: Expand order again to see details

**Expected Result**:
- ✅ Order details show:
  - Status: "Processing"
  - **💳 Advance Payment (Delivery Fee)**
    - Method: "bKash"
    - Amount: "৳120"
    - Status: "✓ Confirmed" (Green)
    - Transaction ID: "TXN20250115001"
    - Confirmed on: Today's date

**Verification**:
- Status shows "Confirmed"
- Transaction ID visible
- Confirmation date shown

---

### PHASE 4: CUSTOMER SEES CONFIRMATION

#### Step 4.1: Customer Refreshes Order Page
**Action**: Logout admin, login as customer, go to /orders

**Expected Result**:
- ✅ Customer logged in
- ✅ Order page loads
- ✅ Order card shows:
  - Status: "Processing"
  - No yellow payment highlight
  - Total: "৳1,120"

**Verification**:
- Order status updated
- No pending payment indicator

---

#### Step 4.2: Customer Views Order Details
**Action**: Click on order to view details

**Expected Result**:
- ✅ Detail modal shows:
  - Status: "Processing"
  - **💳 Advance Payment (Delivery Fee)**
    - Method: "bKash"
    - Amount: "৳120"
    - Status: "✓ Confirmed" (Green)
    - Transaction ID: "TXN20250115001"
    - ✓ Confirmed on: Today's date
  - Message: "Your payment has been confirmed"

**Verification**:
- Confirmed payment visible
- Transaction ID shown
- Confirmation date displayed

---

### PHASE 5: ORDER PROCESSING

#### Step 5.1: Admin Updates Order Status
**Action**: Admin goes to /admin/orders and updates status

**Expected Result**:
- ✅ Admin can change status from "Processing" to "Shipped"
- ✅ Status dropdown shows options:
  - Pending
  - Processing (current)
  - Shipped
  - Delivered
  - Cancelled

**Verification**:
- Status dropdown works
- Options available

---

#### Step 5.2: Change to Shipped
**Action**: Select "Shipped" from dropdown

**Expected Result**:
- ✅ Status updates to "Shipped"
- ✅ Success toast: "Order status updated to Shipped!"
- ✅ Order card shows "Shipped" status

**Verification**:
- Status changed
- Notification shown

---

#### Step 5.3: Change to Delivered
**Action**: Select "Delivered" from dropdown

**Expected Result**:
- ✅ Status updates to "Delivered"
- ✅ Success toast: "Order status updated to Delivered!"
- ✅ Order card shows "Delivered" status

**Verification**:
- Status changed
- Notification shown

---

#### Step 5.4: Customer Sees Final Status
**Action**: Customer refreshes order page

**Expected Result**:
- ✅ Order shows "Delivered" status
- ✅ Order card shows:
  - Status: "Delivered" (Green badge)
  - All order details
  - Confirmed payment info

**Verification**:
- Final status visible
- All information correct

---

## Expected Results Summary

### ✅ Checkout Flow
- [x] Customer can add products to cart
- [x] Cart shows correct totals
- [x] Checkout form accepts shipping info
- [x] Order created with correct amounts
- [x] Delivery fee calculated (৳120)
- [x] Advance payment initialized (Pending)

### ✅ Order Display
- [x] Customer sees pending payment (yellow)
- [x] Order details show advance payment info
- [x] Admin sees pending payment button
- [x] Admin can open confirmation modal

### ✅ Payment Confirmation
- [x] Admin can enter transaction ID
- [x] API call succeeds (200 OK)
- [x] Order status changes to "Processing"
- [x] Success notification appears
- [x] Modal closes

### ✅ Order Updates
- [x] Customer sees confirmed payment (green)
- [x] Transaction ID visible
- [x] Confirmation date shown
- [x] Admin can update order status
- [x] Customer sees status updates

---

## Test Execution

### Prerequisites
- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Database connected
- [ ] Test user accounts created
- [ ] Test products available

### Execution Steps
1. [ ] Run through all phases
2. [ ] Document any failures
3. [ ] Fix issues found
4. [ ] Re-run failed tests
5. [ ] Verify all pass

### Success Criteria
- [x] All steps complete without errors
- [x] All expected results achieved
- [x] No console errors
- [x] No network errors
- [x] Complete flow works end-to-end

---

## Notes

- Test data can be modified as needed
- Use real transaction ID format for testing
- Check browser console for errors
- Monitor network tab for API calls
- Verify database updates after each step

---

**Test Status**: READY TO EXECUTE
