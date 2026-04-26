# Visual Workflow Diagrams - Advance Payment System

## Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADVANCE PAYMENT WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: ORDER CREATION
═══════════════════════════════════════════════════════════════════════════

    Customer                          System                        Database
    ────────                          ──────                        ────────
       │                                 │                             │
       │  1. Place Order                 │                             │
       ├────────────────────────────────>│                             │
       │                                 │  2. Create Order            │
       │                                 ├────────────────────────────>│
       │                                 │                             │
       │                                 │  3. Initialize              │
       │                                 │     advancePayment          │
       │                                 │     status = "Pending"      │
       │                                 │                             │
       │                                 │  4. Save Order              │
       │                                 ├────────────────────────────>│
       │                                 │                             │
       │  5. Order Confirmation          │                             │
       │<────────────────────────────────┤                             │
       │     (with delivery fee)         │                             │
       │                                 │                             │

PHASE 2: CUSTOMER PAYMENT
═══════════════════════════════════════════════════════════════════════════

    Customer                    Payment Gateway                    Admin
    ────────                    ───────────────                    ────
       │                              │                             │
       │  1. Pay Delivery Fee         │                             │
       ├─────────────────────────────>│                             │
       │                              │                             │
       │  2. Transaction ID           │                             │
       │<─────────────────────────────┤                             │
       │     (e.g., TXN123456789)     │                             │
       │                              │                             │
       │  3. Provide Transaction ID   │                             │
       ├──────────────────────────────────────────────────────────>│
       │                              │                             │

PHASE 3: ADMIN CONFIRMATION
═══════════════════════════════════════════════════════════════════════════

    Admin                         System                        Database
    ─────                         ──────                        ────────
       │                             │                             │
       │  1. View Orders             │                             │
       ├────────────────────────────>│                             │
       │                             │  2. Get Orders              │
       │                             ├────────────────────────────>│
       │                             │                             │
       │  3. Orders List             │  4. Return Orders           │
       │<────────────────────────────┤<────────────────────────────┤
       │  (with pending payments)    │                             │
       │                             │                             │
       │  5. Click "Confirm Payment" │                             │
       ├────────────────────────────>│                             │
       │                             │  6. Open Modal              │
       │  7. Modal Opens             │                             │
       │<────────────────────────────┤                             │
       │                             │                             │
       │  8. Enter Transaction ID    │                             │
       ├────────────────────────────>│                             │
       │                             │  9. Validate ID             │
       │                             │     - Check if required     │
       │                             │     - Check if unique       │
       │                             │                             │
       │  10. Click "Confirm"        │                             │
       ├────────────────────────────>│                             │
       │                             │  11. Update Order           │
       │                             │      - status = "Confirmed" │
       │                             │      - transactionId        │
       │                             │      - confirmedAt          │
       │                             │      - confirmedBy          │
       │                             ├────────────────────────────>│
       │                             │                             │
       │                             │  12. Change Order Status    │
       │                             │      to "Processing"        │
       │                             ├────────────────────────────>│
       │                             │                             │
       │  13. Success Toast          │                             │
       │<────────────────────────────┤                             │
       │                             │                             │
       │  14. Modal Closes           │                             │
       │<────────────────────────────┤                             │
       │                             │                             │

PHASE 4: ORDER PROCESSING
═══════════════════════════════════════════════════════════════════════════

    Admin                         System                      Customer
    ─────                         ──────                      ────────
       │                             │                           │
       │  1. Update Status           │                           │
       │     Processing → Shipped    │                           │
       ├────────────────────────────>│                           │
       │                             │  2. Update Database       │
       │                             ├──────────────────────────>│
       │                             │                           │
       │  3. Status Updated          │  4. Notify Customer       │
       │<────────────────────────────┤<──────────────────────────┤
       │                             │                           │
       │  5. Update Status           │                           │
       │     Shipped → Delivered     │                           │
       ├────────────────────────────>│                           │
       │                             │  6. Update Database       │
       │                             ├──────────────────────────>│
       │                             │                           │
       │  7. Status Updated          │  8. Notify Customer       │
       │<────────────────────────────┤<──────────────────────────┤
       │                             │                           │
       │                             │  9. Customer Receives     │
       │                             │     Product & Pays        │
       │                             │     Remaining Amount      │
       │                             │                           │
       │                             │  10. Order Complete       │
       │                             │<──────────────────────────┤
       │                             │                           │
