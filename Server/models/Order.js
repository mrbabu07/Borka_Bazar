const { ObjectId } = require("mongodb");

class Order {
  constructor(db) {
    this.collection = db.collection("orders");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      const existingIndexes = await this.collection.indexes();
      const hasOrderCodeIndex = existingIndexes.some(
        (index) => index.name === "orderCode_1",
      );

      if (!hasOrderCodeIndex) {
        await this.collection.createIndex({ orderCode: 1 });
      }

      await this.collection.createIndex({ user: 1 });
      await this.collection.createIndex({ "shippingInfo.email": 1 });
      await this.collection.createIndex({ "shippingInfo.phone": 1 });
      await this.collection.createIndex({ orderStatus: 1 });
      await this.collection.createIndex({ deliveredAt: -1 });
      await this.collection.createIndex({ deliveryPaymentStatus: 1, createdAt: -1 });
      await this.collection.createIndex({ transactionId: 1 }, { sparse: true });
      await this.collection.createIndex({ "advancePayment.transactionId": 1 }, { sparse: true });
    } catch (error) {
      console.error("Error creating Order indexes:", error);
    }
  }

  toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  }

  normalizeOrder(orderData) {
    const now = new Date();
    return {
      ...orderData,
      user: this.toObjectId(orderData.user) || orderData.user || null,
      orderItems: (orderData.orderItems || []).map((item) => ({
        ...item,
        productId: this.toObjectId(item.productId) || item.productId,
      })),
      createdAt: orderData.createdAt || now,
      updatedAt: now,
    };
  }

  async create(orderData) {
    const order = this.normalizeOrder(orderData);
    const result = await this.collection.insertOne(order);
    return { ...order, _id: result.insertedId };
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
    const {
      sort = { createdAt: -1 },
      skip = 0,
      limit = 0,
      projection,
    } = options;

    let cursor = this.collection.find(filter, projection ? { projection } : {});

    if (sort) cursor = cursor.sort(sort);
    if (skip) cursor = cursor.skip(Number(skip));
    if (limit) cursor = cursor.limit(Number(limit));

    return cursor.toArray();
  }

  async countDocuments(filter = {}) {
    return this.collection.countDocuments(filter);
  }

  getDeliveredBeforeFilter(cutoffDate) {
    const deliveredStatus = /^delivered$/i;

    return {
      $and: [
        {
          $or: [
            { orderStatus: deliveredStatus },
            { status: deliveredStatus },
            { "order.status": deliveredStatus },
          ],
        },
        {
          $or: [
            { deliveredAt: { $lte: cutoffDate } },
            {
              deliveredAt: { $exists: false },
              updatedAt: { $lte: cutoffDate },
            },
            {
              deliveredAt: { $exists: false },
              updatedAt: { $exists: false },
              createdAt: { $lte: cutoffDate },
            },
          ],
        },
      ],
    };
  }

  async findDeliveredBefore(cutoffDate, options = {}) {
    return this.findAll(this.getDeliveredBeforeFilter(cutoffDate), options);
  }

  async countDeliveredBefore(cutoffDate) {
    return this.countDocuments(this.getDeliveredBeforeFilter(cutoffDate));
  }

  async deleteDeliveredBefore(cutoffDate) {
    return this.collection.deleteMany(this.getDeliveredBeforeFilter(cutoffDate));
  }

  async save(order) {
    if (!order?._id) {
      return this.create(order);
    }

    const _id = this.toObjectId(order._id);
    if (!_id) {
      throw new Error("Invalid order id");
    }

    const { _id: ignoredId, ...orderData } = order;
    const updatedOrder = {
      ...orderData,
      updatedAt: new Date(),
    };

    await this.collection.updateOne({ _id }, { $set: updatedOrder });
    return this.findById(_id);
  }

  async updateById(id, update) {
    const _id = this.toObjectId(id);
    if (!_id) return null;

    await this.collection.updateOne(
      { _id },
      {
        ...update,
        $set: {
          ...(update.$set || {}),
          updatedAt: new Date(),
        },
      },
    );

    return this.findById(_id);
  }

  async aggregate(pipeline = []) {
    return this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = Order;
