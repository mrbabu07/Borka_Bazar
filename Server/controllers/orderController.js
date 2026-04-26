const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

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
      products,
      orderItems,
      shippingInfo,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      subtotal,
      deliveryCharge,
      deliveryFee,
      total,
      totalPrice,
      paymentMethod,
      transactionId,
      specialInstructions,
    } = req.body;

    // Use either new schema names or fallback to old schema names
    const items = orderItems || products;
    const finalSubtotal = subtotal || 0;
    const finalDeliveryCharge = deliveryCharge || deliveryFee || 0;
    const finalTotal = totalPrice || total || (finalSubtotal + finalDeliveryCharge);
    
    // Construct backward-compatible shipping & user logic
    const shipping = shippingInfo || {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
    };

    // Validation
    if (!shipping.name || !shipping.phone || !items || !finalTotal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (name, phone, items, or total)',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items array is required and cannot be empty',
      });
    }

    // Generate unique order code
    const orderCode = await generateOrderCode();

    // Resolve User ID securely bridging Firebase to Mongo DB
    let realUserId = null;
    if (req.user?.uid) {
      if (mongoose.Types.ObjectId.isValid(req.user.uid)) {
        realUserId = req.user.uid;
      } else if (req.app?.locals?.models?.User) {
        const userDbRecord = await req.app.locals.models.User.findByFirebaseUid(req.user.uid);
        if (userDbRecord && userDbRecord._id) {
          realUserId = userDbRecord._id;
        }
      }
    } else if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
      realUserId = req.user._id;
    }

    // Create order using unified schema properties
    const orderData = {
      orderCode,
      user: realUserId,
      orderItems: items,
      shippingInfo: shipping,
      paymentInfo: {
        method: paymentMethod || 'COD',
        transactionId: transactionId || null,
        status: paymentMethod === 'COD' ? 'Pending' : 'Pending',
      },
      advancePayment: {
        method: paymentMethod === 'COD' ? 'bKash' : paymentMethod,
        amount: finalDeliveryCharge,
        status: 'Pending',
      },
      totalPrice: finalTotal,
      subtotal: finalSubtotal,
      deliveryCharge: finalDeliveryCharge,
      orderStatus: 'Pending',
      specialInstructions: specialInstructions || '',

      // Legacy fallback fields (To prevent crashing old UI mappings that haven't been updated)
      customer: {
        name: shipping.name,
        phone: shipping.phone,
        email: shipping.email || '',
        address: shipping.address || '',
      },
      products: items,
      pricing: {
        subtotal: finalSubtotal,
        deliveryFee: finalDeliveryCharge,
        total: finalTotal,
        remainingAmount: paymentMethod === 'COD' ? finalTotal : 0,
      },
      payment: {
        advance: { status: 'Pending', method: paymentMethod || 'COD', amount: finalDeliveryCharge },
        remaining: { status: 'Pending', method: 'COD', amount: finalSubtotal },
        paymentStatus: 'partial',
      },
      order: {
        status: 'Pending',
      }
    };

    const order = new Order(orderData);
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Create order error:', error);

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
    console.log('📋 getAllOrders called');
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;

    // Build filter gracefully considering both structures
    const filter = {};
    if (status) {
      filter.$or = [{ orderStatus: status }, { 'order.status': status }];
    }
    if (paymentStatus) {
      filter.$or = [{ 'paymentInfo.status': paymentStatus }, { 'payment.status': paymentStatus }];
    }

    const skip = (page - 1) * limit;

    console.log('🔍 Fetching orders with filter:', filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    console.log(`✅ Found ${total} orders, returning ${orders.length} on page ${page}`);

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
    
    // Resolve User ID securely bridging Firebase to Mongo DB
    let realUserId = null;
    if (req.user?.uid) {
      if (mongoose.Types.ObjectId.isValid(req.user.uid)) {
        realUserId = req.user.uid;
      } else if (req.app?.locals?.models?.User) {
        const userDbRecord = await req.app.locals.models.User.findByFirebaseUid(req.user.uid);
        if (userDbRecord && userDbRecord._id) {
          realUserId = userDbRecord._id;
        }
      }
    } else if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
      realUserId = req.user._id;
    }

    console.log('📋 getUserOrders called with:', {
      userEmail,
      firebaseUid: req.user?.uid,
      resolvedUserId: realUserId,
    });

    if (!userEmail && !realUserId) {
      console.warn('⚠️ No email or ID found in user token');
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 },
      });
    }

    const skip = (page - 1) * limit;
    
    // Look for user ID OR email matching shippingInfo.email OR customer.email
    const filter = {
      $or: [
        realUserId ? { user: realUserId } : null,
        userEmail ? { 'shippingInfo.email': userEmail } : null,
        userEmail ? { 'customer.email': userEmail } : null,
      ].filter(Boolean)
    };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    console.log(`✅ Found ${total} orders for user`);

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
    console.error('❌ Get user orders error:', error);
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
// Confirm advance payment (Admin)
exports.confirmAdvancePayment = async (req, res) => {
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

    // Check both old and new structures
    const advanceStatus = order.advancePayment?.status || order.payment?.advance?.status;
    if (advanceStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm advance payment. Current status: ${advanceStatus}`,
      });
    }

    // Check for duplicate transaction ID
    const existingTransaction = await Order.findOne({
      $or: [
        { 'advancePayment.transactionId': transactionId },
        { 'payment.advance.transactionId': transactionId }
      ],
      _id: { $ne: id },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already used',
      });
    }

    // Update order with new structure
    if (order.advancePayment) {
      order.advancePayment.transactionId = transactionId;
      order.advancePayment.status = 'Confirmed';
      order.advancePayment.confirmedAt = new Date();
      order.advancePayment.confirmedBy = adminId;
    }
    
    // Also update legacy structure for backward compatibility
    if (order.payment?.advance) {
      order.payment.advance.transactionId = transactionId;
      order.payment.advance.status = 'Confirmed';
      order.payment.advance.confirmedAt = new Date();
      order.payment.advance.confirmedBy = adminId;
    }
    
    // Update order status
    order.orderStatus = 'Processing';
    if (order.order) {
      order.order.status = 'Processing';
    }
    
    // Initialize admin object if it doesn't exist
    if (!order.admin) {
      order.admin = {};
    }
    order.admin.confirmedBy = adminId;
    order.admin.confirmedAt = new Date();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Advance payment confirmed successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        advancePaymentStatus: order.advancePayment?.status || order.payment?.advance?.status,
        orderStatus: order.orderStatus || order.order?.status,
      },
    });
  } catch (error) {
    console.error('Confirm advance payment error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
      transactionId: req.body.transactionId,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to confirm advance payment',
      error: error.message,
    });
  }
};

// Pay remaining amount (User)
exports.payRemaining = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, transactionId } = req.body;

    if (!method || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method and transaction ID are required',
      });
    }

    if (!['COD', 'bKash', 'Nagad'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if advance payment is confirmed
    if (order.payment.advance.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Advance payment must be confirmed before paying remaining amount',
      });
    }

    // Check if remaining is already paid
    if (order.payment.remaining.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Remaining amount already paid',
      });
    }

    // For COD, mark as pending. For online methods, check for duplicate transaction ID
    if (method !== 'COD') {
      const existingTransaction = await Order.findOne({
        'payment.remaining.transactionId': transactionId,
        _id: { $ne: id },
      });

      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already used',
        });
      }
    }

    // Update order
    order.payment.remaining.method = method;
    if (method !== 'COD') {
      order.payment.remaining.transactionId = transactionId;
      order.payment.remaining.status = 'Pending';
    } else {
      order.payment.remaining.status = 'Pending';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Remaining payment submitted for ${method}`,
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        remainingPaymentStatus: order.payment.remaining.status,
        paymentStatus: order.payment.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Pay remaining error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit remaining payment',
      error: error.message,
    });
  }
};

