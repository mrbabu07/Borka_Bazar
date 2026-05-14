const { ObjectId } = require("mongodb");

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
};

const normalizeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeProductPayload = (body = {}, existingProduct = {}) => {
  const title = (body.title || body.name || existingProduct.title || existingProduct.name || "").trim();
  const images = normalizeArray(body.images).filter(Boolean);
  const image = body.image || images[0] || existingProduct.image || existingProduct.images?.[0] || "";
  const availableSizes = normalizeArray(body.availableSizes)
    .filter((item) => item && item.size)
    .map((item) => ({
      size: String(item.size).trim(),
      stock: Math.max(normalizeNumber(item.stock, 0), 0),
    }));
  const explicitStock = normalizeNumber(body.stock, NaN);
  const stock = Number.isFinite(explicitStock)
    ? Math.max(explicitStock, 0)
    : availableSizes.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const price = normalizeNumber(body.price, NaN);
  const originalPrice = body.originalPrice
    ? normalizeNumber(body.originalPrice, price)
    : price;

  return {
    title,
    name: title,
    price,
    originalPrice,
    image,
    images,
    categoryId: body.categoryId || existingProduct.categoryId || "",
    stock,
    description: body.description || "",
    sizes: normalizeArray(body.sizes).map(String),
    colors: normalizeArray(body.colors),
    sizeChart: body.sizeChart || "",
    variants: normalizeArray(body.variants),
    fabric: body.fabric || "",
    style: body.style || "",
    occasion: body.occasion || "",
    sleeveType: body.sleeveType || "",
    color: body.color || "",
    availableSizes,
    attributes: body.attributes || {},
    isFeatured: normalizeBoolean(body.isFeatured, false),
    isActive: body.isActive === undefined ? true : normalizeBoolean(body.isActive, true),
    views: existingProduct.views || 0,
    updatedAt: new Date(),
  };
};

