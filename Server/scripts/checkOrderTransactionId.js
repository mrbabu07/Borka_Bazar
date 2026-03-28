const { MongoClient } = require("mongodb");

async function checkOrderTransactionId() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("Borka_Bazar");

    // Get last 5 orders
    const orders = await db
      .collection("orders")
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log("📦 Last 5 Orders:\n");

    orders.forEach((order, index) => {
      console.log(
        `${index + 1}. Order ID: ${order._id.toString().slice(-8).toUpperCase()}`,
      );
      console.log(`   Payment Method: ${order.paymentMethod || "N/A"}`);
      console.log(`   Transaction ID: ${order.transactionId || "❌ NULL"}`);
      console.log(`   Payment Status: ${order.paymentStatus || "❌ NOT SET"}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log("");
    });

    // Check if any order has transaction ID
    const ordersWithTxn = orders.filter((o) => o.transactionId);
    console.log(`\n📊 Summary:`);
    console.log(`   Total orders checked: ${orders.length}`);
    console.log(`   Orders with transaction ID: ${ordersWithTxn.length}`);
    console.log(
      `   Orders without transaction ID: ${orders.length - ordersWithTxn.length}`,
    );

    if (ordersWithTxn.length === 0) {
      console.log("\n❌ NO ORDERS HAVE TRANSACTION ID!");
      console.log("   This is why you don't see it in admin panel.");
      console.log("   You need to place a NEW order with transaction ID.");
    } else {
      console.log("\n✅ Some orders have transaction ID!");
      console.log("   If you still don't see it, it's a frontend issue.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkOrderTransactionId();
