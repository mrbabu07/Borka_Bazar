const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  confirmPayment,
  rejectPayment,
  updateOrderStatus,
  getOrderStats,
} = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.post('/create', createOrder);

// User routes (must come before /:id to avoid matching)
router.get('/my-orders', verifyToken, getUserOrders);

// Admin routes (must come before /:id to avoid matching)
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.patch('/:id/confirm-payment', verifyToken, verifyAdmin, confirmPayment);
router.patch('/:id/reject-payment', verifyToken, verifyAdmin, rejectPayment);
router.patch('/:id/update-status', verifyToken, verifyAdmin, updateOrderStatus);
router.get('/stats/overview', verifyToken, verifyAdmin, getOrderStats);

// Generic routes (must come last)
router.get('/:id', getOrderById);

module.exports = router;
