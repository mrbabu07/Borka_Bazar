const Product = require('../models/Product');
const { ObjectId } = require('mongodb');
const { createRealtimeNotification } = require('./notificationController');
const { calculateOrderPricing } = require('../utils/orderPricing');
const { getCompletedOrderDeleteEligibility } = require('../utils/orderDeletion');

const getOrderModel = (req) => req.app.locals.models.Order;
const isValidObjectId = (id) => ObjectId.isValid(id);
const getOrderIdentifier = (order) => order.orderCode || order._id?.toString?.()?.slice(-8) || 'order';

const notifyAdmins = async (req, data) => {
  await createRealtimeNotification(req.app.locals.models, {
    audience: 'admin',
    ...data,
  });
};

const notifyOrderCustomer = async (req, order, data) => {
  await createRealtimeNotification(req.app.locals.models, {
    audience: 'user',
    recipientUserId: order.firebaseUid || null,
    recipientEmail: order.shippingInfo?.email || order.customer?.email || null,
    ...data,
  });
};

// Generate unique order code
const generateOrderCode = async (Order) => {
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

const calculateAdminDeliveryCharge = async (req, subtotal, area) => {
  const DeliverySettings = req.app.locals.models.DeliverySettings;
  const settings = await DeliverySettings.getSettings();
  let deliveryCharge = Number(settings.standardDeliveryCharge) || 0;

  if (area && Array.isArray(settings.deliveryAreas)) {
    const areaSettings = settings.deliveryAreas.find(
      (item) => item.enabled && item.name?.toLowerCase() === area.toLowerCase(),
    );
    if (areaSettings) {
      deliveryCharge = Number(areaSettings.charge) || deliveryCharge;
    }
  }

  return { deliveryCharge, settings };
};

const parseCleanupDays = (value) => {
  const days = Number.parseInt(value, 10);
  if (!Number.isFinite(days) || days < 30) {
    return null;
  }
  return Math.min(days, 3650);
};

const getCleanupCutoffDate = (days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return cutoffDate;
};


// Create new order
exports.createOrder = async (req, res) => {
  try {
    const Order = getOrderModel(req);
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
      senderNumber,
      receiverNumber,
      specialInstructions,
      couponDiscount,
      totalDiscount,
    } = req.body;

    console.log('📦 createOrder received:', {
      subtotal,
      deliveryCharge,
      deliveryFee,
      total,
      totalPrice,
      paymentMethod,
      itemsCount: orderItems?.length || products?.length,
    });

    // Use either new schema names or fallback to old schema names
    const items = orderItems || products;
    const { settings: deliverySettings } = await calculateAdminDeliveryCharge(
      req,
      0,
      shippingInfo?.area || shippingInfo?.city,
    );
    const pricing = calculateOrderPricing({
      items,
      subtotal,
      totalPrice,
      total,
      deliveryCharge,
      deliveryFee,
      couponDiscount,
      totalDiscount,
      deliverySettings,
      area: shippingInfo?.area || shippingInfo?.city,
    });
    const {
      discountAmount,
      finalSubtotal,
      chargeableSubtotal,
      finalTotal,
    } = pricing;
    const calculatedFinalDeliveryCharge = pricing.finalDeliveryCharge;
    
    console.log('💰 Calculated values:', {
      finalSubtotal,
      finalDeliveryCharge: calculatedFinalDeliveryCharge,
      finalTotal,
    });
    
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
        details: {
          hasName: Boolean(shipping.name),
          hasPhone: Boolean(shipping.phone),
          hasItems: Boolean(items),
          finalTotal,
        },
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items array is required and cannot be empty',
      });
    }

    if (
      calculatedFinalDeliveryCharge > 0 &&
      !['bKash', 'Nagad'].includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please pay the delivery fee with bKash or Nagad before placing this order',
        details: {
          paymentMethod,
          requiredDeliveryFee: calculatedFinalDeliveryCharge,
          chargeableSubtotal,
        },
      });
    }

    if (calculatedFinalDeliveryCharge > 0 && (!transactionId?.trim() || !senderNumber?.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and sender number are required for delivery fee payment',
        details: {
          hasTransactionId: Boolean(transactionId?.trim()),
          hasSenderNumber: Boolean(senderNumber?.trim()),
          requiredDeliveryFee: calculatedFinalDeliveryCharge,
        },
      });
    }

    if (finalTotal < calculatedFinalDeliveryCharge) {
      return res.status(400).json({
        success: false,
        message: 'Total amount cannot be less than delivery fee',
        details: {
          finalTotal,
          requiredDeliveryFee: calculatedFinalDeliveryCharge,
        },
      });
    }

    if (transactionId?.trim()) {
      const existingTransaction = await Order.findOne({
        $or: [
          { transactionId: transactionId.trim() },
          { 'advancePayment.transactionId': transactionId.trim() },
          { 'paymentInfo.transactionId': transactionId.trim() },
          { 'payment.advance.transactionId': transactionId.trim() },
        ],
      });

      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already used',
          details: {
            transactionId: transactionId.trim(),
          },
        });
      }
    }

    const deliveryPaymentMethod =
      calculatedFinalDeliveryCharge > 0 ? paymentMethod : 'COD';
    const initialDeliveryPaymentStatus =
      calculatedFinalDeliveryCharge > 0 ? 'pending' : 'confirmed';
    const initialOrderStatus =
      calculatedFinalDeliveryCharge > 0 ? 'pending' : 'confirmed';

    // Generate unique order code
    const orderCode = await generateOrderCode(Order);

    // Resolve User ID securely bridging Firebase to Mongo DB
    let realUserId = null;
    if (req.user?.uid) {
      if (isValidObjectId(req.user.uid)) {
        realUserId = req.user.uid;
      } else if (req.app?.locals?.models?.User) {
        const userDbRecord = await req.app.locals.models.User.findByFirebaseUid(req.user.uid);
        if (userDbRecord && userDbRecord._id) {
          realUserId = userDbRecord._id;
        }
      }
    } else if (req.user?._id && isValidObjectId(req.user._id)) {
      realUserId = req.user._id;
    }

    // Create order using unified schema properties
    const orderData = {
      orderCode,
      user: realUserId,
      firebaseUid: req.user?.uid || null,
      orderItems: items,
      shippingInfo: shipping,
      paymentInfo: {
        method: deliveryPaymentMethod,
        transactionId: transactionId?.trim() || null,
        status: calculatedFinalDeliveryCharge > 0 ? 'Pending' : 'Confirmed',
      },
      advancePayment: {
        method: deliveryPaymentMethod,
        amount: calculatedFinalDeliveryCharge,
        transactionId: transactionId?.trim() || null,
        status: calculatedFinalDeliveryCharge > 0 ? 'Pending' : 'Confirmed',
      },
      totalAmount: finalTotal,
      deliveryFee: calculatedFinalDeliveryCharge,
      paidAmount: calculatedFinalDeliveryCharge,
      dueAmount: finalTotal - calculatedFinalDeliveryCharge,
      transactionId: transactionId?.trim() || null,
      senderNumber: senderNumber?.trim() || '',
      receiverNumber: receiverNumber?.trim() || '',
      deliveryPaymentStatus: initialDeliveryPaymentStatus,
      totalPrice: finalTotal,
      subtotal: finalSubtotal,
      couponDiscount: discountAmount,
      totalDiscount: discountAmount,
      deliveryCharge: calculatedFinalDeliveryCharge,
      orderStatus: initialOrderStatus,
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
        discount: discountAmount,
        deliveryFee: calculatedFinalDeliveryCharge,
        total: finalTotal,
        remainingAmount: finalTotal - calculatedFinalDeliveryCharge,
      },
      payment: {
        advance: {
          status: calculatedFinalDeliveryCharge > 0 ? 'Pending' : 'Confirmed',
          method: deliveryPaymentMethod,
          amount: calculatedFinalDeliveryCharge,
          transactionId: transactionId?.trim() || null,
          senderNumber: senderNumber?.trim() || '',
          receiverNumber: receiverNumber?.trim() || '',
        },
        remaining: { status: 'Pending', method: 'COD', amount: finalTotal - calculatedFinalDeliveryCharge },
        paymentStatus: 'partial',
      },
      order: {
        status: initialOrderStatus,
      }
    };

    const order = await Order.create(orderData);

    await notifyAdmins(req, {
      title: 'New order placed',
      message: `Order #${getOrderIdentifier(order)} is waiting for delivery payment verification.`,
      type: 'order_created',
      link: '/admin/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

    await notifyOrderCustomer(req, order, {
      title: 'Order placed successfully',
      message:
        calculatedFinalDeliveryCharge > 0
          ? `Your order #${getOrderIdentifier(order)} was placed. Delivery payment is pending admin verification.`
          : `Your order #${getOrderIdentifier(order)} was placed successfully.`,
      type: 'order_created',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

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
    const Order = getOrderModel(req);
    console.log('📋 getAllOrders called');
    const { status, paymentStatus, deliveryPaymentStatus, page = 1, limit = 10 } = req.query;

    // Build filter gracefully considering both structures
    const filter = {};
    if (status) {
      filter.$or = [{ orderStatus: status }, { 'order.status': status }];
    }
    if (paymentStatus) {
      filter.$or = [{ 'paymentInfo.status': paymentStatus }, { 'payment.status': paymentStatus }];
    }
    if (deliveryPaymentStatus) {
      filter.deliveryPaymentStatus = deliveryPaymentStatus;
    }

    const skip = (page - 1) * limit;

    console.log('🔍 Fetching orders with filter:', filter);
    const orders = await Order.findAll(filter, {
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit),
    });

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

// Get pending delivery fee payments (Admin)
exports.getPendingDeliveryPayments = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const orders = await Order.findAll(
      { deliveryPaymentStatus: 'pending' },
      { sort: { createdAt: -1 } },
    );

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get pending delivery payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending delivery payments',
      error: error.message,
    });
  }
};

