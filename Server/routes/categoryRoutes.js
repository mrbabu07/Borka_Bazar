const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  removeCustomField,
} = require("../controllers/categoryController");

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/", verifyToken, verifyAdmin, createCategory);
router.put("/:id", verifyToken, verifyAdmin, updateCategory);
router.delete("/:id", verifyToken, verifyAdmin, deleteCategory);
router.delete("/:id/field/:fieldId", verifyToken, verifyAdmin, removeCustomField);

module.exports = router;
