const { MongoClient } = require("mongodb");

async function checkTransactionId() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("Borka_Bazar");
    const order = await db
      .collection("orders")
      .findOne({}, { sort: { createdAt: -1 } });

    if (order) {
      console.log("📦 Latest Order:");
      console.log("Order ID:", order._id.toString().slice(-8).toUpperCase());
      console.log("Payment Method:", order.paymentMethod);
      console.log("Transaction ID:", order.transactionId || "❌ NULL");
      console.log("Payment Status:", order.paymentStatus || "❌ NOT SET");
      console.log("Created At:", order.createdAt);
      console.log("\n" + "=".repeat(50));

      if (order.transactionId) {
        console.log("✅ Transaction ID is present in database!");
      } else {
        console.log("❌ Transaction ID is NULL in database!");
        console.log("\nPossible reasons:");
        console.log("1. Field was not filled in checkout");
        console.log("2. Frontend not sending the data");
        console.log("3. Backend not saving the data");
      }
    } else {
      console.log("No orders found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkTransactionId();
