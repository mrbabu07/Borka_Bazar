const DEFAULT_SETTINGS = {
  standardDeliveryCharge: 100,
  expressDeliveryCharge: 200,
  expressDeliveryEnabled: false,
  freeDeliveryEnabled: false,
  freeDeliveryThreshold: 0,
  deliveryAreas: [],
  estimatedDeliveryDays: {
    min: 2,
    max: 5,
  },
};

class DeliverySettings {
  constructor(db) {
    this.collection = db.collection("deliverysettings");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ singleton: 1 }, { unique: true });
    } catch (error) {
      console.error("Error creating DeliverySettings indexes:", error);
    }
  }

  normalize(settings = {}) {
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      estimatedDeliveryDays: {
        ...DEFAULT_SETTINGS.estimatedDeliveryDays,
        ...(settings.estimatedDeliveryDays || {}),
      },
      deliveryAreas: Array.isArray(settings.deliveryAreas)
        ? settings.deliveryAreas
        : DEFAULT_SETTINGS.deliveryAreas,
    };
  }

  migrateLegacyCurrency(settings) {
    const migrated = { ...settings };
    let changed = false;

    if (migrated.standardDeliveryCharge > 0 && migrated.standardDeliveryCharge < 10) {
      migrated.standardDeliveryCharge = Math.round(migrated.standardDeliveryCharge * 110);
      changed = true;
    }

    if (migrated.expressDeliveryCharge > 0 && migrated.expressDeliveryCharge < 10) {
      migrated.expressDeliveryCharge = Math.round(migrated.expressDeliveryCharge * 110);
      changed = true;
    }

    if (migrated.freeDeliveryThreshold > 0 && migrated.freeDeliveryThreshold < 100) {
      migrated.freeDeliveryThreshold = Math.round(migrated.freeDeliveryThreshold * 110);
      changed = true;
    }

    return { settings: migrated, changed };
  }

  async getSettings() {
    let settings = await this.collection.findOne({ singleton: "delivery-settings" });

    if (!settings) {
      const now = new Date();
      settings = {
        ...DEFAULT_SETTINGS,
        singleton: "delivery-settings",
        createdAt: now,
        updatedAt: now,
      };
      const result = await this.collection.insertOne(settings);
      return { ...settings, _id: result.insertedId };
    }

    const normalized = this.normalize(settings);
    const migration = this.migrateLegacyCurrency(normalized);

    if (migration.changed) {
      console.log("Auto-migrated DeliverySettings from legacy values to BDT:", {
        standardDeliveryCharge: migration.settings.standardDeliveryCharge,
        expressDeliveryCharge: migration.settings.expressDeliveryCharge,
        freeDeliveryThreshold: migration.settings.freeDeliveryThreshold,
      });
      const { _id, ...migrationData } = {
        ...migration.settings,
        updatedAt: new Date(),
      };
      await this.collection.updateOne(
        { singleton: "delivery-settings" },
        { $set: migrationData },
      );
      return this.getSettings();
    }

    return normalized;
  }

  async updateSettings(data = {}) {
    const current = await this.getSettings();
    const now = new Date();
    const updated = this.normalize({
      ...current,
      ...data,
      singleton: "delivery-settings",
      updatedAt: now,
      createdAt: current.createdAt || now,
    });

    const { _id, ...updateData } = updated;

    await this.collection.updateOne(
      { singleton: "delivery-settings" },
      { $set: updateData },
    );

    return this.getSettings();
  }
}

module.exports = DeliverySettings;
