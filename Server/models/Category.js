const { ObjectId } = require("mongodb");

class Category {
  constructor(db) {
    this.collection = db.collection("categories");
  }

  async findAll() {
    return await this.collection.find({}).toArray();
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findBySlug(slug) {
    return await this.collection.findOne({ slug });
  }

  async create(categoryData) {
    // Auto-generate slug from name if not provided
    const slug =
      categoryData.slug ||
      categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const result = await this.collection.insertOne({
      ...categoryData,
      slug,
      customFields: categoryData.customFields || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertedId;
  }

  async update(id, categoryData) {
    // Exclude immutable fields
    const { _id, __v, createdAt, ...safeData } = categoryData;

    // Auto-generate slug if name changed
    if (safeData.name && !safeData.slug) {
      safeData.slug = safeData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    return await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeData, updatedAt: new Date() } }
    );
  }

  async removeCustomField(categoryId, fieldId) {
    return await this.collection.updateOne(
      { _id: new ObjectId(categoryId) },
      {
        $pull: { customFields: { _id: fieldId } },
        $set: { updatedAt: new Date() },
      }
    );
  }

  async delete(id) {
    return await this.collection.deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = Category;
