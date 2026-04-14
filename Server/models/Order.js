const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },
    products: [
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
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      deliveryFee: {
        type: Number,
        required: true,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      remainingAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['bKash', 'Nagad'],
        required: true,
      },
      transactionId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
      },
      status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Rejected'],
        default: 'Pending',
      },
      confirmedAt: Date,
      rejectionReason: String,
    },
    order: {
      status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending',
      },
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

// Index for faster queries
orderSchema.index({ 'payment.status': 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ orderCode: 1 });

module.exports = mongoose.model('Order', orderSchema);
