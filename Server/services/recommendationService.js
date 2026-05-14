const { ObjectId } = require("mongodb");

class RecommendationService {
  toObjectId(id) {
    if (id instanceof ObjectId) return id;
    if (!id || typeof id !== "string" || id.length !== 24) return null;
    try {
      return new ObjectId(id);
    } catch {
      return null;
    }
  }

  async getPersonalizedRecommendations(models, userId, limit = 10) {
    try {
      const recommendations = [];

      const orderHistory = await this.getRecommendationsFromOrderHistory(
        models,
        userId,
      );
      recommendations.push(...orderHistory);

      const browsingHistory = await this.getRecommendationsFromBrowsing(userId);
      recommendations.push(...browsingHistory);

      const trending = await this.getTrendingProducts(models);
      recommendations.push(...trending);

      const uniqueRecommendations = this.deduplicateAndScore(recommendations);
      const limited = uniqueRecommendations.slice(0, limit);

      if (models.Recommendation) {
        await models.Recommendation.updateForUser(userId, limited);
      }

      return limited;
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      return [];
    }
  }

  async getFrequentlyBoughtTogether(models, productId, limit = 4) {
    try {
      const targetId = this.toObjectId(productId);
      const idOptions = [productId];
      if (targetId) idOptions.push(targetId);

      const orders = await models.Order.collection
        .find({
          $or: [
            { "items.product": { $in: idOptions } },
            { "items.productId": { $in: idOptions } },
          ],
        })
        .limit(100)
        .toArray();

      const coOccurrences = {};
      orders.forEach((order) => {
        (order.items || []).forEach((item) => {
          const itemId = (
            item.product ||
            item.productId ||
            item._id ||
            ""
          ).toString();
          if (itemId && itemId !== productId.toString()) {
            coOccurrences[itemId] = (coOccurrences[itemId] || 0) + 1;
          }
        });
      });

      const sortedProducts = Object.entries(coOccurrences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => this.toObjectId(id))
        .filter(Boolean);

      if (sortedProducts.length === 0) return [];

      const products = await models.Product.collection
        .find({ _id: { $in: sortedProducts }, stock: { $gt: 0 } })
        .toArray();

      return products.map((product) => ({
        ...product,
        reason: "bought_together",
      }));
    } catch (error) {
      console.error("Error getting frequently bought together:", error);
      return [];
    }
  }

  async getCustomersAlsoViewed(models, productId, limit = 6) {
    try {
      const product = await models.Product.findById(productId);
      if (!product) return [];

      const categoryField = product.categoryId || product.category;
      if (!categoryField) return [];

      const similarProducts = await models.Product.collection
        .find({
          _id: { $ne: product._id },
          $or: [{ categoryId: categoryField }, { category: categoryField }],
          stock: { $gt: 0 },
        })
        .sort({ views: -1, rating: -1 })
        .limit(limit)
        .toArray();

      return similarProducts.map((product) => ({
        ...product,
        reason: "similar_category",
      }));
    } catch (error) {
      console.error("Error getting customers also viewed:", error);
      return [];
    }
  }

  async getSimilarProducts(models, productId, limit = 6) {
    try {
      const product = await models.Product.findById(productId);
      if (!product) return [];

      const price = Number(product.price) || 0;
      const priceRange = price * 0.3;
      const categoryField = product.categoryId || product.category;

      const baseQuery = {
        _id: { $ne: product._id },
        stock: { $gt: 0 },
      };

      if (price > 0) {
        baseQuery.price = {
          $gte: price - priceRange,
          $lte: price + priceRange,
        };
      }

      if (categoryField) {
        baseQuery.$or = [
          { categoryId: categoryField },
          { category: categoryField },
        ];
      }

      let similarProducts = await models.Product.collection
        .find(baseQuery)
        .sort({ rating: -1, sales: -1 })
        .limit(limit)
        .toArray();

      if (similarProducts.length === 0 && categoryField) {
        similarProducts = await models.Product.collection
          .find({
            _id: { $ne: product._id },
            $or: [{ categoryId: categoryField }, { category: categoryField }],
            stock: { $gt: 0 },
          })
          .sort({ rating: -1, sales: -1 })
          .limit(limit)
          .toArray();
      }

      return similarProducts.map((product) => ({
        ...product,
        reason: categoryField ? "similar_category" : "similar_price",
      }));
    } catch (error) {
      console.error("Error getting similar products:", error);
      return [];
    }
  }

  async getTrendingProducts(models, limit = 10) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingOrders = await models.Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $ifNull: ["$items.product", "$items.productId"] },
            count: { $sum: { $ifNull: ["$items.quantity", 1] } },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

      const productIds = trendingOrders
        .map((item) => this.toObjectId(item._id?.toString()))
        .filter(Boolean);

      if (productIds.length > 0) {
        const products = await models.Product.collection
          .find({ _id: { $in: productIds }, stock: { $gt: 0 } })
          .toArray();

        return products.map((product) => ({
          ...product,
          reason: "trending",
        }));
      }

      return this.getFallbackProducts(models, limit, "popular");
    } catch (error) {
      console.error("Error getting trending products:", error);
      return this.getFallbackProducts(models, limit, "recent");
    }
  }

  async getFallbackProducts(models, limit, reason) {
    try {
      const products = await models.Product.collection
        .find({ stock: { $gt: 0 } })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .toArray();

      return products.map((product) => ({ ...product, reason }));
    } catch (error) {
      console.error("Fallback products failed:", error);
      return [];
    }
  }

  async getRecommendationsFromOrderHistory(models, userId) {
    try {
      const orders = await models.Order.collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      const purchasedCategories = new Set();
      orders.forEach((order) => {
        (order.items || []).forEach((item) => {
          if (item.category) purchasedCategories.add(item.category);
        });
      });

      if (purchasedCategories.size === 0) return [];

      const products = await models.Product.collection
        .find({
          category: { $in: Array.from(purchasedCategories) },
          stock: { $gt: 0 },
        })
        .sort({ rating: -1, sales: -1 })
        .limit(10)
        .toArray();

      return products.map((product) => ({
        productId: product._id,
        score: 8,
        reason: "personalized",
      }));
    } catch (error) {
      console.error("Error getting recommendations from order history:", error);
      return [];
    }
  }

  async getRecommendationsFromBrowsing() {
    return [];
  }

  deduplicateAndScore(recommendations) {
    const productMap = new Map();

    recommendations.forEach((recommendation) => {
      const id = (
        recommendation.productId ||
        recommendation._id ||
        ""
      ).toString();
      if (!id) return;

      if (productMap.has(id)) {
        const existing = productMap.get(id);
        existing.score += recommendation.score || 1;
      } else {
        productMap.set(id, {
          productId: id,
          score: recommendation.score || 1,
          reason: recommendation.reason || "personalized",
        });
      }
    });

    return Array.from(productMap.values()).sort((a, b) => b.score - a.score);
  }
}

module.exports = new RecommendationService();
