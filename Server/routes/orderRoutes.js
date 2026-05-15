const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getPendingDeliveryPayments,
  getUserOrders,
  getOrderById,
  confirmDeliveryPayment,
  rejectDeliveryPayment,
  confirmPayment,
  confirmAdvancePayment,
  rejectPayment,
  rejectAdvancePayment,
  payRemaining,
  confirmRemainingPayment,
  updateOrderStatus,
  cancelOrder,
  getCompletedOrderCleanupCandidates,
  deleteSingleCompletedOrder,
  previewDeliveredOrderCleanup,
  deleteDeliveredOrderCleanup,
  getOrderStats,
} = require('../controllers/orderController');
const { verifyToken, optionalVerifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.post('/', optionalVerifyToken, createOrder);
router.post('/create', optionalVerifyToken, createOrder);
router.post('/guest', createOrder);

// User routes (must come before /:id to avoid matching)
router.get('/my-orders', verifyToken, getUserOrders);
router.patch('/:id/pay-remaining', verifyToken, payRemaining);
router.post('/:id/cancel', verifyToken, cancelOrder);

// Admin routes (must come before /:id to avoid matching)
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.get('/admin/pending-delivery-payments', verifyToken, verifyAdmin, getPendingDeliveryPayments);
router.get('/admin/order-cleanup-candidates', verifyToken, verifyAdmin, getCompletedOrderCleanupCandidates);
router.get('/admin/cleanup-delivered-preview', verifyToken, verifyAdmin, previewDeliveredOrderCleanup);
router.delete('/admin/cleanup-delivered', verifyToken, verifyAdmin, deleteDeliveredOrderCleanup);
router.delete('/:id/admin-delete', verifyToken, verifyAdmin, deleteSingleCompletedOrder);
router.patch('/:id/confirm-delivery-payment', verifyToken, verifyAdmin, confirmDeliveryPayment);
router.patch('/:id/reject-delivery-payment', verifyToken, verifyAdmin, rejectDeliveryPayment);
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
