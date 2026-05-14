const { ObjectId } = require("mongodb");

class FlashSale {
  constructor(db) {
    this.collection = db.collection("flashsales");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ status: 1, createdAt: -1 });
      await this.collection.createIndex({ isActive: 1, startTime: 1, endTime: 1 });
      await this.collection.createIndex({ product: 1 });
    } catch (error) {
      console.error("Error creating FlashSale indexes:", error);
    }
  }

  toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  }

  updateStatus(sale) {
    const now = new Date();
    const startTime = new Date(sale.startTime);
    const endTime = new Date(sale.endTime);

    if ((sale.soldCount || 0) >= sale.totalStock) {
      return "sold_out";
    }
    if (now < startTime) {
      return "upcoming";
    }
    if (now > endTime) {
      return "expired";
    }
    return "active";
  }

  isCurrentlyActive(sale) {
    const now = new Date();
    return (
      sale?.isActive &&
      now >= new Date(sale.startTime) &&
      now <= new Date(sale.endTime) &&
      (sale.soldCount || 0) < sale.totalStock
    );
  }

  withComputedFields(sale) {
    if (!sale) return null;
    const status = this.updateStatus(sale);
    return {
      ...sale,
      status,
      remainingStock: Math.max((sale.totalStock || 0) - (sale.soldCount || 0), 0),
    };
  }

  normalizeSale(data = {}, existing = {}) {
    const now = new Date();
    const sale = {
      ...existing,
      ...data,
      title: data.title !== undefined ? String(data.title).trim() : existing.title,
      description:
        data.description !== undefined
          ? String(data.description || "").trim()
          : existing.description || "",
      product:
        data.product !== undefined
          ? this.toObjectId(data.product) || data.product
          : existing.product,
      originalPrice:
        data.originalPrice !== undefined
          ? Number(data.originalPrice)
          : existing.originalPrice,
      flashPrice:
        data.flashPrice !== undefined ? Number(data.flashPrice) : existing.flashPrice,
      discountPercentage:
        data.discountPercentage !== undefined
          ? Number(data.discountPercentage)
          : existing.discountPercentage,
      startTime: data.startTime ? new Date(data.startTime) : existing.startTime,
      endTime: data.endTime ? new Date(data.endTime) : existing.endTime,
      totalStock:
        data.totalStock !== undefined ? Number(data.totalStock) : existing.totalStock,
      soldCount:
        data.soldCount !== undefined ? Number(data.soldCount) : existing.soldCount || 0,
      maxPerUser:
        data.maxPerUser !== undefined ? Number(data.maxPerUser) : existing.maxPerUser || 5,
      isActive:
        data.isActive !== undefined
          ? data.isActive === true || data.isActive === "true"
          : existing.isActive ?? true,
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };

    sale.status = this.updateStatus(sale);
    return sale;
  }

  validate(sale) {
    if (!sale.title) throw new Error("Title is required");
    if (!sale.product) throw new Error("Product is required");
    if (!Number.isFinite(sale.originalPrice) || sale.originalPrice < 0) {
      throw new Error("Original price must be a positive number");
    }
    if (!Number.isFinite(sale.flashPrice) || sale.flashPrice < 0) {
      throw new Error("Flash price must be a positive number");
    }
    if (!Number.isFinite(sale.totalStock) || sale.totalStock < 0) {
      throw new Error("Total stock must be a positive number");
    }
    if (!Number.isFinite(sale.maxPerUser) || sale.maxPerUser < 1) {
      throw new Error("Max per user must be at least 1");
    }
    if (!(sale.startTime instanceof Date) || Number.isNaN(sale.startTime.getTime())) {
      throw new Error("Start time is required");
    }
    if (!(sale.endTime instanceof Date) || Number.isNaN(sale.endTime.getTime())) {
      throw new Error("End time is required");
    }
    if (sale.startTime >= sale.endTime) {
      throw new Error("End time must be after start time");
    }
  }

  async findAll(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      skip = 0,
      limit = 0,
    } = options;
    let cursor = this.collection.find(filter).sort(sort);
    if (skip) cursor = cursor.skip(Number(skip));
    if (limit) cursor = cursor.limit(Number(limit));
    const sales = await cursor.toArray();
    return sales.map((sale) => this.withComputedFields(sale));
  }

  async countDocuments(filter = {}) {
    return this.collection.countDocuments(filter);
  }

  async findById(id) {
    const _id = this.toObjectId(id);
    if (!_id) return null;
    const sale = await this.collection.findOne({ _id });
    return this.withComputedFields(sale);
  }

  async create(data) {
    const sale = this.normalizeSale(data);
    this.validate(sale);
    const result = await this.collection.insertOne(sale);
    return this.findById(result.insertedId);
  }

  async updateById(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const sale = this.normalizeSale(data, existing);
    this.validate(sale);
    const { _id, remainingStock, ...updateData } = sale;
    await this.collection.updateOne({ _id: existing._id }, { $set: updateData });
    return this.findById(existing._id);
  }

  async deleteById(id) {
    const _id = this.toObjectId(id);
    if (!_id) return null;
    const sale = await this.findById(_id);
    if (!sale) return null;
    await this.collection.deleteOne({ _id });
    return sale;
  }

  async recordPurchase(id, quantity = 1) {
    const sale = await this.findById(id);
    if (!sale) return { sale: null, error: "Flash sale not found" };
    if (!this.isCurrentlyActive(sale)) {
      return { sale, error: "Flash sale is not active" };
    }
    if ((sale.soldCount || 0) + quantity > sale.totalStock) {
      return { sale, error: "Not enough stock available" };
    }

    const updatedSale = await this.updateById(id, {
      soldCount: (sale.soldCount || 0) + Number(quantity),
    });

    return { sale: updatedSale };
  }
}

module.exports = FlashSale;
