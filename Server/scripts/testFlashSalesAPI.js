const FlashSale = require("../models/FlashSale");
const { connectDb } = require("./db");

async function testFlashSalesAPI() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const db = connection.db;
    const flashSaleModel = new FlashSale(db);
    const now = new Date();

    const allSales = await flashSaleModel.findAll();
    const activeSales = await flashSaleModel.findAll({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
      $expr: { $lt: ["$soldCount", "$totalStock"] },
    });
    const upcomingSales = await flashSaleModel.findAll(
      { isActive: true, startTime: { $gt: now } },
      { sort: { startTime: 1 } },
    );

    console.log(`All flash sales: ${allSales.length}`);
    console.log(`Active flash sales: ${activeSales.length}`);
    console.log(`Upcoming flash sales: ${upcomingSales.length}`);

    const product = await db.collection("products").findOne({});
    if (!product) {
      console.log("No products found, skipping create/update/delete test.");
      return;
    }

    const price = Number(product.price) || 999;
    const created = await flashSaleModel.create({
      title: "Test Flash Sale",
      description: "Temporary test sale",
      product: product._id,
      originalPrice: price,
      flashPrice: Math.round(price * 0.5),
      discountPercentage: 50,
      startTime: new Date(Date.now() + 60000),
      endTime: new Date(Date.now() + 3600000),
      totalStock: 10,
      soldCount: 0,
      maxPerUser: 2,
      isActive: true,
    });

    const updated = await flashSaleModel.updateById(created._id, {
      totalStock: 20,
    });
    const purchase = await flashSaleModel.recordPurchase(updated._id, 2);
    await flashSaleModel.deleteById(purchase.sale._id);

    console.log("Create/update/purchase/delete flow passed.");
  } catch (error) {
    console.error("Flash sale test failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

testFlashSalesAPI();
