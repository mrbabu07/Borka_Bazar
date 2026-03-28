const express = require("express");
const router = express.Router();
const {
  getAllOffers,
  getActivePopupOffer,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
} = require("../controllers/offerController");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Public routes
router.get("/active-popup", getActivePopupOffer);

// Admin routes - images now handled via imgBB on frontend
router.get("/", verifyToken, verifyAdmin, getAllOffers);
router.get("/:id", verifyToken, verifyAdmin, getOfferById);
router.post("/", verifyToken, verifyAdmin, createOffer);
router.put("/:id", verifyToken, verifyAdmin, updateOffer);
router.delete("/:id", verifyToken, verifyAdmin, deleteOffer);
router.patch("/:id/toggle", verifyToken, verifyAdmin, toggleOfferStatus);

module.exports = router;
