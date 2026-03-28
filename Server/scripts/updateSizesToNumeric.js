require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const dbName = "Borka_Bazar";

// Size mapping from letter to numeric
const sizeMapping = {
  "XS": "38",
  "S": "42",
  "M": "46",
  "L": "50",
  "XL": "54",
  "XXL": "56",
  "XXXL": "60"
};

async function updateSizesToNumeric() {
  const client = new MongoClient(uri);

  try {
    console.log("🔌 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db(dbName);
    const productsCollection = db.collection("products");

    console.log("📦 Updating product sizes to numeric format...\n");

    const products = await productsCollection.find({}).toArray();
    let updatedCount = 0;

    for (const product of products) {
      if (product.availableSizes && product.availableSizes.length > 0) {
        // Convert sizes
        const newSizes = product.availableSizes.map(sizeItem => ({
          size: sizeMapping[sizeItem.size] || sizeItem.size,
          stock: sizeItem.stock
        }));

        await productsCollection.updateOne(
          { _id: product._id },
          {
            $set: {
              availableSizes: newSizes,
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Updated: ${product.title}`);
        console.log(`   Old sizes: ${product.availableSizes.map(s => s.size).join(", ")}`);
        console.log(`   New sizes: ${newSizes.map(s => s.size).join(", ")}\n`);
        updatedCount++;
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Updated ${updatedCount} products`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Show sample
    console.log("📋 Sample product sizes after update:\n");
    const sample = await productsCollection.findOne({});
    if (sample && sample.availableSizes) {
      console.log(`Product: ${sample.title}`);
      console.log(`Sizes: ${sample.availableSizes.map(s => `${s.size} (${s.stock} units)`).join(", ")}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
updateSizesToNumeric()
  .then(() => {
    console.log("\n✨ Size update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
