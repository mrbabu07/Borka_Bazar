const mongoose = require("mongoose");

const deliverySettingsSchema = new mongoose.Schema(
  {
    freeDeliveryThreshold: {
      type: Number,
      required: true,
      default: 2000, // ৳2,000 BDT
    },
    standardDeliveryCharge: {
      type: Number,
      required: true,
      default: 100, // ৳100 BDT
    },
    expressDeliveryCharge: {
      type: Number,
      default: 200, // ৳200 BDT
    },
    expressDeliveryEnabled: {
      type: Boolean,
      default: false,
    },
    freeDeliveryEnabled: {
      type: Boolean,
      default: true,
    },
    deliveryAreas: [
      {
        name: String,
        charge: Number,
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],
    estimatedDeliveryDays: {
      min: {
        type: Number,
        default: 2,
      },
      max: {
        type: Number,
        default: 5,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Ensure only one settings document exists, and auto-migrate legacy USD values
deliverySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
    return settings;
  }

  // Auto-migrate: if values look like USD (< 10), convert to BDT
  let needsSave = false;
  if (settings.standardDeliveryCharge > 0 && settings.standardDeliveryCharge < 10) {
    settings.standardDeliveryCharge = Math.round(settings.standardDeliveryCharge * 110);
    needsSave = true;
  }
  if (settings.expressDeliveryCharge > 0 && settings.expressDeliveryCharge < 10) {
    settings.expressDeliveryCharge = Math.round(settings.expressDeliveryCharge * 110);
    needsSave = true;
  }
  if (settings.freeDeliveryThreshold > 0 && settings.freeDeliveryThreshold < 100) {
    settings.freeDeliveryThreshold = Math.round(settings.freeDeliveryThreshold * 110);
    needsSave = true;
  }
  if (needsSave) {
    console.log('🔄 Auto-migrated DeliverySettings from USD to BDT:', {
      standardDeliveryCharge: settings.standardDeliveryCharge,
      expressDeliveryCharge: settings.expressDeliveryCharge,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
    });
    await settings.save();
  }

  return settings;
};

module.exports = mongoose.model("DeliverySettings", deliverySettingsSchema);