const getAllProducts = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      sizes,
      colors,
      fabric,
      style,
      occasion,
      sleeveType,
      inStock,
      search,
      sortBy,
      sortOrder,
      page = 1,
      limit = 20,
    } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Prepare filters
    const filters = {
      category,
      minPrice,
      maxPrice,
      minRating,
      sizes: sizes ? sizes.split(",") : undefined,
      colors: colors ? colors.split(",") : undefined,
      fabric,
      style,
      occasion,
      sleeveType,
      inStock: inStock === "true",
      search,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      skip,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined || filters[key] === "") {
        delete filters[key];
      }
    });

    const products = await Product.findWithFilters(filters);

    // Get total count for pagination
    const totalProducts = await Product.findAll(
      category ? { categoryId: category, isActive: { $ne: false } } : { isActive: { $ne: false } },
    );
    const totalCount = totalProducts.length;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const options = await Product.getFilterOptions();
    res.json({ success: true, data: options });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { threshold = 10 } = req.query;
    const products = await Product.getLowStockProducts(parseInt(threshold));
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getOutOfStockProducts = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const products = await Product.getOutOfStockProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching out of stock products:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStockBulk = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: "Updates array is required",
      });
    }

    const result = await Product.updateStockBulk(updates);

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
      message: "Stock updated successfully",
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;

    // Log the request for debugging
    console.log(`🔍 Product request: ${id}`);

    // Validate ObjectId format
    if (!id || typeof id !== "string" || id.length !== 24) {
      console.log(`❌ Invalid ID format: ${id}`);
      return res
        .status(400)
        .json({ success: false, error: "Invalid product ID format" });
    }

    const product = await Product.findById(id);

    if (!product) {
      console.log(`❌ Product not found: ${id}`);
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Increment view count (don't wait for it to complete)
    Product.incrementViews(id).catch((error) => {
      console.error("Failed to increment views:", error);
    });

    console.log(`✅ Product found: ${product.title}`);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const productData = normalizeProductPayload(req.body);

    // Validate required fields
    if (!productData.title || !Number.isFinite(productData.price) || !productData.categoryId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title/name, price, categoryId",
      });
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;

    console.log("🔄 Product Update Request:");
    console.log("- Product ID:", id);

    // Validate ObjectId format
    if (!id || typeof id !== "string" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const updateData = normalizeProductPayload(req.body, existingProduct);

    // Validate required fields
    if (!updateData.title || !Number.isFinite(updateData.price) || !updateData.categoryId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title/name, price, categoryId",
      });
    }

    const result = await Product.update(id, updateData);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    console.log("✅ Product updated successfully");
    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("💥 Product Update Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    const productObjectId = new ObjectId(id);
    const result = await Product.delete(id);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    const cleanupResults = {};
    const cleanupTasks = [
      ["reviews", req.app.locals.db.collection("reviews").deleteMany({
        $or: [{ productId: productObjectId }, { productId: id }],
      })],
      ["wishlists", req.app.locals.db.collection("wishlists").updateMany(
        {},
        {
          $pull: {
            products: productObjectId,
            productIds: productObjectId,
            items: { productId: productObjectId },
          },
        },
      )],
      ["flashsales", req.app.locals.db.collection("flashsales").updateMany(
        {},
        {
          $pull: {
            products: productObjectId,
            productIds: productObjectId,
            targetProducts: productObjectId,
          },
        },
      )],
      ["offers", req.app.locals.db.collection("offers").updateMany(
        {},
        {
          $pull: {
            products: productObjectId,
            productIds: productObjectId,
            targetProducts: productObjectId,
          },
        },
      )],
      ["appnotifications", req.app.locals.db.collection("appnotifications").deleteMany({
        $or: [
          { "metadata.productId": productObjectId },
          { "metadata.productId": id },
        ],
      })],
    ];

    await Promise.all(
      cleanupTasks.map(async ([name, task]) => {
        try {
          const cleanup = await task;
          cleanupResults[name] = {
            deletedCount: cleanup.deletedCount || 0,
            modifiedCount: cleanup.modifiedCount || 0,
          };
        } catch (cleanupError) {
          cleanupResults[name] = { error: cleanupError.message };
        }
      }),
    );

    res.json({
      success: true,
      message: "Product permanently deleted from database",
      data: {
        deletedProduct: {
          id,
          title: existingProduct.title || existingProduct.name,
        },
        cleanup: cleanupResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Search in name, description, fabric, and style
    const products = await Product.findAll({ isActive: { $ne: false } });
    const searchResults = products.filter(
      (product) =>
        product.name?.toLowerCase().includes(q.toLowerCase()) ||
        product.description?.toLowerCase().includes(q.toLowerCase()) ||
        product.fabric?.toLowerCase().includes(q.toLowerCase()) ||
        product.style?.toLowerCase().includes(q.toLowerCase()),
    );

    res.json({ success: true, data: searchResults });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const incrementProductView = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || typeof id !== "string" || id.length !== 24) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid product ID format" });
    }

    const result = await Product.incrementViews(id);

    if (!result || result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, message: "View count incremented" });
  } catch (error) {
    console.error("Error incrementing product view:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProductVariants = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;
    const { variants } = req.body;

    if (!id || typeof id !== "string" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        error: "Variants array is required",
      });
    }

    // Validate and sanitize variants
    const sanitizedVariants = variants.map((variant, index) => ({
      _id: variant._id || `variant_${Date.now()}_${index}`,
      size: variant.size || "",
      color: variant.color || "",
      price: parseFloat(variant.price) || 0,
      stock: parseInt(variant.stock) || 0,
      sku: variant.sku || "",
      image: variant.image || "",
    }));

    const result = await Product.updateVariants(id, sanitizedVariants);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product variants updated successfully",
      data: { variants: sanitizedVariants },
    });
  } catch (error) {
    console.error("Error updating product variants:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getProductVariants = async (req, res) => {
  try {
    const Product = req.app.locals.models.Product;
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.length !== 24) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID format",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product.variants || [],
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getFilterOptions,
  getLowStockProducts,
  getOutOfStockProducts,
  updateStockBulk,
  incrementProductView,
  updateProductVariants,
  getProductVariants,
};
