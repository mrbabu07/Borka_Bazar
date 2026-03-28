const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

async function addViewCounts() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const products = db.collection("products");

    // Get all products
    const allProducts = await products.find({}).toArray();
    console.log(`Found ${allProducts.length} products`);

    // Add random view counts to products that don't have views
    const bulkOps = allProducts.map((product) => {
      const randomViews = Math.floor(Math.random() * 500) + 10; // Random views between 10-510
      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              views: product.views || randomViews,
              updatedAt: new Date(),
            },
          },
        },
      };
    });

    const result = await products.bulkWrite(bulkOps);
    console.log(`Updated ${result.modifiedCount} products with view counts`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

addViewCounts();
