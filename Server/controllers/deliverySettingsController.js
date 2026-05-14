const getDeliverySettingsModel = (req) => req.app.locals.models.DeliverySettings;

// Get delivery settings
exports.getDeliverySettings = async (req, res) => {
  try {
    const DeliverySettings = getDeliverySettingsModel(req);
    const settings = await DeliverySettings.getSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching delivery settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch delivery settings",
    });
  }
};

// Update delivery settings (Admin only)
exports.updateDeliverySettings = async (req, res) => {
  try {
    const DeliverySettings = getDeliverySettingsModel(req);
    const allowedFields = [
      "freeDeliveryThreshold",
      "standardDeliveryCharge",
      "expressDeliveryCharge",
      "expressDeliveryEnabled",
      "freeDeliveryEnabled",
      "deliveryAreas",
      "estimatedDeliveryDays",
    ];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const settings = await DeliverySettings.updateSettings(updateData);

    res.json({
      success: true,
      message: "Delivery settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating delivery settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update delivery settings",
    });
  }
};

// Calculate delivery charge for an order
exports.calculateDeliveryCharge = async (req, res) => {
  try {
    const DeliverySettings = getDeliverySettingsModel(req);
    const { subtotal, area } = req.body;
    const orderSubtotal = Number(subtotal) || 0;
    const settings = await DeliverySettings.getSettings();

    let deliveryCharge = settings.standardDeliveryCharge;

    // Check for area-specific charges
    if (area && settings.deliveryAreas.length > 0) {
      const areaSettings = settings.deliveryAreas.find(
        (a) => a.name === area && a.enabled,
      );
      if (areaSettings) {
        deliveryCharge = areaSettings.charge;
      }
    }

    // Free delivery is an admin rule and should override standard/area charges.
    if (
      settings.freeDeliveryEnabled &&
      orderSubtotal >= settings.freeDeliveryThreshold
    ) {
      deliveryCharge = 0;
    }

    res.json({
      success: true,
      data: {
        deliveryCharge,
        isFree: deliveryCharge === 0,
        amountNeededForFreeDelivery:
          orderSubtotal < settings.freeDeliveryThreshold
            ? settings.freeDeliveryThreshold - orderSubtotal
            : 0,
      },
    });
  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate delivery charge",
    });
  }
};