```

## Admin Payment Confirmation Modal

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  💳 Confirm Advance Payment                            │ │
│  │  Order #ABC12345                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Payment Method: bKash                                 │ │
│  │  Amount: ৳120                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Transaction ID *                                      │ │
│  │  [_____________________________________]               │ │
│  │  This ID will be recorded for audit trail             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ℹ️ After confirmation: Order status will change to    │ │
│  │     "Processing" and customer will be notified.        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [Cancel]              [Confirm Payment]               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Order Status Progression

```
┌─────────────┐
│   PENDING   │  ← Order created with pending advance payment
└──────┬──────┘
       │
       │ Admin confirms payment
       │ (Advance Payment: ৳120)
       ↓
┌──────────────────┐
│   PROCESSING     │  ← Order status auto-updated
└──────┬───────────┘
       │
       │ Admin updates status
       │
       ↓
┌──────────────────┐
│    SHIPPED       │  ← Order sent to customer
└──────┬───────────┘
       │
       │ Admin updates status
       │
       ↓
┌──────────────────┐
│   DELIVERED      │  ← Order received by customer
└──────────────────┘
       │
       │ Customer pays remaining amount
       │
       ↓
┌──────────────────┐
│   COMPLETED      │  ← Order complete
└──────────────────┘
```

## Customer Order Display

### Grid View - Pending Payment
```
┌─────────────────────────────────────┐
│  Order #ABC123                      │
│  Jan 15, 2025                       │
│  Status: Pending                    │
├─────────────────────────────────────┤
│                                     │
│  [Product Image]                    │
│                                     │
│  T-Shirt                            │
│  1 item                             │
├─────────────────────────────────────┤
│  Total: ৳1,120                      │
│  Delivery: ৳120                     │
│  ⏳ Advance Payment: ৳120            │  ← Yellow highlight
├─────────────────────────────────────┤
│  [View Details]                     │
└─────────────────────────────────────┘
```

### Grid View - Confirmed Payment
```
┌─────────────────────────────────────┐
│  Order #ABC123                      │
│  Jan 15, 2025                       │
│  Status: Processing                 │
├─────────────────────────────────────┤
│                                     │
│  [Product Image]                    │
│                                     │
│  T-Shirt                            │
│  1 item                             │
├─────────────────────────────────────┤
│  Total: ৳1,120                      │
│  Delivery: ৳120                     │
├─────────────────────────────────────┤
│  [View Details]                     │
└─────────────────────────────────────┘
```

### Detail Modal - Pending Payment
```
┌──────────────────────────────────────────────────────┐
│  Order #ABC123                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Status: Pending          Placed: Jan 15, 2025      │
│                                                      │
│  ⚠️ Awaiting Delivery Fee Payment                    │
│  Please complete the delivery fee payment to        │
│  confirm your order. Admin will verify and          │
│  confirm your order after payment.                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  💳 Advance Payment (Delivery Fee)             │ │
│  │  Method: bKash                                 │ │
│  │  Amount: ৳120                                  │ │
│  │  Status: ⏳ Pending                             │ │
│  │                                                │ │
│  │  ⏳ Awaiting confirmation from admin           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Items (1)                                           │
│  ├─ T-Shirt × 1 = ৳1,000                           │
│                                                      │
│  Pricing                                             │
│  ├─ Subtotal: ৳1,000                               │
│  ├─ Delivery: ৳120                                 │
│  └─ Total: ৳1,120                                  │
│                                                      │
│  [Pay Remaining] [Cancel Order] [Reorder]          │
└──────────────────────────────────────────────────────┘
```

### Detail Modal - Confirmed Payment
```
┌──────────────────────────────────────────────────────┐
│  Order #ABC123                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Status: Processing       Placed: Jan 15, 2025      │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  💳 Advance Payment (Delivery Fee)             │ │
│  │  Method: bKash                                 │ │
│  │  Amount: ৳120                                  │ │
│  │  Status: ✓ Confirmed                           │ │
│  │                                                │ │
│  │  Transaction ID: TXN123456789                  │ │
│  │  ✓ Confirmed on Jan 15, 2025                   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Items (1)                                           │
│  ├─ T-Shirt × 1 = ৳1,000                           │
│                                                      │
│  Pricing                                             │
│  ├─ Subtotal: ৳1,000                               │
│  ├─ Delivery: ৳120                                 │
│  └─ Total: ৳1,120                                  │
│                                                      │
│  [Reorder]                                           │
└──────────────────────────────────────────────────────┘
```

## Admin Orders List

```
┌────────────────────────────────────────────────────────────────────┐
│  Orders Management                                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Stats:  Total: 45  Pending: 12  Processing: 8  Delivered: 25    │
│                                                                    │
│  Filters: [All] [Pending] [Processing] [Shipped] [Delivered]     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ⏳ Order #ABC123                                                  │
│     Jan 15, 2025 • John Doe • Dhaka                               │
│     2 items | ৳1,120 (+৳120 delivery)                             │
│     [Print] [Status ▼] [▼]                                        │
│                                                                    │
│     ┌──────────────────────────────────────────────────────────┐  │
│     │  Order Items (2)                                         │  │
│     │  ├─ T-Shirt × 1 = ৳500                                  │  │
│     │  └─ Jeans × 1 = ৳500                                    │  │
│     │                                                          │  │
│     │  Order Summary                                           │  │
│     │  ├─ Subtotal: ৳1,000                                    │  │
│     │  ├─ Delivery: ৳120                                      │  │
│     │  └─ Total: ৳1,120                                       │  │
│     │                                                          │  │
│     │  Quick Actions:                                          │  │
│     │  [💳 Confirm Advance Payment (৳120)]  ← Yellow button   │  │
│     │  [🖨️ Print Order]                                        │  │
│     └──────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ✅ Order #XYZ789                                                  │
│     Jan 14, 2025 • Jane Smith • Gulshan                           │
│     1 item | ৳800 (+৳120 delivery)                                │
│     [Print] [Status ▼] [▼]                                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AdminOrders.jsx                                                │
│  ├─ State Management                                            │
│  │  ├─ showPaymentModal                                         │
│  │  ├─ selectedOrderForPayment                                  │
│  │  ├─ transactionId                                            │
│  │  └─ confirmingPayment                                        │
│  │                                                              │
│  ├─ Helper Functions                                            │
│  │  ├─ getAdvancePaymentInfo()                                  │
│  │  └─ isAdvancePaymentPending()                                │
│  │                                                              │
│  ├─ Event Handlers                                              │
│  │  └─ handleConfirmAdvancePayment()                            │
│  │                                                              │
│  └─ UI Components                                               │
│     ├─ Confirm Payment Button                                   │
│     └─ Payment Confirmation Modal                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
                    API Call (fetch)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  orderController.js                                             │
