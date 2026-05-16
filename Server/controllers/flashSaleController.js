const { ObjectId } = require("mongodb");

const getFlashSaleModel = (req) => req.app.locals.models.FlashSale;
const getProductModel = (req) => req.app.locals.models.Product;

const normalizeProductId = (product) => {
  if (!product) return null;
  if (product instanceof ObjectId) return product.toString();
  if (typeof product === "object" && product._id) return product._id.toString();
  return product.toString();
};

const attachProducts = async (req, sales) => {
  const Product = getProductModel(req);
  const list = Array.isArray(sales) ? sales : [sales].filter(Boolean);

  const populated = await Promise.all(
    list.map(async (sale) => {
      const productId = normalizeProductId(sale.product);
      const product = productId ? await Product.findById(productId) : null;
      return {
        ...sale,
        product: product || sale.product,
      };
    }),
  );

  return Array.isArray(sales) ? populated : populated[0] || null;
};

// Get all active flash sales
exports.getActiveFlashSales = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const now = new Date();

    const flashSales = await FlashSale.findAll(
      {
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gte: now },
        $expr: { $lt: ["$soldCount", "$totalStock"] },
      },
      { sort: { endTime: 1 } },
    );

    res.json(await attachProducts(req, flashSales));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching flash sales", error: error.message });
  }
};

// Get upcoming flash sales
exports.getUpcomingFlashSales = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const now = new Date();

    const flashSales = await FlashSale.findAll(
      {
        isActive: true,
        startTime: { $gt: now },
      },
      { sort: { startTime: 1 }, limit: 10 },
    );

    res.json(await attachProducts(req, flashSales));
  } catch (error) {
    res.status(500).json({
      message: "Error fetching upcoming flash sales",
      error: error.message,
    });
  }
};

// Get all flash sales (admin)
exports.getAllFlashSales = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;

    const flashSales = await FlashSale.findAll(query, {
      sort: { createdAt: -1 },
      limit: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const count = await FlashSale.countDocuments(query);

    res.json({
      flashSales: await attachProducts(req, flashSales),
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      total: count,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching flash sales", error: error.message });
  }
};

// Get single flash sale
exports.getFlashSaleById = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const flashSale = await FlashSale.findById(req.params.id);

    if (!flashSale) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    res.json(await attachProducts(req, flashSale));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching flash sale", error: error.message });
  }
};

// Create flash sale (admin)
exports.createFlashSale = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const Product = getProductModel(req);
    const {
      title,
      description,
      product,
      flashPrice,
      startTime,
      endTime,
      totalStock,
      maxPerUser,
    } = req.body;

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: "Product not found" });
    }

    const originalPrice = productDoc.price;
    const numericFlashPrice = Number(flashPrice);
    const discountPercentage = Math.round(
      ((originalPrice - numericFlashPrice) / originalPrice) * 100,
    );

    const flashSale = await FlashSale.create({
      title,
      description,
      product,
      originalPrice,
      flashPrice: numericFlashPrice,
      discountPercentage,
      startTime,
      endTime,
      totalStock,
      maxPerUser: maxPerUser || 5,
    });

    const populatedSale = await attachProducts(req, flashSale);

    if (flashSale.status === "active") {
      try {
        const NotificationService = require("../services/notificationService");

        console.log("Sending flash sale notification:", {
          flashSaleId: flashSale._id,
          title: flashSale.title,
          discountPercentage: flashSale.discountPercentage,
        });

        await NotificationService.sendFlashSaleAlert({
          _id: flashSale._id,
          title: flashSale.title,
          discountPercentage: flashSale.discountPercentage,
          product: productDoc,
        }, null, req.app.locals.models);
      } catch (notificationError) {
        console.error("Failed to send flash sale notification:", notificationError);
      }
    }

    res.status(201).json(populatedSale);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating flash sale", error: error.message });
  }
};

// Update flash sale (admin)
exports.updateFlashSale = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const { id } = req.params;
    const updates = { ...req.body };

    const flashSale = await FlashSale.findById(id);
    if (!flashSale) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    if (updates.flashPrice || updates.originalPrice) {
      const originalPrice = Number(updates.originalPrice || flashSale.originalPrice);
      const flashPrice = Number(updates.flashPrice || flashSale.flashPrice);
      updates.discountPercentage = Math.round(
        ((originalPrice - flashPrice) / originalPrice) * 100,
      );
    }

    const updatedSale = await FlashSale.updateById(id, updates);
    res.json(await attachProducts(req, updatedSale));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating flash sale", error: error.message });
  }
};

// Delete flash sale (admin)
exports.deleteFlashSale = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const result = await FlashSale.deleteById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Flash sale not found" });
    }

    res.json({ message: "Flash sale deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting flash sale", error: error.message });
  }
};

// Record a purchase (called when order is placed)
exports.recordPurchase = async (req, res) => {
  try {
    const FlashSale = getFlashSaleModel(req);
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    const result = await FlashSale.recordPurchase(id, Number(quantity));

    if (!result.sale && result.error === "Flash sale not found") {
      return res.status(404).json({ message: result.error });
    }

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json(await attachProducts(req, result.sale));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error recording purchase", error: error.message });
  }
};
