# Testing Guide: Advance Payment Confirmation System

## Quick Start Testing

### Prerequisites
- Admin account with access to `/admin/orders`
- Test order with pending advance payment
- Browser developer tools (optional, for debugging)

## Test Scenarios

### Scenario 1: View Pending Advance Payment

**Steps:**
1. Navigate to Admin Orders page (`/admin/orders`)
2. Look for orders with "Pending" status
3. Expand an order by clicking on it
4. Look for "Confirm Advance Payment" button in Quick Actions section

**Expected Result:**
- Button appears with yellow highlight
- Button text shows: "Confirm Advance Payment (৳120)" or similar amount
- Button is clickable

**Verification:**
- ✅ Button visible for pending payments
- ✅ Button shows correct amount
- ✅ Button styling is yellow/orange

---

### Scenario 2: Open Payment Confirmation Modal

**Steps:**
1. From Scenario 1, click "Confirm Advance Payment" button
2. Modal should open

**Expected Result:**
- Modal appears with title "💳 Confirm Advance Payment"
- Shows order ID (e.g., "Order #ABC12345")
- Displays payment method (e.g., "bKash")
- Shows amount (e.g., "৳120")
- Transaction ID input field is visible and empty
- Cancel and Confirm buttons are visible

**Verification:**
- ✅ Modal opens correctly
- ✅ All information displayed accurately
- ✅ Input field is focused and ready for input

---

### Scenario 3: Validate Transaction ID Input

**Steps:**
1. From Scenario 2, try to click "Confirm Payment" without entering transaction ID
2. Enter a transaction ID (e.g., "TXN123456789")
3. Observe button state

**Expected Result:**
- Confirm button is disabled when field is empty
- Confirm button becomes enabled when transaction ID is entered
- Button text shows "Confirm Payment" (not loading state)

**Verification:**
- ✅ Button disabled state works correctly
- ✅ Button enabled when input has value
- ✅ Input accepts text properly

---

### Scenario 4: Confirm Payment Successfully

**Steps:**
1. From Scenario 3, enter a transaction ID (e.g., "TXN123456789")
2. Click "Confirm Payment" button
3. Wait for response

**Expected Result:**
- Button shows "Confirming..." state
- Success toast notification appears: "Advance payment confirmed successfully!"
- Modal closes automatically
- Order list updates
- Order status changes to "Processing"
- "Confirm Advance Payment" button disappears

**Verification:**
- ✅ Loading state shows during confirmation
- ✅ Success notification appears
- ✅ Modal closes
- ✅ Order status updated to "Processing"
- ✅ Button no longer visible

---

### Scenario 5: Duplicate Transaction ID Error

**Steps:**
1. Create two orders with pending advance payments
2. Confirm payment on first order with transaction ID "TXN123"
3. Try to confirm payment on second order with same transaction ID "TXN123"

**Expected Result:**
- Error toast notification appears: "Transaction ID already used"
- Modal remains open
- Transaction ID field still has the value
- Order status remains "Pending"

**Verification:**
- ✅ Duplicate validation works
- ✅ Error message is clear
- ✅ Order not updated on error

---

### Scenario 6: Customer View - Pending Payment

**Steps:**
1. As customer, navigate to Orders page (`/orders`)
2. Find the order with pending advance payment
3. Click on order card to view details

**Expected Result:**
- Grid card shows yellow highlight: "⏳ Advance Payment: ৳120"
- Detail modal shows advance payment card with:
  - Method: bKash
  - Amount: ৳120
  - Status: Pending
  - Message: "⏳ Awaiting confirmation from admin"

**Verification:**
- ✅ Pending payment visible in grid
- ✅ Detail modal shows payment info
- ✅ Status shows "Pending"

---

### Scenario 7: Customer View - Confirmed Payment

**Steps:**
1. After admin confirms payment (Scenario 4)
2. As customer, refresh Orders page
3. Find the same order
4. Click on order card to view details

