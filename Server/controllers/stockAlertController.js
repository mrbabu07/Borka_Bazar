const stockAlertService = require("../services/stockAlertService");

const getStockAlertModel = (req) => req.app.locals.models.StockAlert;
const getProductModel = (req) => req.app.locals.models.Product;

const attachProducts = async (req, alerts) => {
  const Product = getProductModel(req);
  return Promise.all(
    alerts.map(async (alert) => {
      const productId = alert.productId?.toString?.() || alert.productId;
      const product = productId ? await Product.findById(productId) : null;
      return {
        ...alert,
        productId: product || alert.productId,
      };
    }),
  );
};

// Subscribe to stock alert
exports.subscribeToAlert = async (req, res) => {
  try {
    const StockAlert = getStockAlertModel(req);
    const { productId, alertType, priceThreshold } = req.body;
    const userId = req.user?.uid;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if alert already exists
    const existingAlert = await StockAlert.findOne({
      userId,
      productId,
      alertType,
      active: true,
    });

    if (existingAlert) {
      return res.status(400).json({ message: "Alert already exists" });
    }

    // Create new alert
    const alert = await StockAlert.create({
      userId,
      email,
      productId,
      alertType,
      priceThreshold: alertType === "price_drop" ? priceThreshold : null,
    });

    res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Error subscribing to alert:", error);
    res
      .status(500)
      .json({ message: "Error creating alert", error: error.message });
  }
};

// Unsubscribe from alert
exports.unsubscribeFromAlert = async (req, res) => {
  try {
    const StockAlert = getStockAlertModel(req);
    const { id } = req.params;
    const userId = req.user?.uid;

    const alert = await StockAlert.findById(id);

    if (!alert || alert.userId !== userId) {
      return res.status(404).json({ message: "Alert not found" });
    }

    await StockAlert.updateById(id, { active: false });

    res.json({
      success: true,
      message: "Alert removed successfully",
    });
  } catch (error) {
    console.error("Error unsubscribing from alert:", error);
    res
      .status(500)
      .json({ message: "Error removing alert", error: error.message });
  }
};

// Get user's alerts
exports.getUserAlerts = async (req, res) => {
  try {
    const StockAlert = getStockAlertModel(req);
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const alerts = await StockAlert.findAll({
      userId,
      active: true,
    });

    res.json({
      success: true,
      data: await attachProducts(req, alerts),
    });
  } catch (error) {
    console.error("Error getting user alerts:", error);
    res
      .status(500)
      .json({ message: "Error fetching alerts", error: error.message });
  }
};

// Check and send alerts (Admin only)
exports.checkAndSendAlerts = async (req, res) => {
  try {
    const result = await stockAlertService.checkAllAlerts(req.app.locals.models);

    res.json({
      success: true,
      message: "Alerts checked and sent",
      data: result,
    });
  } catch (error) {
    console.error("Error checking alerts:", error);
    res
      .status(500)
      .json({ message: "Error checking alerts", error: error.message });
  }
};

// Get alert statistics (Admin only)
exports.getAlertStats = async (req, res) => {
  try {
    const StockAlert = getStockAlertModel(req);
    const stats = await StockAlert.aggregate([
      {
        $group: {
          _id: "$alertType",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ["$active", 1, 0] },
          },
          notified: {
            $sum: { $cond: ["$notified", 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting alert stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
};
