const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  getOrCreateUser,
  getUserStatus,
  updateUserProfile,
} = require("../controllers/userController");
const {
  getPreferences,
  updatePreferences,
} = require("../controllers/notificationController");

router.get("/me", verifyToken, getOrCreateUser);
router.patch("/profile", verifyToken, updateUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.patch("/me", verifyToken, updateUserProfile);
router.put("/me", verifyToken, updateUserProfile);
router.get("/status", verifyToken, getUserStatus);
router.get("/notification-preferences", verifyToken, getPreferences);
router.post("/notification-preferences", verifyToken, updatePreferences);

module.exports = router;
