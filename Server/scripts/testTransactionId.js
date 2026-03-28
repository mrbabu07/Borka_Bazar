const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

async function testTransactionId() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const ordersCollection = db.collection("orders");

    // Get the most recent order
    const recentOrder = await ordersCollection.findOne(
      {},
      { sort: { createdAt: -1 } },
    );

    if (!recentOrder) {
      console.log("❌ No orders found in database");
      return;
    }

    console.log("\n📦 Most Recent Order:");
    console.log("Order ID:", recentOrder._id.toString());
    console.log("Payment Method:", recentOrder.paymentMethod);
    console.log("Transaction ID:", recentOrder.transactionId || "NULL");
    console.log("Payment Status:", recentOrder.paymentStatus);
    console.log("Created At:", recentOrder.createdAt);

    // Check if transactionId field exists
    if (recentOrder.hasOwnProperty("transactionId")) {
      if (recentOrder.transactionId) {
        console.log("\n✅ Transaction ID is saved:", recentOrder.transactionId);
      } else {
        console.log("\n⚠️ Transaction ID field exists but is NULL");
      }
    } else {
      console.log("\n❌ Transaction ID field does not exist in order");
    }

    // Get all orders with mobile banking payment methods
    const mobileBankingOrders = await ordersCollection
      .find({
        paymentMethod: { $in: ["bkash", "nagad", "rocket"] },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log("\n📱 Recent Mobile Banking Orders:");
    mobileBankingOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ${order._id.toString().slice(-8)}`);
      console.log("   Payment:", order.paymentMethod.toUpperCase());
      console.log("   Transaction ID:", order.transactionId || "NULL");
      console.log("   Status:", order.paymentStatus);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    console.log("\n✅ Connection closed");
  }
}

testTransactionId();
