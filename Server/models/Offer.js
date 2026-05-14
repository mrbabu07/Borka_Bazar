const { ObjectId } = require("mongodb");

class Offer {
  constructor(db) {
    this.collection = db.collection("offers");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ isActive: 1, showAsPopup: 1, startDate: 1, endDate: 1 });
      await this.collection.createIndex({ priority: -1, createdAt: -1 });
      await this.collection.createIndex({ couponCode: 1 }, { sparse: true });
    } catch (error) {
      console.error("Error creating Offer indexes:", error);
    }
  }

  toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  }

  normalizeOffer(data = {}, existing = {}) {
    const now = new Date();
    const targetProducts = Array.isArray(data.targetProducts)
      ? data.targetProducts
          .map((id) => this.toObjectId(id) || id)
          .filter(Boolean)
      : existing.targetProducts || [];

    return {
      ...existing,
      ...data,
      title: data.title !== undefined ? String(data.title).trim() : existing.title,
      discountType: data.discountType || existing.discountType || "percentage",
      discountValue:
        data.discountValue !== undefined
          ? Number(data.discountValue)
          : existing.discountValue,
      startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
      endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
      isActive:
        data.isActive !== undefined
          ? data.isActive === true || data.isActive === "true"
          : existing.isActive ?? true,
      showAsPopup:
        data.showAsPopup !== undefined
          ? data.showAsPopup === true || data.showAsPopup === "true"
          : existing.showAsPopup ?? true,
      priority:
        data.priority !== undefined ? Number(data.priority) : existing.priority ?? 0,
      couponCode:
        data.couponCode !== undefined && data.couponCode !== ""
          ? String(data.couponCode).trim().toUpperCase()
          : existing.couponCode,
      targetProducts,
      buttonText: data.buttonText || existing.buttonText || "Shop Now",
      buttonLink: data.buttonLink || existing.buttonLink || "/products",
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
  }

  validate(offer) {
    if (!offer.title) throw new Error("Title is required");
    if (!offer.description) throw new Error("Description is required");
    if (!offer.image) throw new Error("Image is required");
    if (!["percentage", "fixed"].includes(offer.discountType)) {
      throw new Error("Invalid discount type");
    }
    if (!Number.isFinite(offer.discountValue) || offer.discountValue < 0) {
      throw new Error("Discount value must be a positive number");
    }
    if (!(offer.startDate instanceof Date) || Number.isNaN(offer.startDate.getTime())) {
      throw new Error("Start date is required");
    }
    if (!(offer.endDate instanceof Date) || Number.isNaN(offer.endDate.getTime())) {
      throw new Error("End date is required");
    }
    if (offer.startDate >= offer.endDate) {
      throw new Error("End date must be after start date");
    }
  }

  isValid(offer) {
    const now = new Date();
    return offer?.isActive && now >= new Date(offer.startDate) && now <= new Date(offer.endDate);
  }

  async findAll(filter = {}, options = {}) {
    const { sort = { priority: -1, createdAt: -1 }, limit = 0 } = options;
    let cursor = this.collection.find(filter).sort(sort);
    if (limit) cursor = cursor.limit(Number(limit));
    return cursor.toArray();
  }

  async findOne(filter = {}) {
    return this.collection.findOne(filter);
  }

  async findById(id) {
    const _id = this.toObjectId(id);
    if (!_id) return null;
    return this.collection.findOne({ _id });
  }

  async create(data) {
    const offer = this.normalizeOffer(data);
    this.validate(offer);
    const result = await this.collection.insertOne(offer);
    return { ...offer, _id: result.insertedId };
  }

  async updateById(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const offer = this.normalizeOffer(data, existing);
    this.validate(offer);
    const { _id, ...updateData } = offer;

    await this.collection.updateOne({ _id: existing._id }, { $set: updateData });
    return this.findById(existing._id);
  }

  async deleteById(id) {
    const _id = this.toObjectId(id);
    if (!_id) return { deletedCount: 0 };
    return this.collection.deleteOne({ _id });
  }

  async getActivePopupOffers() {
    const now = new Date();
    return this.findAll(
      {
        isActive: true,
        showAsPopup: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      {
        sort: { priority: -1, createdAt: -1 },
        limit: 1,
      },
    );
  }
}

module.exports = Offer;
