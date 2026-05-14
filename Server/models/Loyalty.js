const { ObjectId } = require("mongodb");

class Loyalty {
  constructor(db) {
    this.collection = db.collection("loyalties");
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1 }, { unique: true });
    await this.collection.createIndex(
      { referralCode: 1 },
      { unique: true, sparse: true },
    );
  }

  toObjectId(id) {
    if (id instanceof ObjectId) return id;
    if (!id || typeof id !== "string" || id.length !== 24) return null;
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }

  generateReferralCode(userId) {
    return `REF${String(userId).substring(0, 8).toUpperCase()}`;
  }

  getTier(totalEarned = 0) {
    if (totalEarned >= 10000) return "platinum";
    if (totalEarned >= 5000) return "gold";
    if (totalEarned >= 1000) return "silver";
    return "bronze";
  }

  getTierMultiplier(tier = "bronze") {
    switch (tier) {
      case "platinum":
        return 3;
      case "gold":
        return 2;
      case "silver":
        return 1.5;
      default:
        return 1;
    }
  }

  getTierBenefits(tier = "bronze") {
    switch (tier) {
      case "platinum":
        return {
          pointsMultiplier: 3,
          freeShipping: true,
          expressShipping: true,
          birthdayBonus: 5000,
          exclusiveDeals: true,
          personalShopper: true,
          earlyAccess: true,
        };
      case "gold":
        return {
          pointsMultiplier: 2,
          freeShipping: true,
          expressShipping: false,
          birthdayBonus: 2000,
          exclusiveDeals: true,
          personalShopper: false,
          earlyAccess: true,
        };
      case "silver":
        return {
          pointsMultiplier: 1.5,
          freeShipping: true,
          expressShipping: false,
          birthdayBonus: 1000,
          exclusiveDeals: false,
          personalShopper: false,
          earlyAccess: true,
        };
      default:
        return {
          pointsMultiplier: 1,
          freeShipping: false,
          expressShipping: false,
          birthdayBonus: 500,
          exclusiveDeals: false,
          personalShopper: false,
          earlyAccess: false,
        };
    }
  }

  normalize(loyalty) {
    if (!loyalty) return null;

    return {
      points: 0,
      tier: "bronze",
      totalEarned: 0,
      totalRedeemed: 0,
      transactions: [],
      ...loyalty,
    };
  }

  async findOne(filter = {}) {
    return this.normalize(await this.collection.findOne(filter));
  }

  async create(data) {
    const now = new Date();
    const doc = this.normalize({
      ...data,
      points: data.points || 0,
      tier: data.tier || "bronze",
      totalEarned: data.totalEarned || 0,
      totalRedeemed: data.totalRedeemed || 0,
      transactions: data.transactions || [],
      lastTierUpdate: data.lastTierUpdate || now,
      createdAt: now,
      updatedAt: now,
    });

    const result = await this.collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  async updateById(id, update = {}) {
    const objectId = this.toObjectId(id?.toString());
    if (!objectId) return null;

    await this.collection.updateOne(
      { _id: objectId },
      { $set: { ...update, updatedAt: new Date() } },
    );

    return this.findOne({ _id: objectId });
  }

  async addPoints(userId, points, reason, orderId = null) {
    const loyalty = await this.findOne({ userId });
    if (!loyalty) throw new Error("Loyalty account not found");

    const multiplier = this.getTierMultiplier(loyalty.tier);
    const earnedPoints = Math.floor(points * multiplier);
    const totalEarned = loyalty.totalEarned + earnedPoints;
    const nextTier = this.getTier(totalEarned);
    const tierChanged = nextTier !== loyalty.tier;

    const transaction = {
      type: "earned",
      points: earnedPoints,
      reason,
      orderId: this.toObjectId(orderId?.toString()) || orderId || null,
      date: new Date(),
    };

    const update = {
      points: loyalty.points + earnedPoints,
      totalEarned,
      tier: nextTier,
      transactions: [...loyalty.transactions, transaction],
    };

    if (tierChanged) update.lastTierUpdate = new Date();

    const updated = await this.updateById(loyalty._id, update);
    return { loyalty: updated, earnedPoints };
  }

  async redeemPoints(userId, points, reason, orderId = null) {
    const loyalty = await this.findOne({ userId });
    if (!loyalty) throw new Error("Loyalty account not found");
    if (loyalty.points < points) throw new Error("Insufficient points");

    const transaction = {
      type: "redeemed",
      points,
      reason,
      orderId: this.toObjectId(orderId?.toString()) || orderId || null,
      date: new Date(),
    };

    return this.updateById(loyalty._id, {
      points: loyalty.points - points,
      totalRedeemed: loyalty.totalRedeemed + points,
      transactions: [...loyalty.transactions, transaction],
    });
  }

  async countDocuments(filter = {}) {
    return this.collection.countDocuments(filter);
  }

  async aggregate(pipeline = []) {
    return this.collection.aggregate(pipeline).toArray();
  }

  async getLeaderboard(limit = 10) {
    return this.collection
      .find({}, { projection: { email: 1, points: 1, tier: 1, totalEarned: 1 } })
      .sort({ totalEarned: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = Loyalty;
