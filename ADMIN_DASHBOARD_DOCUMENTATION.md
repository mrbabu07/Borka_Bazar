# Borka Bazar Admin Dashboard Documentation

## Overview
The Admin Dashboard is a comprehensive management system for Borka Bazar e-commerce platform. It provides tools for managing products, orders, customers, inventory, and more.

**Access URL:** `http://localhost:5173/admin`

---

## Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Orders Management](#orders-management)
3. [Products Management](#products-management)
4. [Inventory Management](#inventory-management)
5. [Categories Management](#categories-management)
6. [Coupons Management](#coupons-management)
7. [Flash Sales Management](#flash-sales-management)
8. [Offers Management](#offers-management)
9. [Customer Insights](#customer-insights)
10. [User Management](#user-management)
11. [Delivery Settings](#delivery-settings)
12. [Reviews Management](#reviews-management)
13. [Q&A Management](#qa-management)
14. [Support Tickets](#support-tickets)
15. [Returns Management](#returns-management)

---

## Dashboard Overview

### Access & Authentication
- **URL:** `http://localhost:5173/admin`
- **Requirements:** 
  - Must be logged in with Firebase account
  - User role must be set to `"admin"` in MongoDB database
  - Admin authentication is verified via `verifyAdmin` middleware

### Setup Instructions
If you're a new admin user:
1. Register at `/register` with your email
2. Contact database administrator to set your role to `"admin"`
3. Login and access `/admin`

**See:** `ADMIN_SETUP_INSTRUCTIONS.md` for detailed setup guide

---

## Orders Management

### Access
**URL:** `http://localhost:5173/admin/orders`

### Overview
Manage all customer orders, confirm payments, and track order status.

### Key Features

#### 1. View All Orders
- **Display:** Grid view showing all orders
- **Information shown:**
  - Order ID (last 8 characters)
  - Customer name
  - Order total
  - Order status (Pending, Processing, Shipped, Delivered, Cancelled)
  - Payment status indicator

#### 2. Filter Orders
- **By Status:** All, Pending, Processing, Shipped, Delivered, Cancelled
- **Quick Stats:** Total orders, Pending, Processing, Delivered counts

#### 3. Expand Order Details
Click on any order card to expand and see:
- **Order Items:** Product details, quantity, price
- **Customer Information:** Name, phone, email, address
- **Shipping Address:** Complete delivery address
- **Pricing Breakdown:**
  - Subtotal (products)
  - Delivery fee
  - Total amount
- **Payment Status:**
  - Advance Payment (Delivery Fee) - Status and amount
  - Remaining Payment (Products) - COD amount

#### 4. Confirm Advance Payment Workflow

**When to Use:** After customer pays delivery fee via bKash/Nagad/Rocket

**Steps:**
1. Find order with yellow "⏳ Advance Payment" indicator
2. Click "💳 Confirm Advance Payment (৳120)" button
3. Modal opens with:
   - Order ID
   - Payment method (bKash, Nagad, etc.)
   - Amount to confirm
   - Transaction ID input field
4. Enter the transaction ID from customer's payment
5. Click "Confirm Payment"
6. Order status updates to "Processing"
7. Customer sees green "✅ Confirmed" badge

**Example Transaction ID:** `TXN20250126001`

#### 5. Update Order Status
- **Current Status Dropdown:** Shows current order status
- **Available Statuses:**
  - Pending → Processing (after payment confirmed)
  - Processing → Shipped (when order is dispatched)
  - Shipped → Delivered (when customer receives)
  - Any → Cancelled (if needed)

**Workflow:**
1. Expand order
2. Click status dropdown
3. Select new status
4. Status updates immediately
5. Customer receives notification

#### 6. Print Order Invoice
- **Button:** "🖨️ Print" in order details
- **Output:** Professional invoice with:
  - Company header (Borka Bazar)
  - Order details and dates
  - Customer information
  - Shipping address
  - Product list with prices
  - Payment breakdown
  - Total amount

#### 7. Order Statistics
- **Total Orders:** Count of all orders
- **Pending:** Orders awaiting payment confirmation
- **Processing:** Orders confirmed and being prepared
- **Delivered:** Successfully delivered orders

### Common Workflows

#### Workflow 1: Confirm Customer Payment
```
1. Customer places order with COD
2. Customer pays delivery fee (৳120) via bKash
3. Admin sees order with yellow "Advance Payment" indicator
4. Admin clicks "Confirm Advance Payment"
5. Admin enters transaction ID: TXN20250126001
6. Admin clicks "Confirm Payment"
7. Order status changes to "Processing"
8. Customer sees green "✅ Confirmed" badge
9. Admin updates status to "Shipped" when ready
10. Admin updates status to "Delivered" when complete
```

#### Workflow 2: Track Order Progress
```
1. Admin opens order details
2. Sees current status: "Pending"
3. After payment confirmed: "Processing"
4. When dispatched: "Shipped"
5. When delivered: "Delivered"
6. Each status change notifies customer
```

#### Workflow 3: Handle Order Issues
```
1. Customer reports issue with order
2. Admin finds order in list
3. Expands order details
4. Reviews customer information and items
5. Can update status or contact customer
6. Resolves issue and updates status
```

---

## Products Management

### Access
**URL:** `http://localhost:5173/admin/products`

### Overview
Create, edit, and manage product catalog.

### Key Features

#### 1. View All Products
- **Display:** List/Grid view of all products
- **Information:** Title, price, stock, category, status

#### 2. Add New Product
**Button:** "➕ Add Product"

**Form Fields:**
- **Basic Info:**
  - Product title
  - Description
  - Category (dropdown)
  - Price (৳)
  - Stock quantity

- **Images:**
  - Main image upload
  - Additional images (gallery)

- **Variants:**
  - Sizes (S, M, L, XL, etc.)
  - Colors (with color picker)

- **SEO:**
  - Meta title
  - Meta description
  - Keywords

#### 3. Edit Product
- Click on product to edit
- Update any field
- Save changes
- Changes reflect immediately

#### 4. Delete Product
- Click delete icon
- Confirm deletion
- Product removed from catalog

#### 5. Manage Stock
- View current stock level
- Update stock quantity
- Set low stock alerts
- Track stock movements

### Common Workflows

#### Workflow 1: Add New Product
```
1. Click "➕ Add Product"
2. Fill in product details:
   - Title: "Nida Pullover Burka"
   - Price: ৳2,599
   - Category: "Burkas"
   - Description: Product details
3. Upload main image
4. Add additional images
5. Set sizes: S, M, L, XL
6. Set colors: Burgundy, Black, Navy
7. Set initial stock: 50
8. Click "Save Product"
9. Product appears in catalog
```

#### Workflow 2: Update Product Stock
```
1. Find product in list
2. Click to edit
3. Update stock quantity
4. If stock < 10: Low stock alert shown
5. Save changes
6. Stock updated in real-time
```

---

## Inventory Management

### Access
**URL:** `http://localhost:5173/admin/inventory`

### Overview
Track and manage product inventory across all items.

### Key Features

#### 1. View Inventory Status
- **All Products:** Complete inventory list
- **Stock Levels:** Current quantity for each product
- **Low Stock:** Products with stock < threshold
- **Out of Stock:** Products with 0 quantity

#### 2. Low Stock Alerts
- **Threshold:** Configurable (default: 10 units)
- **Alert Color:** Yellow/Red for low stock
- **Action:** Reorder or update stock

#### 3. Stock Movements
- **Track:** When stock increases/decreases
- **Reason:** Sales, returns, adjustments
- **History:** Complete audit trail

#### 4. Bulk Stock Update
- **Import:** CSV file with stock updates
- **Export:** Current inventory as CSV
- **Update:** Multiple products at once

### Common Workflows

#### Workflow 1: Monitor Low Stock
```
1. Go to Inventory page
2. View "Low Stock" section
3. See products with < 10 units
4. Click product to reorder
5. Update stock quantity
6. Save changes
```

#### Workflow 2: Import Stock Updates
```
1. Prepare CSV file with format:
   productId, newStock
   507f1f77bcf86cd799439011, 50
   507f1f77bcf86cd799439012, 30
2. Click "Import Stock"
3. Select CSV file
4. Review changes
5. Confirm import
6. Stock updated for all products
```

---

## Categories Management

### Access
**URL:** `http://localhost:5173/admin/categories`

### Overview
Manage product categories for organization and filtering.

### Key Features

#### 1. View All Categories
- **List:** All product categories
- **Count:** Number of products in each
- **Status:** Active/Inactive

#### 2. Add Category
**Form Fields:**
- Category name
- Description
- Icon/Image
- Display order

#### 3. Edit Category
- Update category details
- Change display order
- Activate/Deactivate

#### 4. Delete Category
- Remove category
- Reassign products to another category
- Confirm deletion

### Common Workflows

#### Workflow 1: Create New Category
```
1. Click "➕ Add Category"
2. Enter name: "Abayas"
3. Enter description: "Traditional abayas"
4. Upload category image
5. Set display order: 3
6. Click "Save"
7. Category appears in product filters
```

---

## Coupons Management

### Access
**URL:** `http://localhost:5173/admin/coupons`

### Overview
Create and manage discount coupons for customers.

### Key Features

#### 1. View All Coupons
- **List:** All active and inactive coupons
- **Details:** Code, discount, expiry date, usage count

#### 2. Create Coupon
**Form Fields:**
- **Coupon Code:** e.g., "SAVE20"
- **Discount Type:** Percentage or Fixed amount
- **Discount Value:** 20% or ৳500
- **Minimum Order:** Minimum purchase required
- **Expiry Date:** When coupon expires
- **Usage Limit:** Max uses per customer
- **Active:** Enable/Disable coupon

#### 3. Edit Coupon
- Update discount amount
- Extend expiry date
- Change usage limits
- Activate/Deactivate

#### 4. Delete Coupon
- Remove coupon
- Confirm deletion

### Common Workflows

#### Workflow 1: Create Discount Coupon
```
1. Click "➕ Add Coupon"
2. Enter code: "WELCOME20"
3. Select discount type: "Percentage"
4. Enter discount: 20%
5. Set minimum order: ৳1,000
6. Set expiry: 30 days from now
7. Set usage limit: 100 uses
8. Click "Save"
9. Coupon active immediately
10. Customers can use code at checkout
```

---

## Flash Sales Management

### Access
**URL:** `http://localhost:5173/admin/flash-sales`

### Overview
Create time-limited flash sales for specific products.

### Key Features

#### 1. View Active Sales
- **List:** All flash sales
- **Status:** Active, Upcoming, Ended
- **Duration:** Start and end times
- **Discount:** Sale price and savings

#### 2. Create Flash Sale
**Form Fields:**
- **Product:** Select product
- **Sale Price:** Discounted price
- **Start Time:** When sale begins
- **End Time:** When sale ends
- **Quantity:** Limited stock for sale
- **Description:** Sale details

#### 3. Edit Sale
- Update sale price
- Extend duration
- Change quantity
- Activate/Deactivate

#### 4. Monitor Sales
- **Real-time:** See active sales
- **Countdown:** Time remaining
- **Stock:** Units sold vs. available

### Common Workflows

#### Workflow 1: Create Flash Sale
```
1. Click "➕ Create Flash Sale"
2. Select product: "Nida Pullover Burka"
3. Set sale price: ৳1,999 (from ৳2,599)
4. Set start time: Today 10:00 AM
5. Set end time: Today 6:00 PM
6. Set quantity: 20 units
7. Click "Save"
8. Sale goes live at start time
9. Customers see "Flash Sale" badge
10. Sale ends automatically at end time
```

---

## Offers Management

### Access
**URL:** `http://localhost:5173/admin/offers`

### Overview
Create promotional offers and banners.

### Key Features

#### 1. View All Offers
- **List:** All active and inactive offers
- **Type:** Banner, Popup, Featured
- **Status:** Active/Inactive

#### 2. Create Offer
**Form Fields:**
- **Title:** Offer headline
- **Description:** Offer details
- **Image:** Banner/Popup image
- **Link:** Where offer leads
- **Type:** Banner, Popup, Featured
- **Start Date:** When offer starts
- **End Date:** When offer ends
- **Active:** Enable/Disable

#### 3. Edit Offer
- Update offer details
- Change image
- Extend duration
- Activate/Deactivate

#### 4. Delete Offer
- Remove offer
- Confirm deletion

### Common Workflows

#### Workflow 1: Create Promotional Banner
```
1. Click "➕ Add Offer"
2. Enter title: "Summer Collection 50% Off"
3. Enter description: "Limited time offer"
4. Upload banner image
5. Set link: "/products?category=summer"
6. Select type: "Banner"
7. Set start date: Tomorrow
8. Set end date: 30 days from now
9. Click "Save"
10. Banner appears on homepage
```

---

## Customer Insights

### Access
**URL:** `http://localhost:5173/admin/customer-insights`

### Overview
Analyze customer behavior and purchasing patterns.

### Key Features

#### 1. Customer Segments
- **New Customers:** Registered in last 30 days
- **Active Customers:** Purchased in last 30 days
- **Inactive Customers:** No purchase in 90 days
- **VIP Customers:** High-value customers

#### 2. Purchase Analytics
- **Total Customers:** Count of all customers
- **Total Orders:** Count of all orders
- **Average Order Value:** Mean purchase amount
- **Repeat Purchase Rate:** % of customers who bought multiple times

#### 3. Customer Details
- **Name & Email:** Customer contact info
- **Total Orders:** Number of purchases
- **Total Spent:** Lifetime value
- **Last Purchase:** Most recent order date
- **Favorite Category:** Most purchased category

#### 4. Generate Insights
- **Automatic:** System generates insights
- **Manual:** Click "Generate" for specific customer
- **Export:** Download customer data as CSV

### Common Workflows

#### Workflow 1: Analyze Customer Behavior
```
1. Go to Customer Insights
2. View customer segments
3. See "Active Customers": 150
4. See "VIP Customers": 25
5. Click on VIP segment
6. View top customers by spending
7. See purchase patterns
8. Identify trends
9. Plan targeted campaigns
```

---

## User Management

### Access
**URL:** `http://localhost:5173/admin/user-management`

### Overview
Manage user accounts and roles.

### Key Features

#### 1. View All Users
- **List:** All registered users
- **Role:** Customer, Admin, Staff
- **Status:** Active, Inactive, Banned
- **Join Date:** Registration date

#### 2. User Details
- **Name & Email:** User contact info
- **Role:** Current role
- **Status:** Active/Inactive
- **Orders:** Number of purchases
- **Last Login:** Most recent login

#### 3. Change User Role
- **From:** Current role (Customer)
- **To:** New role (Admin, Staff)
- **Confirm:** Role change confirmation

#### 4. Manage User Status
- **Activate:** Enable user account
- **Deactivate:** Disable user account
- **Ban:** Prevent user from accessing

#### 5. Delete User
- **Confirm:** User deletion confirmation
- **Data:** User data archived

### Common Workflows

#### Workflow 1: Promote Customer to Admin
```
1. Go to User Management
2. Find user: "admin@example.com"
3. Click user to view details
4. Click "Change Role"
5. Select new role: "Admin"
6. Click "Confirm"
7. User now has admin access
8. User can access /admin dashboard
```

#### Workflow 2: Deactivate Suspicious Account
```
1. Find user with suspicious activity
2. Click user details
3. Click "Deactivate Account"
4. Confirm deactivation
5. User cannot login
6. User data preserved
7. Can reactivate later if needed
```

---

## Delivery Settings

### Access
**URL:** `http://localhost:5173/admin/delivery-settings`

### Overview
Configure delivery fees and shipping options.

### Key Features

#### 1. Delivery Fee Settings
- **Standard Fee:** Default delivery charge (৳120)
- **Free Delivery Threshold:** Minimum order for free delivery (৳2,000)
- **Enable/Disable:** Toggle free delivery

#### 2. Delivery Zones
- **Add Zone:** Create delivery area
- **Zone Name:** Area identifier
- **Fee:** Delivery charge for zone
- **Delivery Time:** Estimated delivery days

#### 3. Delivery Methods
- **Standard:** Regular delivery (3-5 days)
- **Express:** Fast delivery (1-2 days)
- **Pickup:** Customer pickup option

#### 4. Update Settings
- **Save:** Apply changes
- **Preview:** See how customers see it
- **Reset:** Restore default settings

### Common Workflows

#### Workflow 1: Update Delivery Fee
```
1. Go to Delivery Settings
2. Current fee: ৳120
3. Change to: ৳150
4. Set free delivery threshold: ৳2,500
5. Click "Save"
6. New fees apply to new orders
7. Existing orders unaffected
```

---

## Reviews Management

### Access
**URL:** `http://localhost:5173/admin/reviews`

### Overview
Manage customer product reviews and ratings.

### Key Features

#### 1. View All Reviews
- **List:** All product reviews
- **Rating:** Star rating (1-5)
- **Product:** Which product reviewed
- **Customer:** Who wrote review
- **Status:** Approved, Pending, Rejected

#### 2. Review Details
- **Rating:** Star rating
- **Comment:** Review text
- **Images:** Customer uploaded images
- **Helpful Count:** How many found helpful
- **Date:** When review posted

#### 3. Approve Review
- **Pending:** Reviews awaiting approval
- **Click:** "Approve" button
- **Visible:** Review appears on product page

#### 4. Reject Review
- **Reason:** Why rejecting
- **Hidden:** Review not visible to customers
- **Notify:** Customer notified of rejection

#### 5. Delete Review
- **Confirm:** Deletion confirmation
- **Removed:** Review deleted permanently

### Common Workflows

#### Workflow 1: Moderate Customer Review
```
1. Go to Reviews
2. See pending review: "Great product!"
3. Read full review and images
4. Check for inappropriate content
5. Click "Approve"
6. Review appears on product page
7. Customers can see and rate review
```

---

## Q&A Management

### Access
**URL:** `http://localhost:5173/admin/qa`

### Overview
Manage customer questions and answers about products.

### Key Features

#### 1. View Questions
- **List:** All product questions
- **Product:** Which product
- **Question:** Customer question
- **Status:** Answered, Unanswered
- **Date:** When asked

#### 2. Answer Question
- **Click:** Question to open
- **Type:** Answer text
- **Save:** Post answer
- **Visible:** Answer appears on product page

#### 3. Edit Answer
- **Click:** Edit button
- **Update:** Answer text
- **Save:** Changes applied

#### 4. Delete Q&A
- **Confirm:** Deletion confirmation
- **Removed:** Q&A deleted

### Common Workflows

#### Workflow 1: Answer Customer Question
```
1. Go to Q&A
2. See unanswered question: "What sizes available?"
3. Click question to open
4. Type answer: "Available in S, M, L, XL"
5. Click "Post Answer"
6. Answer visible on product page
7. Customer notified of answer
```

---

## Support Tickets

### Access
**URL:** `http://localhost:5173/admin/support`

### Overview
Manage customer support tickets and inquiries.

### Key Features

#### 1. View Tickets
- **List:** All support tickets
- **Status:** Open, In Progress, Resolved, Closed
- **Priority:** Low, Medium, High, Urgent
- **Customer:** Who submitted
- **Date:** When submitted

#### 2. Ticket Details
- **Subject:** Ticket title
- **Description:** Issue details
- **Messages:** Conversation history
- **Attachments:** Customer files

#### 3. Respond to Ticket
- **Type:** Response message
- **Attach:** Files if needed
- **Send:** Post response
- **Notify:** Customer notified

#### 4. Update Status
- **Open:** New ticket
- **In Progress:** Being worked on
- **Resolved:** Issue fixed
- **Closed:** Ticket closed

#### 5. Assign Ticket
- **Assign To:** Staff member
- **Notify:** Assignee notified
- **Track:** See who's handling

### Common Workflows

#### Workflow 1: Handle Support Ticket
```
1. Go to Support Tickets
2. See new ticket: "Order not received"
3. Click ticket to open
4. Read customer message
5. Click "Assign to Me"
6. Status: "In Progress"
7. Type response: "We'll investigate"
8. Send message
9. Customer receives notification
10. Continue conversation
11. Resolve issue
12. Status: "Resolved"
13. Close ticket
```

---

## Returns Management

### Access
**URL:** `http://localhost:5173/admin/returns`

### Overview
Manage product returns and refunds.

### Key Features

#### 1. View Returns
- **List:** All return requests
- **Order:** Which order
- **Reason:** Why returning
- **Status:** Pending, Approved, Rejected, Refunded
- **Date:** When requested

#### 2. Return Details
- **Product:** Item being returned
- **Reason:** Return reason
- **Condition:** Product condition
- **Images:** Return photos
- **Refund Method:** How to refund

#### 3. Approve Return
- **Review:** Return details
- **Click:** "Approve" button
- **Notify:** Customer notified
- **Status:** "Approved"

#### 4. Process Refund
- **Amount:** Refund amount
- **Method:** Refund method (bKash, Bank, etc.)
- **Process:** Send refund
- **Confirm:** Refund sent
- **Status:** "Refunded"

#### 5. Reject Return
- **Reason:** Why rejecting
- **Notify:** Customer notified
- **Status:** "Rejected"

### Common Workflows

#### Workflow 1: Process Return Request
```
1. Go to Returns
2. See return request: "Wrong size"
3. Click to view details
4. See product images
5. Verify return reason
6. Click "Approve Return"
7. Status: "Approved"
8. Customer ships product back
9. Receive product
10. Click "Process Refund"
11. Select refund method: "bKash"
12. Enter refund amount: ৳2,599
13. Click "Send Refund"
14. Status: "Refunded"
15. Customer receives refund
```

---

## Admin Dashboard Statistics

### Real-time Metrics
- **Total Orders:** All orders in system
- **Pending Orders:** Awaiting payment confirmation
- **Processing Orders:** Confirmed and being prepared
- **Delivered Orders:** Successfully completed
- **Total Revenue:** Sum of all confirmed payments
- **Active Customers:** Customers with recent activity
- **New Products:** Recently added products
- **Low Stock Items:** Products below threshold

### Charts & Analytics
- **Order Trends:** Orders over time
- **Revenue Chart:** Revenue over time
- **Top Products:** Best-selling products
- **Customer Growth:** New customers over time
- **Payment Methods:** Distribution of payment types

---

## Best Practices

### Order Management
1. **Check regularly:** Review pending orders daily
2. **Confirm payments:** Verify transaction IDs before confirming
3. **Update status:** Keep customers informed with status updates
4. **Communicate:** Contact customers for issues
5. **Archive:** Keep records of completed orders

### Inventory Management
1. **Monitor stock:** Check low stock alerts daily
2. **Reorder early:** Don't wait until out of stock
3. **Track movements:** Maintain audit trail
4. **Forecast demand:** Plan for seasonal trends
5. **Adjust prices:** Update based on stock levels

### Customer Service
1. **Respond quickly:** Answer support tickets within 24 hours
2. **Be professional:** Maintain professional communication
3. **Document:** Keep records of all interactions
4. **Follow up:** Check if issues are resolved
5. **Gather feedback:** Use customer insights for improvements

### Product Management
1. **Keep updated:** Update product info regularly
2. **Quality images:** Use high-quality product photos
3. **Accurate descriptions:** Write clear product details
4. **Manage variants:** Keep sizes and colors current
5. **Monitor reviews:** Respond to customer feedback

---

## Troubleshooting

### Common Issues

#### Issue: Can't access admin dashboard
**Solution:**
1. Verify you're logged in
2. Check your role is set to "admin" in database
3. Try logging out and back in
4. Clear browser cache
5. Contact administrator

#### Issue: Orders not showing
**Solution:**
1. Check filter settings
2. Verify orders exist in database
3. Try refreshing page
4. Check browser console for errors
5. Contact support

#### Issue: Payment confirmation fails
**Solution:**
1. Verify transaction ID format
2. Check transaction ID not already used
3. Ensure order status is "Pending"
4. Try again with correct ID
5. Contact support if persists

#### Issue: Stock not updating
**Solution:**
1. Verify you have admin access
2. Check product exists
3. Try refreshing page
4. Clear browser cache
5. Contact support

---

## Support & Help

### Getting Help
- **Documentation:** See this guide
- **Setup Guide:** See `ADMIN_SETUP_INSTRUCTIONS.md`
- **Contact:** Email support@borkabazar.com
- **WhatsApp:** +880 1521-721946

### Reporting Issues
1. Describe the issue clearly
2. Include screenshots if possible
3. Provide order/product IDs
4. Include error messages
5. Send to support team

---

## Version History

- **v1.0** (April 2026) - Initial admin dashboard release
- **v1.1** (April 2026) - Added payment confirmation workflow
- **v1.2** (April 2026) - Enhanced order management features

---

**Last Updated:** April 27, 2026
**Documentation Version:** 1.2
**Status:** Active & Maintained
