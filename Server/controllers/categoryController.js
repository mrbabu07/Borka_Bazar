const getAllCategories = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const categories = await Category.findAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const { name, slug, customFields } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    const categoryId = await Category.create({
      name,
      slug,
      customFields: customFields || [],
    });

    res.status(201).json({
      success: true,
      data: { id: categoryId },
      message: "Category created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const removeCustomField = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const { id, fieldId } = req.params;

    const result = await Category.removeCustomField(id, fieldId);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.json({
      success: true,
      message: "Custom field removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const result = await Category.update(req.params.id, req.body);

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, message: "Category updated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const Category = req.app.locals.models.Category;
    const result = await Category.delete(req.params.id);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  removeCustomField,
};
