const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  confirmPayment,
  confirmAdvancePayment,
  rejectPayment,
  rejectAdvancePayment,
  payRemaining,
  confirmRemainingPayment,
  updateOrderStatus,
  getOrderStats,
} = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.post('/', createOrder);
router.post('/create', createOrder);

// User routes (must come before /:id to avoid matching)
router.get('/my-orders', verifyToken, getUserOrders);
router.patch('/:id/pay-remaining', verifyToken, payRemaining);

// Admin routes (must come before /:id to avoid matching)
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.patch('/:id/confirm-payment', verifyToken, verifyAdmin, confirmPayment);
router.patch('/:id/confirm-advance-payment', verifyToken, verifyAdmin, confirmAdvancePayment);
router.patch('/:id/reject-payment', verifyToken, verifyAdmin, rejectPayment);
router.patch('/:id/reject-advance-payment', verifyToken, verifyAdmin, rejectAdvancePayment);
router.patch('/:id/confirm-remaining', verifyToken, verifyAdmin, confirmRemainingPayment);
router.patch('/:id/update-status', verifyToken, verifyAdmin, updateOrderStatus);
router.get('/stats/overview', verifyToken, verifyAdmin, getOrderStats);

// Generic routes (must come last)
router.get('/:id', getOrderById);

module.exports = router;
