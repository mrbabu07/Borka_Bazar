const FlashSale = require("../models/FlashSale");
const { connectDb } = require("./db");

async function seedActiveFlashSales() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const db = connection.db;
    const flashSaleModel = new FlashSale(db);

    const products = await db.collection("products").find({}).limit(5).toArray();
    if (products.length === 0) {
      throw new Error("No products found. Run the product seed first.");
    }

    await db.collection("flashsales").deleteMany({});

    const sales = [];
    for (const [index, product] of products.entries()) {
      const price = Number(product.price) || 999;
      sales.push(
        await flashSaleModel.create({
          title: `${product.name || product.title || "Product"} Active Deal`,
          description: "Active flash sale for testing.",
          product: product._id,
          originalPrice: price,
          flashPrice: Math.round(price * 0.5),
          discountPercentage: 50,
          startTime: new Date(Date.now() - 10 * 60000),
          endTime: new Date(Date.now() + (2 + index) * 60 * 60000),
          totalStock: 50,
          soldCount: index * 4,
          maxPerUser: 2,
          isActive: true,
        }),
      );
    }

    console.log(`Created ${sales.length} active flash sales`);
  } catch (error) {
    console.error("Error seeding active flash sales:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

seedActiveFlashSales();