│  └─ confirmAdvancePayment()                                     │
│     ├─ Validate transaction ID                                  │
│     ├─ Check order exists                                       │
│     ├─ Check payment status                                     │
│     ├─ Check duplicate transaction ID                           │
│     ├─ Update order in database                                 │
│     └─ Return response                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
                    Database Update
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Order Collection                                               │
│  └─ advancePayment                                              │
│     ├─ method: "bKash"                                          │
│     ├─ amount: 120                                              │
│     ├─ status: "Confirmed"                                      │
│     ├─ transactionId: "TXN123456789"                             │
│     ├─ confirmedAt: Date                                        │
│     └─ confirmedBy: adminId                                     │
│                                                                 │
│  orderStatus: "Processing"                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Action
    ↓
Validate Input
    ├─ Transaction ID empty?
    │  └─ Show Error: "Please enter a transaction ID"
    │
    └─ Transaction ID provided?
       ↓
       API Call
       ├─ Network Error?
       │  └─ Show Error: "Failed to confirm payment"
       │
       ├─ Server Error (400)?
       │  ├─ Duplicate Transaction ID?
       │  │  └─ Show Error: "Transaction ID already used"
       │  │
       │  ├─ Invalid Status?
       │  │  └─ Show Error: "Cannot confirm advance payment. Current status: Confirmed"
       │  │
       │  └─ Other Error?
       │     └─ Show Error: error.message
       │
       ├─ Server Error (404)?
       │  └─ Show Error: "Order not found"
       │
       └─ Success (200)?
          ├─ Update UI
          ├─ Close Modal
          ├─ Show Success Toast
          └─ Refresh Order List
```

---

This visual documentation provides a complete overview of the advance payment system workflow, UI components, and data flow.