// Confirm remaining payment (Admin)
exports.confirmRemainingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.payment.remaining.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm remaining payment. Current status: ${order.payment.remaining.status}`,
      });
    }

    // Update order
    order.payment.remaining.status = 'Paid';
    order.payment.remaining.paidAt = new Date();

    // Update overall payment status
    if (order.payment.advance.status === 'Confirmed' && order.payment.remaining.status === 'Paid') {
      order.payment.paymentStatus = 'full';
    }

    if (adminId) {
      order.admin.confirmedBy = adminId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Remaining payment confirmed successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        remainingPaymentStatus: order.payment.remaining.status,
        paymentStatus: order.payment.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Confirm remaining payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm remaining payment',
      error: error.message,
    });
  }
};

// Reject advance payment (Admin)
exports.rejectAdvancePayment = async (req, res) => {
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

    if (order.payment.advance.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject advance payment. Current status: ${order.payment.advance.status}`,
      });
    }

    // Update order
    order.payment.advance.status = 'Rejected';
    order.payment.advance.rejectionReason = reason || 'No reason provided';
    order.order.status = 'Cancelled';
    if (adminId) {
      order.admin.rejectedBy = adminId;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Advance payment rejected successfully',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        advancePaymentStatus: order.payment.advance.status,
        orderStatus: order.order.status,
      },
    });
  } catch (error) {
    console.error('Reject advance payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject advance payment',
      error: error.message,
    });
  }
};

// Confirm payment (Admin) - DEPRECATED - Use confirmAdvancePayment instead
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

    if (order.payment.advance.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm payment. Current status: ${order.payment.advance.status}`,
      });
    }

    // Check for duplicate transaction ID
    const existingTransaction = await Order.findOne({
      'payment.advance.transactionId': transactionId,
      _id: { $ne: id },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already used',
      });
    }

    // Update order
    order.payment.advance.transactionId = transactionId;
    order.payment.advance.status = 'Confirmed';
    order.payment.advance.confirmedAt = new Date();
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
        paymentStatus: order.payment.paymentStatus,
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
// Reject payment (Admin) - DEPRECATED - Use rejectAdvancePayment instead
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

    if (order.payment.advance.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject payment. Current status: ${order.payment.advance.status}`,
      });
    }

    // Update order
    order.payment.advance.status = 'Rejected';
    order.payment.advance.rejectionReason = reason || 'No reason provided';
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
        paymentStatus: order.payment.paymentStatus,
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

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update both paths to ensure backward and UI compatibility
    order.orderStatus = status;
    order.specialInstructions = notes || order.specialInstructions;
    
    if (order.order) {
      order.order.status = status;
      order.order.notes = notes || order.order.notes;
    } else {
      order.order = { status, notes };
    }

    await order.save();

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
