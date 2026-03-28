const { MongoClient } = require("mongodb");

async function checkLastOrder() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const orders = await db
      .collection("orders")
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (orders.length > 0) {
      console.log("\n📦 Last Order:");
      console.log("Order ID:", orders[0]._id);
      console.log("Payment Method:", orders[0].paymentMethod);
      console.log("Transaction ID:", orders[0].transactionId || "NOT SET");
      console.log("Payment Status:", orders[0].paymentStatus || "NOT SET");
      console.log("Total (USD):", orders[0].total);
      console.log("Total (BDT):", orders[0].total * 110);
      console.log("\nFull Order:");
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log("No orders found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

checkLastOrder();
