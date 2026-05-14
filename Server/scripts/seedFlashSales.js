const FlashSale = require("../models/FlashSale");
const { connectDb } = require("./db");

const templates = [
  { discountPercentage: 50, startsInMinutes: -30, endsInMinutes: 90 },
  { discountPercentage: 45, startsInMinutes: -15, endsInMinutes: 120 },
  { discountPercentage: 40, startsInMinutes: 10, endsInMinutes: 240 },
  { discountPercentage: 35, startsInMinutes: 30, endsInMinutes: 300 },
  { discountPercentage: 55, startsInMinutes: -45, endsInMinutes: 75 },
];

async function seedFlashSales() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const db = connection.db;
    const flashSaleModel = new FlashSale(db);

    const products = await db.collection("products").find({}).limit(8).toArray();
    if (products.length === 0) {
      throw new Error("No products found. Run the product seed first.");
    }

    await db.collection("flashsales").deleteMany({});

    const sales = [];
    for (let index = 0; index < Math.min(products.length, templates.length); index++) {
      const product = products[index];
      const template = templates[index];
      const price = Number(product.price) || 999;
      sales.push(
        await flashSaleModel.create({
          title: `${product.name || product.title || "Product"} Flash Sale`,
          description: "Limited time offer.",
          product: product._id,
          originalPrice: price,
          flashPrice: Math.round(price * (1 - template.discountPercentage / 100)),
          discountPercentage: template.discountPercentage,
          startTime: new Date(Date.now() + template.startsInMinutes * 60000),
          endTime: new Date(Date.now() + template.endsInMinutes * 60000),
          totalStock: 50,
          soldCount: index * 3,
          maxPerUser: 2,
          isActive: true,
        }),
      );
    }

    console.log(`Created ${sales.length} flash sales`);
  } catch (error) {
    console.error("Error seeding flash sales:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

seedFlashSales();