exports.confirmDeliveryPayment = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.deliveryPaymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm payment. Current status: ${order.deliveryPaymentStatus}`,
      });
    }

    order.deliveryPaymentStatus = 'confirmed';
    order.orderStatus = 'confirmed';
    order.paymentInfo = {
      ...(order.paymentInfo || {}),
      status: 'Confirmed',
    };
    order.advancePayment = {
      ...(order.advancePayment || {}),
      status: 'Confirmed',
      confirmedAt: new Date(),
      confirmedBy: req.dbUser?._id,
    };
    order.payment = {
      ...(order.payment || {}),
      advance: {
        ...(order.payment?.advance || {}),
        status: 'Confirmed',
        confirmedAt: new Date(),
      },
    };
    order.order = {
      ...(order.order || {}),
      status: 'confirmed',
    };
    order.admin = {
      ...(order.admin || {}),
      confirmedBy: req.dbUser?._id,
      confirmedAt: new Date(),
    };

    await Order.save(order);

    await notifyOrderCustomer(req, order, {
      title: 'Delivery payment confirmed',
      message: `Your delivery payment for order #${getOrderIdentifier(order)} has been confirmed.`,
      type: 'payment_confirmed',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

    res.status(200).json({
      success: true,
      message: 'Delivery payment confirmed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Confirm delivery payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm delivery payment',
      error: error.message,
    });
  }
};

