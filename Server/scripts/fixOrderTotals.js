/**
 * Migration Script: Fix Order Totals
 *
 * This script fixes orders that have incorrect totals due to the delivery charge bug.
 * It recalculates the total for each order based on:
 * total = subtotal - totalDiscount + deliveryCharge
 *
 * Run this script once after deploying the delivery charge fix.
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

async function fixOrderTotals() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const ordersCollection = db.collection("orders");

    // Find all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to check`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      const subtotal = order.subtotal || 0;
      const totalDiscount = order.totalDiscount || 0;
      const deliveryCharge = order.deliveryCharge || 0;
      const currentTotal = order.total || 0;

      // Calculate what the total should be
      const correctTotal = subtotal - totalDiscount + deliveryCharge;

      // Check if total needs fixing
      if (Math.abs(currentTotal - correctTotal) > 0.01) {
        console.log(`\n🔧 Fixing Order ${order._id}:`);
        console.log(`   Current Total: $${currentTotal.toFixed(2)}`);
        console.log(`   Correct Total: $${correctTotal.toFixed(2)}`);
        console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
        console.log(`   Discount: $${totalDiscount.toFixed(2)}`);
        console.log(`   Delivery: $${deliveryCharge.toFixed(2)}`);

        // Update the order
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              total: Math.round(correctTotal * 100) / 100,
            },
          },
        );

        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Migration Complete!`);
    console.log(`   Fixed: ${fixedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders (already correct)`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Error fixing order totals:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the migration
fixOrderTotals()
  .then(() => {
    console.log("\n🎉 Migration script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
