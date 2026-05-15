const Category = require("../models/Category");
const { CORE_CATEGORIES } = require("../utils/coreCategories");
const { connectDb } = require("./db");

async function ensureCoreCategories() {
  let client;

  try {
    const connection = await connectDb();
    client = connection.client;

    const Categories = new Category(connection.db);
    const results = [];

    for (const category of CORE_CATEGORIES) {
      const result = await Categories.upsertBySlug(category);
      results.push({
        slug: category.slug,
        created: result.upsertedCount === 1,
        updated: result.matchedCount === 1,
      });
    }

    console.log("Core categories ready:");
    for (const result of results) {
      console.log(
        `- ${result.slug}: ${result.created ? "created" : "updated/existing"}`,
      );
    }
  } catch (error) {
    console.error("Failed to ensure core categories:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

ensureCoreCategories();
