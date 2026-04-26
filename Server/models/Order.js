const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        title: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: String,
        size: String,
        color: String,
      },
    ],
    shippingInfo: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
      area: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ['COD', 'bKash', 'Nagad', 'rocket'],
        default: 'COD',
      },
      transactionId: {
        type: String,
        sparse: true,
        trim: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Paid', 'Failed', 'Rejected'],
        default: 'Pending',
      },
    },
    advancePayment: {
      method: {
        type: String,
        enum: ['bKash', 'Nagad', 'Rocket', 'Upay', 'Bank Transfer'],
        default: 'bKash',
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      transactionId: {
        type: String,
        sparse: true,
        trim: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Paid', 'Failed', 'Rejected'],
        default: 'Pending',
      },
      paidAt: Date,
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      confirmedAt: Date,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    specialInstructions: String,
    
    // Keeping backward compatibility fields optional 
    customer: {
      name: String,
      phone: String,
      email: String,
      address: String,
    },
    products: [mongoose.Schema.Types.Mixed],
    pricing: {
      subtotal: Number,
      deliveryFee: Number,
      total: Number,
      remainingAmount: Number,
    },
    payment: mongoose.Schema.Types.Mixed,
    order: {
      status: String,
      notes: String,
    },
    admin: {
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
orderSchema.index({ 'shippingInfo.email': 1 });
orderSchema.index({ 'shippingInfo.phone': 1 });
orderSchema.index({ orderCode: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
