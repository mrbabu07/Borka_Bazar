const Order = require('../models/Order');
const Product = require('../models/Product');

// Generate unique order code
const generateOrderCode = async () => {
  let orderCode;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    orderCode = `ORD-${randomNum}`;
    const existingOrder = await Order.findOne({ orderCode });
    exists = !!existingOrder;
  }

  return orderCode;
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      products,
      subtotal,
      deliveryFee,
      paymentMethod,
    } = req.body;

    // Validation
    if (!customerName || !customerPhone || !products || !subtotal || !deliveryFee) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!['bKash', 'Nagad'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and cannot be empty',
      });
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(customerPhone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number',
      });
    }

    // Calculate total
    const total = subtotal + deliveryFee;
    const remainingAmount = subtotal; // Remaining to be paid via COD

    // Generate unique order code
    const orderCode = await generateOrderCode();

    // Create order
    const order = new Order({
      orderCode,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || '',
        address: customerAddress || '',
      },
      products,
      pricing: {
        subtotal,
        deliveryFee,
        total,
        remainingAmount,
      },
      payment: {
        method: paymentMethod,
        status: 'Pending',
      },
      order: {
        status: 'Pending',
      },
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        total: order.pricing.total,
        deliveryFee: order.pricing.deliveryFee,
        remainingAmount: order.pricing.remainingAmount,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);

    // Handle duplicate transaction ID
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter['order.status'] = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('admin.confirmedBy', 'name email')
      .populate('admin.rejectedBy', 'name email');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// Get user's own orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required',
      });
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find({ 'customer.email': userEmail })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ 'customer.email': userEmail });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message,
    });
  }
};

// Get single order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('admin.confirmedBy', 'name email')
      .populate('admin.rejectedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
};

// Confirm payment (Admin)
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, adminId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm payment. Current status: ${order.payment.status}`,
      });
    }

    // Check for duplicate transaction ID
    const existingTransaction = await Order.findOne({
      'payment.transactionId': transactionId,
      _id: { $ne: id },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already used',
      });
    }

    // Update order
    order.payment.transactionId = transactionId;
    order.payment.status = 'Confirmed';
    order.payment.confirmedAt = new Date();
    order.order.status = 'Processing';
    if (adminId) {
      order.admin.confirmedBy = adminId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        paymentStatus: order.payment.status,
        orderStatus: order.order.status,
      },
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message,
    });
  }
};

// Reject payment (Admin)
exports.rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.payment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject payment. Current status: ${order.payment.status}`,
      });
    }

    // Update order
    order.payment.status = 'Rejected';
    order.payment.rejectionReason = reason || 'No reason provided';
    order.order.status = 'Cancelled';
    if (adminId) {
      order.admin.rejectedBy = adminId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment rejected successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        paymentStatus: order.payment.status,
        orderStatus: order.order.status,
      },
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment',
      error: error.message,
    });
  }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        'order.status': status,
        'order.notes': notes || order.order.notes,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

// Get order statistics (Admin)
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'Pending'] }, 1, 0],
            },
          },
          confirmedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'Confirmed'] }, 1, 0],
            },
          },
          rejectedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'Rejected'] }, 1, 0],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'Confirmed'] }, '$pricing.total', 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalOrders: 0,
        pendingPayments: 0,
        confirmedPayments: 0,
        rejectedPayments: 0,
        totalRevenue: 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};
