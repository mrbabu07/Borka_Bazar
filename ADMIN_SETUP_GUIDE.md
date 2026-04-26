# Admin Setup Guide - Borka Bazar

**Date**: April 26, 2026  
**Purpose**: Guide for setting up admin account and confirming payments

---

## 🔐 Admin Account Setup

### Step 1: Create Admin Account

1. Go to `http://localhost:5173/register`
2. Fill in:
   - **Email**: `admin@example.com` (or your admin email)
   - **Password**: `AdminPassword123!` (or your secure password)
   - **Confirm Password**: Same as above
3. Click "Register"
4. **Expected**: Account created, redirected to home page

### Step 2: Set Admin Role in Database

The system now automatically creates users in the database, but you need to set the admin role manually.

#### Option A: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Navigate to: `borka_bazar` → `users`
4. Find the user with your admin email
5. Edit the document and change:
   ```json
   "role": "customer"
   ```
   to:
   ```json
   "role": "admin"
   ```
6. Save the changes

#### Option B: Using MongoDB Shell (CLI)

```bash
# Connect to MongoDB
mongo

# Select database
use borka_bazar

# Find your admin user
db.users.findOne({ email: "admin@example.com" })

# Update the role to admin
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)

# Verify the change
db.users.findOne({ email: "admin@example.com" })
```

#### Option C: Using MongoDB Atlas (Cloud)

1. Go to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Select your cluster
3. Click "Collections"
4. Navigate to `borka_bazar` → `users`
5. Find your admin user
6. Click the edit icon
7. Change `role` from `"customer"` to `"admin"`
8. Save

### Step 3: Verify Admin Role

1. Go to `http://localhost:5173/login`
2. Login with your admin credentials
3. Navigate to `http://localhost:5173/admin/orders`
4. **Expected**: Admin orders page loads without errors
5. **Expected**: You can see the orders list

---

## 📋 Admin Orders Page - What You Should See

### Order List Display

Each order card should show:
- ✅ Order ID (e.g., "ORD-ABC123")
- ✅ Order date and time
- ✅ Customer name
- ✅ Customer location (city)
- ✅ Number of items
- ✅ Total price
- ✅ Order status badge (Pending, Processing, Shipped, Delivered)

### Order Details (When Expanded)

When you click on an order, it should expand to show:
- ✅ Order items with quantities and prices
- ✅ Subtotal
- ✅ Delivery charge
- ✅ Total amount
- ✅ Customer information (name, phone, email)
- ✅ Shipping address
- ✅ **Quick Actions** section with buttons:
  - 💳 **Confirm Advance Payment** (yellow button - only if payment pending)
  - 🖨️ **Print Order Details**
  - 📞 **Call Customer** (if phone available)
  - 📧 **Email Customer** (if email available)

### Advance Payment Information

For each order, you should see:
- **Payment Method**: bKash, Nagad, Rocket, Upay, or Bank Transfer
- **Amount**: The delivery fee (e.g., ৳120)
- **Status**: 
  - 🟡 **Pending** (yellow) - Needs confirmation
  - 🟢 **Confirmed** (green) - Already confirmed
- **Transaction ID**: The payment transaction ID (if confirmed)
- **Confirmation Date**: When the payment was confirmed (if confirmed)

---

## 💳 How to Confirm Advance Payment

### Step 1: Find Pending Orders

1. Go to `/admin/orders`
2. Look for orders with **yellow "Confirm Advance Payment" button**
3. These are orders waiting for payment confirmation

### Step 2: Click Confirm Button

1. Click the **"Confirm Advance Payment (৳120)"** button
2. **Expected**: Modal dialog opens with:
   - Order ID
   - Payment method (e.g., "bKash")
   - Amount (e.g., "৳120")
   - Transaction ID input field

### Step 3: Enter Transaction ID

1. In the modal, enter the transaction ID
   - Example: `TXN20250115001`
   - This should be the payment transaction ID from the payment provider
2. **Expected**: "Confirm Payment" button becomes enabled

### Step 4: Confirm Payment

1. Click **"Confirm Payment"** button
2. **Expected**:
   - Button shows "Confirming..." state
   - Success notification: "Advance payment confirmed successfully!"
   - Modal closes automatically
   - Order status changes to "Processing"
   - "Confirm Advance Payment" button disappears

### Step 5: Verify Confirmation

1. Expand the order again
2. **Expected**: 
   - Status shows "Processing"
   - Payment shows as "✓ Confirmed" (green)
   - Transaction ID is visible
   - Confirmation date is shown

---

## 🔧 Troubleshooting

### Issue 1: Can't See Admin Orders Page

**Problem**: Getting 403 error or "Admin access required"

