/**
 * Migration Script: Fix Negative Delivery Charges
 *
 * This script fixes orders that have negative delivery charges due to the bug.
 * It recalculates delivery charges based on the order data.
 *
 * Run this script once after deploying the delivery charge fix.
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

// Delivery charge constants (matching the original logic)
const DELIVERY_CHARGE_BDT = 100; // 100 BDT
const DELIVERY_CHARGE_USD = DELIVERY_CHARGE_BDT / 110; // Convert to USD
const FREE_DELIVERY_THRESHOLD_USD = 50; // $50 USD = ৳5,500 BDT

async function fixDeliveryCharges() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const ordersCollection = db.collection("orders");

    // Find orders with negative or zero delivery charges
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to check`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      const subtotal = order.subtotal || 0;
      const totalDiscount = order.totalDiscount || 0;
      const currentDeliveryCharge = order.deliveryCharge || 0;

      // Calculate what delivery charge should be
      const discountedSubtotal = subtotal - totalDiscount;
      const correctDeliveryCharge =
        discountedSubtotal >= FREE_DELIVERY_THRESHOLD_USD
          ? 0
          : DELIVERY_CHARGE_USD;

      // Check if delivery charge needs fixing (negative or significantly wrong)
      const needsFix =
        currentDeliveryCharge < 0 ||
        Math.abs(currentDeliveryCharge - correctDeliveryCharge) > 0.1;

      if (needsFix) {
        console.log(`\n🔧 Fixing Order ${order._id}:`);
        console.log(
          `   Current Delivery: $${currentDeliveryCharge.toFixed(2)} (৳${Math.round(currentDeliveryCharge * 110)})`,
        );
        console.log(
          `   Correct Delivery: $${correctDeliveryCharge.toFixed(2)} (৳${Math.round(correctDeliveryCharge * 110)})`,
        );
        console.log(
          `   Subtotal: $${subtotal.toFixed(2)} (৳${Math.round(subtotal * 110)})`,
        );
        console.log(
          `   Discount: $${totalDiscount.toFixed(2)} (৳${Math.round(totalDiscount * 110)})`,
        );

        // Calculate new total
        const newTotal = subtotal - totalDiscount + correctDeliveryCharge;

        // Update the order
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              deliveryCharge: Math.round(correctDeliveryCharge * 100) / 100,
              total: Math.round(newTotal * 100) / 100,
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
    console.error("❌ Error fixing delivery charges:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the migration
fixDeliveryCharges()
  .then(() => {
    console.log("\n🎉 Migration script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });
