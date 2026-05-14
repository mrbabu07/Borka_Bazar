class AppNotification {
  constructor(db) {
    this.collection = db.collection("appnotifications");
  }

  async createIndexes() {
    await this.collection.createIndex({ recipientUserId: 1, createdAt: -1 });
    await this.collection.createIndex({ audience: 1, createdAt: -1 });
    await this.collection.createIndex({ read: 1, createdAt: -1 });
  }

  async create(data) {
    const now = new Date();
    const notification = {
      title: data.title || "Notification",
      message: data.message || "",
      type: data.type || "system",
      link: data.link || null,
      audience: data.audience || "user",
      recipientUserId: data.recipientUserId || null,
      recipientEmail: data.recipientEmail || null,
      metadata: data.metadata || {},
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(notification);
    return { ...notification, _id: result.insertedId };
  }

  async findForUser({ userId, email, isAdmin, limit = 30 }) {
    const filters = [];

    if (userId) filters.push({ recipientUserId: userId });
    if (email) filters.push({ recipientEmail: email });
    if (isAdmin) filters.push({ audience: "admin" });

    if (filters.length === 0) return [];

    return this.collection
      .find({ $or: filters })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray();
  }

  async markAsRead(id, filter) {
    const { ObjectId } = require("mongodb");
    const _id = ObjectId.isValid(id) ? new ObjectId(id) : null;
    if (!_id) return null;

    await this.collection.updateOne(
      { _id, ...filter },
      { $set: { read: true, updatedAt: new Date() } },
    );

    return this.collection.findOne({ _id, ...filter });
  }

  async markAllAsRead(filter) {
    return this.collection.updateMany(filter, {
      $set: { read: true, updatedAt: new Date() },
    });
  }
}

module.exports = AppNotification;
