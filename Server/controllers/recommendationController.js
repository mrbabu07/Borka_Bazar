const recommendationService = require("../services/recommendationService");

exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const limit = parseInt(req.query.limit, 10) || 10;
    const models = req.app.locals.models;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const recommendations =
      await recommendationService.getPersonalizedRecommendations(
        models,
        userId,
        limit,
      );

    const productIds = recommendations
      .map((recommendation) =>
        models.Recommendation.toObjectId(recommendation.productId),
      )
      .filter(Boolean);

    const products = await models.Product.collection
      .find({ _id: { $in: productIds } })
      .toArray();

    const productsWithReason = products.map((product) => {
      const recommendation = recommendations.find(
        (item) => item.productId.toString() === product._id.toString(),
      );

      return {
        ...product,
        recommendationReason: recommendation?.reason || "personalized",
      };
    });

    res.json({
      success: true,
      data: productsWithReason,
    });
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    res.status(500).json({
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};

exports.getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 4;

    const recommendations =
      await recommendationService.getFrequentlyBoughtTogether(
        req.app.locals.models,
        productId,
        limit,
      );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error getting frequently bought together:", error);
    res.status(500).json({
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};

exports.getCustomersAlsoViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 6;

    const recommendations = await recommendationService.getCustomersAlsoViewed(
      req.app.locals.models,
      productId,
      limit,
    );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error getting customers also viewed:", error);
    res.status(500).json({
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};

exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 6;

    const recommendations = await recommendationService.getSimilarProducts(
      req.app.locals.models,
      productId,
      limit,
    );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error getting similar products:", error);
    res.status(500).json({
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recommendations = await recommendationService.getTrendingProducts(
      req.app.locals.models,
      limit,
    );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error getting trending products:", error);
    res.status(500).json({
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};