exports.rejectDeliveryPayment = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const { id } = req.params;
    const { reason } = req.body;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.deliveryPaymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject payment. Current status: ${order.deliveryPaymentStatus}`,
      });
    }

    order.deliveryPaymentStatus = 'rejected';
    order.paymentInfo = {
      ...(order.paymentInfo || {}),
      status: 'Rejected',
    };
    order.advancePayment = {
      ...(order.advancePayment || {}),
      status: 'Rejected',
    };
    order.payment = {
      ...(order.payment || {}),
      advance: {
        ...(order.payment?.advance || {}),
        status: 'Rejected',
        rejectionReason: reason || 'Delivery payment rejected by admin',
      },
    };
    order.admin = {
      ...(order.admin || {}),
      rejectedBy: req.dbUser?._id,
      rejectedAt: new Date(),
    };

    await Order.save(order);

    await notifyOrderCustomer(req, order, {
      title: 'Delivery payment rejected',
      message: `Your delivery payment for order #${getOrderIdentifier(order)} was rejected. Please contact support or submit the correct payment.`,
      type: 'payment_rejected',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

    res.status(200).json({
      success: true,
      message: 'Delivery payment rejected successfully',
      data: order,
    });
  } catch (error) {
    console.error('Reject delivery payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject delivery payment',
      error: error.message,
    });
  }
};

