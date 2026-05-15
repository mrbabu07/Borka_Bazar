const express = require("express");
const router = express.Router();
const {
  getSocialSettings,
  updateSocialSettings,
} = require("../controllers/socialSettingsController");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

router.get("/", getSocialSettings);
router.put("/", verifyToken, verifyAdmin, updateSocialSettings);

module.exports = router;
