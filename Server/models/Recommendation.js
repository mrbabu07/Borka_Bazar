const { ObjectId } = require("mongodb");

class Recommendation {
  constructor(db) {
    this.collection = db.collection("recommendations");
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

  normalize(recommendation) {
    if (!recommendation) return null;
    return recommendation;
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1 }, { unique: true });
    await this.collection.createIndex({ lastUpdated: 1 });
  }

  async findOne(filter = {}) {
    return this.normalize(await this.collection.findOne(filter));
  }

  async updateForUser(userId, recommendations = []) {
    const now = new Date();
    const cleanRecommendations = recommendations
      .map((recommendation) => {
        const productId = this.toObjectId(recommendation.productId);
        if (!productId) return null;

        return {
          productId,
          score: Number(recommendation.score) || 0,
          reason: recommendation.reason || "personalized",
        };
      })
      .filter(Boolean);

    await this.collection.updateOne(
      { userId },
      {
        $set: {
          recommendations: cleanRecommendations,
          lastUpdated: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return this.findOne({ userId });
  }
}

module.exports = Recommendation;