**Solution**:
1. Verify your user role is set to "admin" in database
2. Check MongoDB for your user record:
   ```bash
   db.users.findOne({ email: "your-email@example.com" })
   ```
3. Ensure `role` field is set to `"admin"`
4. Logout and login again

### Issue 2: Orders Not Showing

**Problem**: Admin orders page loads but no orders visible

**Solution**:
1. Verify orders exist in database:
   ```bash
   db.orders.find().count()
   ```
2. Check if orders have proper structure
3. Verify backend is running: `npm start` in Server directory
4. Check browser console for errors (F12)

### Issue 3: Can't Click Confirm Payment Button

**Problem**: Button is disabled or not appearing

**Solution**:
1. Verify order status is "Pending"
2. Verify advance payment status is "Pending"
3. Check database:
   ```bash
   db.orders.findOne({ _id: ObjectId("order-id") })
   ```
4. Look for `advancePayment.status: "Pending"`

### Issue 4: Confirm Payment Shows Error

**Problem**: "Failed to confirm advance payment" error

**Solution**:
1. Check backend logs for detailed error
2. Verify transaction ID is entered
3. Verify transaction ID is unique (not used before)
4. Check Firebase token is valid
5. Verify admin role in database

### Issue 5: Order Details Not Showing Properly

**Problem**: Missing customer info, shipping address, or order items

**Solution**:
1. Check order structure in database
2. Verify `shippingInfo` field exists
3. Verify `orderItems` array is populated
4. Check for null/undefined values
5. Refresh the page

---

## 📊 Admin Dashboard Features

### Real-time Statistics

The admin dashboard shows:
- **Today's Orders**: Number of orders placed today
- **Today's Revenue**: Total revenue from today's orders
- **Online Visitors**: Estimated number of active visitors
- **Conversion Rate**: Orders / Visitors percentage
- **Avg Order Value**: Average value per order
- **Total Customers**: Total number of unique customers

### Order Filtering

Filter orders by status:
- **All**: Show all orders
- **Pending**: Orders waiting for payment confirmation
- **Processing**: Orders with confirmed payment
- **Shipped**: Orders that have been shipped
- **Delivered**: Orders that have been delivered
- **Cancelled**: Cancelled orders

### Quick Actions

For each order, you can:
- 💳 **Confirm Advance Payment** - Confirm delivery fee payment
- 🖨️ **Print Order Details** - Print professional invoice
- 📞 **Call Customer** - Call customer directly
- 📧 **Email Customer** - Send email to customer
- 📊 **Update Status** - Change order status

---

## 🔐 Security Best Practices

1. **Keep Your Password Secure**
   - Use a strong password (mix of letters, numbers, symbols)
   - Don't share your admin credentials
   - Change password regularly

2. **Verify Transaction IDs**
   - Always verify transaction ID with payment provider
   - Check for duplicate transaction IDs
   - Keep audit trail of all confirmations

3. **Monitor Orders**
   - Regularly check for pending orders
   - Confirm payments promptly
   - Update order status as items are shipped

4. **Backup Data**
   - Regularly backup MongoDB database
   - Keep transaction records
   - Archive old orders

---

## 📞 Support

### Common Questions

**Q: How do I know if a payment is legitimate?**
A: Check the transaction ID with your payment provider (bKash, Nagad, etc.) to verify the payment was received.

**Q: Can I undo a payment confirmation?**
A: Currently, no. Ensure you verify the transaction ID before confirming.

**Q: What if a customer disputes a payment?**
A: Check the transaction ID and confirmation date in the order details. Contact the payment provider if needed.

**Q: How do I handle failed payments?**
A: Mark the order as cancelled and contact the customer to retry payment.

### Getting Help

1. Check the **TROUBLESHOOTING_GUIDE.md** for common issues
2. Check backend logs: `npm start` output
3. Check browser console: Press F12
4. Check MongoDB for order data
5. Contact development team if issue persists

---

## ✅ Checklist for Admin Setup

- [ ] Admin account created
- [ ] Admin role set in database
- [ ] Can login to admin account
- [ ] Can access `/admin/orders` page
- [ ] Can see orders list
- [ ] Can see order details when expanded
- [ ] Can see "Confirm Advance Payment" button for pending orders
- [ ] Can open payment confirmation modal
- [ ] Can enter transaction ID
- [ ] Can confirm payment successfully
- [ ] Order status changes to "Processing"
- [ ] Payment shows as "Confirmed" (green)

---

## 🎯 Next Steps

1. ✅ Complete admin setup
2. ✅ Verify all features working
3. ⏳ Start confirming customer payments
4. ⏳ Update order status as items ship
5. ⏳ Monitor for any issues

---

**Status**: ✅ READY FOR ADMIN USE

For any issues, refer to the troubleshooting section or check the backend logs.

