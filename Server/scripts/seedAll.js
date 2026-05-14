const FlashSale = require("../models/FlashSale");
const StockAlert = require("../models/StockAlert");
const Loyalty = require("../models/Loyalty");
const Recommendation = require("../models/Recommendation");
const { connectDb } = require("./db");

const sampleUsers = [
  { userId: "user123", email: "john@example.com" },
  { userId: "user456", email: "jane@example.com" },
  { userId: "user789", email: "bob@example.com" },
];

async function seedAllData() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const db = connection.db;

    const FlashSales = new FlashSale(db);
    const Alerts = new StockAlert(db);
    const LoyaltyAccounts = new Loyalty(db);
    const Recommendations = new Recommendation(db);

    const products = await db.collection("products").find({}).limit(10).toArray();
    if (products.length === 0) {
      throw new Error("No products found. Run the product seed first.");
    }

    await db.collection("flashsales").deleteMany({});
    await db.collection("stockalerts").deleteMany({});
    await db.collection("loyalties").deleteMany({});
    await db.collection("recommendations").deleteMany({});

    const flashSales = [];
    for (const [index, product] of products.slice(0, 3).entries()) {
      const price = Number(product.price) || 999;
      flashSales.push(
        await FlashSales.create({
          title: `${product.name || product.title || "Product"} Flash Sale`,
          description: "Sample limited time offer.",
          product: product._id,
          originalPrice: price,
          flashPrice: Math.round(price * 0.5),
          discountPercentage: 50,
          startTime: new Date(Date.now() - 30 * 60000),
          endTime: new Date(Date.now() + (90 + index * 30) * 60000),
          totalStock: 50,
          soldCount: index * 5,
          maxPerUser: 2,
          isActive: true,
        }),
      );
    }

    const stockAlerts = [];
    for (const [index, user] of sampleUsers.entries()) {
      stockAlerts.push(
        await Alerts.create({
          userId: user.userId,
          email: user.email,
          productId: products[index % products.length]._id,
          alertType: index === 1 ? "price_drop" : "back_in_stock",
          priceThreshold: index === 1 ? Number(products[index].price || 100) * 0.8 : null,
          active: true,
          notified: false,
        }),
      );
    }

    const loyaltyAccounts = [];
    for (const [index, user] of sampleUsers.entries()) {
      loyaltyAccounts.push(
        await LoyaltyAccounts.create({
          userId: user.userId,
          email: user.email,
          points: [2500, 7500, 15000][index],
          tier: ["silver", "gold", "platinum"][index],
          totalEarned: [5000, 12000, 25000][index],
          totalRedeemed: [2500, 4500, 10000][index],
          referralCode: LoyaltyAccounts.generateReferralCode(user.userId),
          transactions: [
            {
              type: "earned",
              points: 1000,
              reason: "Sample order",
              date: new Date(),
            },
          ],
        }),
      );
    }

    await Recommendations.updateForUser(
      sampleUsers[0].userId,
      products.slice(0, 5).map((product, index) => ({
        productId: product._id,
        score: 10 - index,
        reason: "personalized",
      })),
    );

    console.log("Seed complete:");
    console.log(`Flash sales: ${flashSales.length}`);
    console.log(`Stock alerts: ${stockAlerts.length}`);
    console.log(`Loyalty accounts: ${loyaltyAccounts.length}`);
    console.log("Recommendations: 1 user profile");
  } catch (error) {
    console.error("Error seeding data:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

seedAllData();