**Expected Result:**
- Grid card no longer shows yellow highlight
- Order status changed to "Processing"
- Detail modal shows advance payment card with:
  - Method: bKash
  - Amount: ৳120
  - Status: ✓ Confirmed (green)
  - Transaction ID: TXN123456789
  - Confirmation date: Jan 15, 2025 (or current date)

**Verification:**
- ✅ Payment shows as confirmed
- ✅ Transaction ID visible
- ✅ Confirmation date displayed
- ✅ Status badge is green

---

### Scenario 8: Order Status Progression

**Steps:**
1. After admin confirms payment (Scenario 4)
2. In Admin Orders page, find the order
3. Change order status from "Processing" to "Shipped"
4. Change order status from "Shipped" to "Delivered"

**Expected Result:**
- Order status updates successfully at each step
- Status dropdown shows new status
- Toast notification confirms each update
- Customer can see status updates in their order page

**Verification:**
- ✅ Status progression works
- ✅ All statuses update correctly
- ✅ Customer sees updates

---

## API Testing (Using Postman or cURL)

### Test Endpoint: Confirm Advance Payment

**Endpoint:** `PUT /api/orders/:id/confirm-advance-payment`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "transactionId": "TXN123456789",
  "adminId": "admin_user_id"
}
```

**Success Response (200):**
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

**Error Response (400):**
```json
{
  "success": false,
  "message": "Transaction ID already used"
}
```

---

## Browser Console Debugging

### Check Order Data
```javascript
// In browser console on Orders page
// Find order with pending payment
const order = orders.find(o => o.advancePayment?.status === 'Pending');
console.log('Order:', order);
console.log('Advance Payment:', order.advancePayment);
```

### Check API Call
```javascript
// Monitor network tab in DevTools
// Look for PUT request to /api/orders/:id/confirm-advance-payment
// Check request/response in Network tab
```

---

## Common Issues & Solutions

### Issue 1: Button Not Appearing
**Cause:** Order doesn't have pending advance payment
**Solution:** 
- Verify order has `advancePayment.status === 'Pending'`
- Check order was created with delivery fee

### Issue 2: Modal Not Opening
**Cause:** JavaScript error or state not updating
**Solution:**
- Check browser console for errors
- Verify `showPaymentModal` state is toggling
- Check React DevTools for component state

### Issue 3: Confirmation Fails
**Cause:** Backend error or network issue
**Solution:**
- Check browser console for error message
- Verify transaction ID is not empty
- Check backend logs for errors
- Verify admin token is valid

### Issue 4: Order Status Not Updating
**Cause:** Frontend state not synced with backend
**Solution:**
- Refresh the page
- Check backend database for order status
- Verify API response contains updated status

---

## Performance Testing

### Load Testing
- Test with 100+ orders in list
- Verify modal opens quickly
- Check for memory leaks

### Network Testing
- Test with slow network (throttle in DevTools)
- Verify loading states show correctly
- Check timeout handling

---

## Accessibility Testing

### Keyboard Navigation
- Tab through modal elements
- Enter key to confirm payment
- Escape key to close modal

### Screen Reader Testing
- Verify button labels are descriptive
- Check modal title is announced
- Verify error messages are announced

---

## Regression Testing

After confirming payment, verify:
- ✅ Other orders still display correctly
- ✅ Filter tabs still work
- ✅ Order expansion/collapse still works
- ✅ Print functionality still works
- ✅ Status dropdown still works
- ✅ Other admin functions unaffected

---

## Sign-Off Checklist

- [ ] All scenarios tested successfully
- [ ] No console errors
- [ ] No network errors
- [ ] Order status updates correctly
- [ ] Customer sees confirmed payment
- [ ] Admin can confirm multiple orders
- [ ] Duplicate transaction ID validation works
- [ ] Modal opens/closes correctly
- [ ] Toast notifications appear
- [ ] Build passes without errors

---

## Notes

- Transaction IDs should be unique per order
- Order status automatically changes to "Processing" after confirmation
- Confirmation timestamp is recorded for audit trail
- Admin ID is recorded for tracking who confirmed the payment
- System maintains backward compatibility with legacy payment structures
