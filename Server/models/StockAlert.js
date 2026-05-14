const { ObjectId } = require("mongodb");

class StockAlert {
  constructor(db) {
    this.collection = db.collection("stockalerts");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ userId: 1, active: 1 });
      await this.collection.createIndex({ productId: 1, alertType: 1, active: 1 });
      await this.collection.createIndex({ notified: 1, active: 1 });
    } catch (error) {
      console.error("Error creating StockAlert indexes:", error);
    }
  }

  toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  }

  normalize(data = {}, existing = {}) {
    const now = new Date();
    return {
      ...existing,
      ...data,
      userId: data.userId || existing.userId,
      email: data.email || existing.email,
      productId:
        data.productId !== undefined
          ? this.toObjectId(data.productId) || data.productId
          : existing.productId,
      alertType: data.alertType || existing.alertType,
      priceThreshold:
        data.priceThreshold !== undefined && data.priceThreshold !== null
          ? Number(data.priceThreshold)
          : data.alertType === "price_drop"
            ? existing.priceThreshold ?? null
            : null,
      notified:
        data.notified !== undefined
          ? Boolean(data.notified)
          : existing.notified ?? false,
      notifiedAt:
        data.notifiedAt !== undefined ? data.notifiedAt : existing.notifiedAt ?? null,
      active:
        data.active !== undefined
          ? Boolean(data.active)
          : existing.active ?? true,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
  }

  validate(alert) {
    if (!alert.userId) throw new Error("User ID is required");
    if (!alert.email) throw new Error("Email is required");
    if (!alert.productId) throw new Error("Product ID is required");
    if (!["back_in_stock", "price_drop", "low_stock"].includes(alert.alertType)) {
      throw new Error("Invalid alert type");
    }
  }

  async findOne(filter = {}) {
    return this.collection.findOne(filter);
  }

  async findById(id) {
    const _id = this.toObjectId(id);
    if (!_id) return null;
    return this.collection.findOne({ _id });
  }

  async findAll(filter = {}, options = {}) {
    const { sort = { createdAt: -1 }, limit = 0 } = options;
    let cursor = this.collection.find(filter).sort(sort);
    if (limit) cursor = cursor.limit(Number(limit));
    return cursor.toArray();
  }

  async create(data) {
    const alert = this.normalize(data);
    this.validate(alert);
    const result = await this.collection.insertOne(alert);
    return { ...alert, _id: result.insertedId };
  }

  async updateById(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const alert = this.normalize(data, existing);
    this.validate(alert);
    const { _id, ...updateData } = alert;
    await this.collection.updateOne({ _id: existing._id }, { $set: updateData });
    return this.findById(existing._id);
  }

  async aggregate(pipeline = []) {
    return this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = StockAlert;
