# Admin Orders Page - Setup Instructions

## Problem
The admin orders page at `http://localhost:5173/admin/orders` is not showing any orders because the admin user doesn't have the "admin" role in the database.

## Root Cause
When an admin user logs in for the first time, they are automatically created in the database with the default role of "customer". To access admin features, their role must be manually changed to "admin" in MongoDB.

## Solution

### Step 1: Identify Your Admin User Email
The email you used to register/login as admin. For example: `admin@example.com`

### Step 2: Update User Role in MongoDB

#### Option A: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to: `borka_bazar` → `users` collection
4. Find the user with your admin email
5. Edit the document and change `role` from `"customer"` to `"admin"`
6. Save the changes

#### Option B: Using MongoDB Shell
```javascript
// Connect to MongoDB
mongosh

// Select database
use borka_bazar

// Update the user role
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)

// Verify the change
db.users.findOne({ email: "admin@example.com" })
```

#### Option C: Using MongoDB Atlas (Cloud)
1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Navigate to `borka_bazar` → `users`
4. Find your admin user
5. Click the edit icon (pencil)
6. Change `role` to `"admin"`
7. Click "Update"

### Step 3: Verify the Change
After updating the role, you should see in the backend logs:
```
✅ Admin access granted for admin@example.com
📋 getAllOrders called
✅ Found X orders, returning Y on page 1
```

### Step 4: Refresh the Admin Orders Page
1. Go to `http://localhost:5173/admin/orders`
2. The page should now load and display all orders

## Troubleshooting

### Still Not Showing Orders?
Check the browser console (F12) and backend logs for error messages:

**Error: "Admin access required"**
- Your role is still "customer"
- Follow Step 2 again to update the role to "admin"

**Error: "Authorization failed"**
- There's an issue with the database connection
- Check if MongoDB is running
- Verify the connection string in Server/.env

**No Orders Showing (But No Error)**
- There might be no orders in the database yet
- Create a test order by going through the checkout process
- The order should appear in the admin orders page

### Check Backend Logs
The backend now logs detailed information:
```
🔐 Verifying admin access for Firebase UID: xxx
👤 User found: admin@example.com, Role: admin
✅ Admin access granted for admin@example.com
📋 getAllOrders called
🔍 Fetching orders with filter: {}
✅ Found 5 orders, returning 5 on page 1
```

## Quick Reference

### User Roles
- `"customer"` - Regular user, can only see their own orders
- `"admin"` - Admin user, can see all orders and manage them

### Database Structure
```javascript
{
  _id: ObjectId("..."),
  firebaseUid: "firebase-uid-xxx",
  email: "admin@example.com",
  firstName: "Admin",
  lastName: "User",
  role: "admin",  // ← This must be "admin"
  createdAt: ISODate("2025-01-15T10:00:00Z"),
  updatedAt: ISODate("2025-01-15T10:00:00Z")
}
```

## Next Steps

Once admin access is working:
1. ✅ View all orders at `/admin/orders`
2. ✅ Confirm advance payments
3. ✅ Update order status
4. ✅ View order details and print invoices

## Support

If you're still having issues:
1. Check the backend console for error messages
2. Verify MongoDB is running and connected
3. Ensure your user role is set to "admin" in the database
4. Try logging out and logging back in
5. Clear browser cache (Ctrl+Shift+Delete)