// Get user's own orders
exports.getUserOrders = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const { page = 1, limit = 10 } = req.query;
    const userEmail = req.user?.email;
    
    // Resolve User ID securely bridging Firebase to Mongo DB
    let realUserId = null;
    if (req.user?.uid) {
      if (isValidObjectId(req.user.uid)) {
        realUserId = req.user.uid;
      } else if (req.app?.locals?.models?.User) {
        const userDbRecord = await req.app.locals.models.User.findByFirebaseUid(req.user.uid);
        if (userDbRecord && userDbRecord._id) {
          realUserId = userDbRecord._id;
        }
      }
    } else if (req.user?._id && isValidObjectId(req.user._id)) {
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
    const realUserObjectId = realUserId && isValidObjectId(realUserId)
      ? new ObjectId(realUserId)
      : realUserId;
    
    // Look for user ID, Firebase UID, or any legacy email field used by older checkout flows.
    const filter = {
      $or: [
        realUserObjectId ? { user: realUserObjectId } : null,
        req.user?.uid ? { firebaseUid: req.user.uid } : null,
        req.user?.uid ? { userId: req.user.uid } : null,
        userEmail ? { 'shippingInfo.email': userEmail } : null,
        userEmail ? { 'customer.email': userEmail } : null,
        userEmail ? { customerEmail: userEmail } : null,
        userEmail ? { userEmail } : null,
        userEmail ? { email: userEmail } : null,
        userEmail ? { 'billingInfo.email': userEmail } : null,
      ].filter(Boolean)
    };

    const orders = await Order.findAll(filter, {
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit),
    });

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
    const Order = getOrderModel(req);
    const { id } = req.params;

    const order = await Order.findById(id);

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
    const Order = getOrderModel(req);
    const { id } = req.params;
    const { transactionId, adminId } = req.body;

    console.log('🔐 confirmAdvancePayment called:', { orderId: id, transactionId, adminId });

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

    // Get the actual MongoDB user ID from the request (set by verifyAdmin middleware)
    const actualAdminId = req.dbUser?._id || adminId;
    console.log('👤 Admin ID:', { provided: adminId, actual: actualAdminId });

    // Update order with new structure
    if (order.advancePayment) {
      order.advancePayment.transactionId = transactionId;
      order.advancePayment.status = 'Confirmed';
      order.advancePayment.confirmedAt = new Date();
      order.advancePayment.confirmedBy = actualAdminId;
    }
    
    // Also update legacy structure for backward compatibility
    if (order.payment?.advance) {
      order.payment.advance.transactionId = transactionId;
      order.payment.advance.status = 'Confirmed';
      order.payment.advance.confirmedAt = new Date();
      order.payment.advance.confirmedBy = actualAdminId;
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
    order.admin.confirmedBy = actualAdminId;
    order.admin.confirmedAt = new Date();

    await Order.save(order);

    console.log('✅ Advance payment confirmed successfully');

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
    console.error('❌ Confirm advance payment error:', error);
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
    const Order = getOrderModel(req);
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

    await Order.save(order);

    await notifyOrderCustomer(req, order, {
      title: 'Remaining payment submitted',
      message: `Your remaining payment for order #${getOrderIdentifier(order)} is pending admin confirmation.`,
      type: 'payment_submitted',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode, method },
    });

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
    const Order = getOrderModel(req);
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

    await Order.save(order);

    await notifyOrderCustomer(req, order, {
      title: 'Remaining payment confirmed',
      message: `Your remaining payment for order #${getOrderIdentifier(order)} has been confirmed.`,
      type: 'payment_confirmed',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

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
    const Order = getOrderModel(req);
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

    await Order.save(order);

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
    const Order = getOrderModel(req);
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

    await Order.save(order);

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
    const Order = getOrderModel(req);
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

    await Order.save(order);

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
    const Order = getOrderModel(req);
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

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

    if (status.toString().toLowerCase() === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    if (
      ['cancelled', 'canceled'].includes(status.toString().toLowerCase()) &&
      !order.cancelledAt
    ) {
      order.cancelledAt = new Date();
    }
    
    if (order.order) {
      order.order.status = status;
      order.order.notes = notes || order.order.notes;
    } else {
      order.order = { status, notes };
    }

    await Order.save(order);

    await notifyOrderCustomer(req, order, {
      title: 'Order status updated',
      message: `Your order #${getOrderIdentifier(order)} is now ${status}.`,
      type: 'order_status',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode, status },
    });

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

// Cancel order (User/Admin)
exports.cancelOrder = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const currentStatus = order.orderStatus || order.status || 'pending';
    if (['shipped', 'delivered', 'cancelled'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${currentStatus}`,
      });
    }

    const User = req.app.locals.models.User;
    const dbUser = req.user?.uid ? await User.findByFirebaseUid(req.user.uid) : null;
    const isOwner =
      dbUser?._id?.toString() === order.user?.toString() ||
      req.user?.email === order.shippingInfo?.email ||
      req.user?.email === order.customer?.email;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own orders',
      });
    }

    const updatedOrder = await Order.updateById(id, {
      $set: {
        orderStatus: 'cancelled',
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    await notifyAdmins(req, {
      title: 'Order cancelled',
      message: `Order #${getOrderIdentifier(order)} was cancelled by the customer.`,
      type: 'order_cancelled',
      link: '/admin/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

    await notifyOrderCustomer(req, updatedOrder, {
      title: 'Order cancelled',
      message: `Your order #${getOrderIdentifier(order)} has been cancelled.`,
      type: 'order_cancelled',
      link: '/orders',
      metadata: { orderId: order._id, orderCode: order.orderCode },
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

// Preview delivered order cleanup (Admin)
exports.previewDeliveredOrderCleanup = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const days = parseCleanupDays(req.query.days || 30);

    if (!days) {
      return res.status(400).json({
        success: false,
        message: 'Cleanup retention must be at least 30 days',
      });
    }

    const cutoffDate = getCleanupCutoffDate(days);
    const [count, sampleOrders] = await Promise.all([
      Order.countDeliveredBefore(cutoffDate),
      Order.findDeliveredBefore(cutoffDate, {
        sort: { deliveredAt: 1, updatedAt: 1, createdAt: 1 },
        limit: 5,
        projection: {
          orderCode: 1,
          orderStatus: 1,
          deliveredAt: 1,
          updatedAt: 1,
          createdAt: 1,
          totalAmount: 1,
          totalPrice: 1,
          shippingInfo: 1,
          customer: 1,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        days,
        cutoffDate,
        count,
        sampleOrders,
      },
    });
  } catch (error) {
    console.error('Preview delivered order cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview delivered order cleanup',
      error: error.message,
    });
  }
};

// Delete delivered orders older than retention period (Admin)
exports.deleteDeliveredOrderCleanup = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const days = parseCleanupDays(req.body.days || req.query.days || 30);
    const confirmText = req.body.confirmText || req.query.confirmText;

    if (!days) {
      return res.status(400).json({
        success: false,
        message: 'Cleanup retention must be at least 30 days',
      });
    }

    if (confirmText !== 'DELETE DELIVERED ORDERS') {
      return res.status(400).json({
        success: false,
        message: 'Type DELETE DELIVERED ORDERS to confirm cleanup',
      });
    }

    const cutoffDate = getCleanupCutoffDate(days);
    const ordersToDelete = await Order.findDeliveredBefore(cutoffDate, {
      projection: { _id: 1, orderCode: 1 },
    });
    const orderIds = ordersToDelete.map((order) => order._id);
    const orderIdStrings = orderIds.map((id) => id.toString());

    if (ordersToDelete.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No delivered orders matched the cleanup rule',
        data: { deletedOrders: 0, deletedNotifications: 0, cutoffDate, days },
      });
    }

    const deleteResult = await Order.deleteDeliveredBefore(cutoffDate);
    let deletedNotifications = 0;

    if (req.app.locals.models.AppNotification?.collection) {
      const notificationResult =
        await req.app.locals.models.AppNotification.collection.deleteMany({
          $or: [
            { 'metadata.orderId': { $in: orderIds } },
            { 'metadata.orderId': { $in: orderIdStrings } },
          ],
        });
      deletedNotifications = notificationResult.deletedCount || 0;
    }

    await notifyAdmins(req, {
      title: 'Delivered orders cleaned up',
      message: `${deleteResult.deletedCount || 0} delivered orders older than ${days} days were deleted.`,
      type: 'order_cleanup',
      link: '/admin/orders',
      metadata: {
        days,
        cutoffDate,
        deletedOrders: deleteResult.deletedCount || 0,
        deletedNotifications,
        deletedOrderCodes: ordersToDelete.map((order) => order.orderCode).filter(Boolean),
      },
    });

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount || 0} delivered orders deleted successfully`,
      data: {
        deletedOrders: deleteResult.deletedCount || 0,
        deletedNotifications,
        cutoffDate,
        days,
      },
    });
  } catch (error) {
    console.error('Delete delivered order cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delivered orders',
      error: error.message,
    });
  }
};

// List single-order cleanup candidates (Admin)
exports.getCompletedOrderCleanupCandidates = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const days = parseCleanupDays(req.query.days || 30);
    const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit || '20', 10), 1),
      100,
    );

    if (!days) {
      return res.status(400).json({
        success: false,
        message: 'Cleanup retention must be at least 30 days',
      });
    }

    const cutoffDate = getCleanupCutoffDate(days);
    const [total, orders] = await Promise.all([
      Order.countCompletedBefore(cutoffDate),
      Order.findCompletedBefore(cutoffDate, {
        sort: { deliveredAt: 1, cancelledAt: 1, updatedAt: 1, createdAt: 1 },
        skip: (page - 1) * limit,
        limit,
        projection: {
          orderCode: 1,
          orderStatus: 1,
          status: 1,
          deliveredAt: 1,
          cancelledAt: 1,
          updatedAt: 1,
          createdAt: 1,
          totalAmount: 1,
          totalPrice: 1,
          shippingInfo: 1,
          customer: 1,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        cutoffDate,
        days,
      },
    });
  } catch (error) {
    console.error('Get completed order cleanup candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load cleanup candidates',
      error: error.message,
    });
  }
};

// Delete a single cancelled or delivered order older than 30 days (Admin)
exports.deleteSingleCompletedOrder = async (req, res) => {
  try {
    const Order = getOrderModel(req);
    const { id } = req.params;
    const confirmText = req.body.confirmText || req.query.confirmText;

    if (confirmText !== 'DELETE ORDER') {
      return res.status(400).json({
        success: false,
        message: 'Type DELETE ORDER to confirm',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const cutoffDate = getCleanupCutoffDate(30);
    const eligibility = getCompletedOrderDeleteEligibility(order, cutoffDate);

    if (!eligibility.allowed) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
        data: { cutoffDate },
      });
    }

    const deleteResult = await Order.deleteById(id);
    let deletedNotifications = 0;

    if (req.app.locals.models.AppNotification?.collection) {
      const notificationResult =
        await req.app.locals.models.AppNotification.collection.deleteMany({
          $or: [
            { 'metadata.orderId': order._id },
            { 'metadata.orderId': order._id.toString() },
          ],
        });
      deletedNotifications = notificationResult.deletedCount || 0;
    }

    await notifyAdmins(req, {
      title: 'Order deleted',
      message: `Order #${getOrderIdentifier(order)} was deleted after ${eligibility.status}.`,
      type: 'order_cleanup',
      link: '/admin/orders',
      metadata: {
        orderId: order._id,
        orderCode: order.orderCode,
        deletedNotifications,
        status: eligibility.status,
      },
    });

    res.status(200).json({
      success: true,
      message: `Order #${getOrderIdentifier(order)} deleted successfully`,
      data: {
        deletedOrders: deleteResult.deletedCount || 0,
        deletedNotifications,
        orderId: order._id,
        orderCode: order.orderCode,
      },
    });
  } catch (error) {
    console.error('Delete single order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message,
    });
  }
};

// Get order statistics (Admin)
exports.getOrderStats = async (req, res) => {
  try {
    const Order = getOrderModel(req);
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
