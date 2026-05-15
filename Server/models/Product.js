const { ObjectId } = require("mongodb");

class Product {
  constructor(db) {
    this.collection = db.collection("products");
    this.createIndexes();
  }

  async createIndexes() {
    try {
      await this.collection.createIndex({ sku: 1 }, { unique: true, sparse: true });
      await this.collection.createIndex({ title: "text", name: "text", sku: "text" });
    } catch (error) {
      console.error("Error creating Product indexes:", error);
    }
  }

  normalizeSku(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  getSkuPrefix(productData = {}) {
    const source =
      productData.title ||
      productData.name ||
      productData.categoryId ||
      "PRODUCT";
    const words = String(source)
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const prefix = words
      .slice(0, 2)
      .map((word) => word.slice(0, 4))
      .join("-");

    return prefix || "PRD";
  }

  generateSku(productData = {}, id = new ObjectId()) {
    const manualSku = this.normalizeSku(productData.sku);
    if (manualSku) return manualSku;

    return `BB-${this.getSkuPrefix(productData)}-${id.toString().slice(-6).toUpperCase()}`;
  }

  async ensureSku(product) {
    if (!product || product.sku) return product;

    const sku = this.generateSku(product, product._id);
    await this.collection.updateOne(
      { _id: product._id },
      { $set: { sku, updatedAt: new Date() } },
    );

    return { ...product, sku };
  }

  async ensureMissingSkus(limit = 100) {
    const products = await this.collection
      .find({
        $or: [{ sku: { $exists: false } }, { sku: "" }, { sku: null }],
      })
      .limit(limit)
      .toArray();

    await Promise.all(products.map((product) => this.ensureSku(product)));
  }

  async findAll(filter = {}) {
    await this.ensureMissingSkus();
    return await this.collection.find(filter).toArray();
  }

  async findOne(filter = {}) {
    return await this.collection.findOne(filter);
  }

  async findWithFilters(filters = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      sizes,
      colors,
      inStock,
      search,
      fabric,
      style,
      occasion,
      sleeveType,
      sortBy = "createdAt",
      sortOrder = -1,
      limit = 20,
      skip = 0,
    } = filters;

    // Build MongoDB query
    const query = {};

    await this.ensureMissingSkus();

    // Only show active products by default
    query.isActive = { $ne: false };

    // Category filter
    if (category) {
      query.categoryId = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Stock filter - check availableSizes array
    if (inStock) {
      query["availableSizes.stock"] = { $gt: 0 };
    }

    // Size filter - check availableSizes array
    if (sizes && sizes.length > 0) {
      query["availableSizes.size"] = { $in: sizes };
    }

    // Color filter (Burka-specific)
    if (colors && colors.length > 0) {
      query.color = { $in: colors };
    }

    // Fabric filter (Burka-specific)
    if (fabric) {
      query.fabric = { $regex: fabric, $options: "i" };
    }

    // Style filter (Burka-specific)
    if (style) {
      query.style = style;
    }

    // Occasion filter (Burka-specific)
    if (occasion) {
      query.occasion = occasion;
    }

    // Sleeve Type filter (Burka-specific)
    if (sleeveType) {
      query.sleeveType = { $regex: sleeveType, $options: "i" };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { "variants.sku": { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { fabric: { $regex: search, $options: "i" } },
        { style: { $regex: search, $options: "i" } },
      ];
    }

    // Rating filter (requires aggregation with reviews)
    let pipeline = [{ $match: query }];

    // Add rating filter if specified
    if (minRating) {
      pipeline.push(
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "productId",
            as: "reviews",
          },
        },
        {
          $addFields: {
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: "$reviews" }, 0] },
                then: { $avg: "$reviews.rating" },
                else: 0,
              },
            },
          },
        },
        {
          $match: {
            averageRating: { $gte: parseFloat(minRating) },
          },
        },
        {
          $project: {
            reviews: 0, // Remove reviews from output
          },
        },
      );
    }

    // Add sorting
    const sortObj = {};
    sortObj[sortBy] = parseInt(sortOrder);
    pipeline.push({ $sort: sortObj });

    // Add pagination
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    return await this.collection.aggregate(pipeline).toArray();
  }

  async getFilterOptions() {
    const pipeline = [
      {
        $match: { isActive: { $ne: false } },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          allSizes: { $addToSet: "$availableSizes" },
          allColors: { $addToSet: "$color" },
          allFabrics: { $addToSet: "$fabric" },
          allStyles: { $addToSet: "$style" },
          allOccasions: { $addToSet: "$occasion" },
          allSleeveTypes: { $addToSet: "$sleeveType" },
          categories: { $addToSet: "$categoryId" },
        },
      },
    ];

    const result = await this.collection.aggregate(pipeline).toArray();

    if (result.length === 0) {
      return {
        priceRange: { min: 0, max: 0 },
        sizes: [],
        colors: [],
        fabrics: [],
        styles: [],
        occasions: [],
        sleeveTypes: [],
        categories: [],
      };
    }

    const data = result[0];

    // Extract unique sizes from availableSizes array
    const sizes = [
      ...new Set(
        data.allSizes
          .flat()
          .filter(Boolean)
          .map((s) => s.size)
      ),
    ].filter(Boolean);

    // Deduplicate colors, fabrics, styles, occasions, sleeveTypes
    const colors = [...new Set(data.allColors)].filter(Boolean);
    const fabrics = [...new Set(data.allFabrics)].filter(Boolean);
    const styles = [...new Set(data.allStyles)].filter(Boolean);
    const occasions = [...new Set(data.allOccasions)].filter(Boolean);
    const sleeveTypes = [...new Set(data.allSleeveTypes)].filter(Boolean);

    return {
      priceRange: {
        min: data.minPrice || 0,
        max: data.maxPrice || 0,
      },
      sizes,
      colors,
      fabrics,
      styles,
      occasions,
      sleeveTypes,
      categories: data.categories.filter(Boolean),
    };
  }

  async getLowStockProducts(threshold = 10) {
    // Find products where any size has low stock
    return await this.collection
      .find({
        isActive: { $ne: false },
        availableSizes: {
          $elemMatch: {
            stock: { $lte: threshold, $gt: 0 },
          },
        },
      })
      .toArray();
  }

  async getOutOfStockProducts() {
    // Find products where all sizes are out of stock
    return await this.collection
      .find({
        isActive: { $ne: false },
        $or: [
          { availableSizes: { $size: 0 } },
          {
            availableSizes: {
              $not: {
                $elemMatch: { stock: { $gt: 0 } },
              },
            },
          },
        ],
      })
      .toArray();
  }

  async updateStockBulk(updates) {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: new ObjectId(update.productId) },
        update: { $set: { stock: update.stock, updatedAt: new Date() } },
      },
    }));

    return await this.collection.bulkWrite(bulkOps);
  }

  async findById(id) {
    try {
      // Validate ObjectId format
      if (!id || typeof id !== "string" || id.length !== 24) {
        return null;
      }
      const product = await this.collection.findOne({ _id: new ObjectId(id) });
      return await this.ensureSku(product);
    } catch (error) {
      // Handle invalid ObjectId format
      console.error("Invalid ObjectId format:", id, error.message);
      return null;
    }
  }

  async updateVariants(productId, variants) {
    try {
      if (
        !productId ||
        typeof productId !== "string" ||
        productId.length !== 24
      ) {
        throw new Error(`Invalid ObjectId format: ${productId}`);
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(productId) },
        {
          $set: {
            variants: variants,
            updatedAt: new Date(),
          },
        },
      );

      return result;
    } catch (error) {
      console.error("Error updating variants:", error);
      throw error;
    }
  }

  async updateVariantStock(productId, variantId, quantity) {
    try {
      if (
        !productId ||
        typeof productId !== "string" ||
        productId.length !== 24
      ) {
        throw new Error(`Invalid ObjectId format: ${productId}`);
      }

      const result = await this.collection.updateOne(
        {
          _id: new ObjectId(productId),
          "variants._id": variantId,
        },
        {
          $inc: { "variants.$.stock": -quantity },
          $set: { updatedAt: new Date() },
        },
      );

      return result;
    } catch (error) {
      console.error("Error updating variant stock:", error);
      throw error;
    }
  }

  async findByCategory(categoryId) {
    return await this.collection.find({ categoryId }).toArray();
  }

  async create(productData) {
    const now = new Date();
    const _id = new ObjectId();
    const sku = this.generateSku(productData, _id);
    const result = await this.collection.insertOne({
      _id,
      ...productData,
      sku,
      createdAt: productData.createdAt || now,
      updatedAt: productData.updatedAt || now,
    });
    return { ...productData, sku, _id: result.insertedId };
  }

  async update(id, productData) {
    try {
      // Enhanced logging for debugging
      console.log("🔧 Product Model Update:");
      console.log("- ID:", id);
      console.log("- Data Keys:", Object.keys(productData));

      // Validate ObjectId
      if (!id || typeof id !== "string" || id.length !== 24) {
        throw new Error(`Invalid ObjectId format: ${id}`);
      }

      // Create ObjectId
      const objectId = new ObjectId(id);
      console.log("- ObjectId created:", objectId);

      // Prepare update data - exclude immutable fields
      const { _id, __v, createdAt, ...safeData } = productData;
      const updateData = {
        ...safeData,
        sku: this.generateSku(safeData, objectId),
        updatedAt: new Date(),
      };

      console.log("- Update operation starting...");

      const result = await this.collection.updateOne(
        { _id: objectId },
        { $set: updateData },
      );

      console.log("- Update result:", result);
      return result;
    } catch (error) {
      console.error("💥 Product Model Update Error:", error);
      throw error;
    }
  }

  async delete(id) {
    if (!id || typeof id !== "string" || id.length !== 24) {
      throw new Error(`Invalid ObjectId format: ${id}`);
    }
    return await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async incrementViews(id) {
    try {
      // Validate ObjectId format
      if (!id || typeof id !== "string" || id.length !== 24) {
        return null;
      }

      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { views: 1 },
          $set: { updatedAt: new Date() },
        },
      );

      return result;
    } catch (error) {
      console.error("Error incrementing views:", error);
      return null;
    }
  }

  async updateStock(id, quantity) {
    return await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { stock: -quantity } },
    );
  }
}

module.exports = Product;
