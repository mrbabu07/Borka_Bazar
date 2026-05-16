const express = require("express");
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  sendTestNotification,
  sendTestNotificationPublic,
  getVapidPublicKey,
  getInAppNotifications,
  streamNotifications,
  markInAppNotificationRead,
  markAllInAppNotificationsRead,
  deleteInAppNotification,
  deleteAllInAppNotifications,
} = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

// Public routes (no auth required)
router.get("/vapid-public-key", getVapidPublicKey);
router.get("/stream", streamNotifications);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);
router.post("/test", sendTestNotificationPublic); // Public test endpoint

// Protected routes (require authentication)
router.use(verifyToken);

router.get("/preferences", getPreferences);
router.post("/preferences", updatePreferences);
router.get("/in-app", getInAppNotifications);
router.patch("/in-app/read-all", markAllInAppNotificationsRead);
router.delete("/in-app", deleteAllInAppNotifications);
router.patch("/in-app/:id/read", markInAppNotificationRead);
router.delete("/in-app/:id", deleteInAppNotification);
router.post("/test-auth", sendTestNotification); // Authenticated test endpoint

module.exports = router;
