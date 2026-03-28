/**
 * Fix All Orders - Complete Migration
 *
 * This script fixes ALL issues in existing orders:
 * 1. Recalculates subtotal from actual product prices
 * 2. Fixes delivery charges (always ৳100)
 * 3. Fixes totals (subtotal + delivery - discounts)
 *
 * Run this ONCE after deploying all fixes.
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

// Delivery charge constants
const DELIVERY_CHARGE_BDT = 100; // 100 BDT
const DELIVERY_CHARGE_USD = DELIVERY_CHARGE_BDT / 110; // Convert to USD

async function fixAllOrders() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("Borka_Bazar");
    const ordersCollection = db.collection("orders");

    // Find all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`📦 Found ${orders.length} orders to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      // Calculate subtotal from actual product prices
      let calculatedSubtotal = 0;
      if (order.products && Array.isArray(order.products)) {
        calculatedSubtotal = order.products.reduce((sum, product) => {
          return sum + product.price * product.quantity;
        }, 0);
      }

      // Use calculated subtotal if available, otherwise use stored subtotal
      const correctSubtotal =
        calculatedSubtotal > 0 ? calculatedSubtotal : order.subtotal || 0;
      const storedSubtotal = order.subtotal || 0;
      const totalDiscount = order.totalDiscount || 0;
      const currentDeliveryCharge = order.deliveryCharge || 0;
      const currentTotal = order.total || 0;

      // Always charge delivery
      const correctDeliveryCharge = DELIVERY_CHARGE_USD;

      // Calculate correct total
      const correctTotal =
        correctSubtotal - totalDiscount + correctDeliveryCharge;

      // Check if order needs fixing
      const subtotalNeedsFix =
        Math.abs(storedSubtotal - correctSubtotal) > 0.01;
      const deliveryNeedsFix =
        currentDeliveryCharge < 0 || // Negative delivery
        currentDeliveryCharge === 0 || // Zero delivery
        Math.abs(currentDeliveryCharge - correctDeliveryCharge) > 0.01;

      const totalNeedsFix =
        currentTotal === 0 || // Zero total
        Math.abs(currentTotal - correctTotal) > 0.01;

      if (subtotalNeedsFix || deliveryNeedsFix || totalNeedsFix) {
        console.log(`🔧 Fixing Order ${order._id}:`);

        if (subtotalNeedsFix) {
          console.log(
            `   ❌ Stored Subtotal: $${storedSubtotal.toFixed(2)} (৳${Math.round(storedSubtotal * 110)})`,
          );
          console.log(
            `   ✅ Correct Subtotal: $${correctSubtotal.toFixed(2)} (৳${Math.round(correctSubtotal * 110)})`,
          );
        } else {
          console.log(
            `   Subtotal: $${correctSubtotal.toFixed(2)} (৳${Math.round(correctSubtotal * 110)})`,
          );
        }

        console.log(
          `   Discount: $${totalDiscount.toFixed(2)} (৳${Math.round(totalDiscount * 110)})`,
        );

        if (deliveryNeedsFix) {
          console.log(
            `   ❌ Current Delivery: $${currentDeliveryCharge.toFixed(2)} (৳${Math.round(currentDeliveryCharge * 110)})`,
          );
          console.log(
            `   ✅ Correct Delivery: $${correctDeliveryCharge.toFixed(2)} (৳${Math.round(correctDeliveryCharge * 110)})`,
          );
        } else {
          console.log(
            `   Delivery: $${correctDeliveryCharge.toFixed(2)} (৳${Math.round(correctDeliveryCharge * 110)})`,
          );
        }

        if (totalNeedsFix) {
          console.log(
            `   ❌ Current Total: $${currentTotal.toFixed(2)} (৳${Math.round(currentTotal * 110)})`,
          );
          console.log(
            `   ✅ Correct Total: $${correctTotal.toFixed(2)} (৳${Math.round(correctTotal * 110)})`,
          );
        }

        // Update the order with correct values
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              subtotal: Math.round(correctSubtotal * 100) / 100,
              deliveryCharge: Math.round(correctDeliveryCharge * 100) / 100,
              total: Math.round(correctTotal * 100) / 100,
            },
          },
        );

        console.log(`   ✅ Fixed!\n`);
        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log("=".repeat(60));
    console.log(`✅ Migration Complete!`);
    console.log(`   Fixed: ${fixedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders (already correct)`);
    console.log("=".repeat(60));

    if (fixedCount > 0) {
      console.log("\n💡 What was fixed:");
      console.log("   ✅ Wrong subtotals → Recalculated from products");
      console.log("   ✅ Negative/zero delivery → ৳100");
      console.log("   ✅ Wrong totals → Subtotal + ৳100 - Discounts");
    }

    console.log("\n📝 Next Steps:");
    console.log("   1. Restart your server");
    console.log("   2. Check Orders page");
    console.log("   3. Verify: Subtotal + ৳100 = Total");
  } catch (error) {
    console.error("❌ Error fixing orders:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the migration
fixAllOrders()
  .then(() => {
    console.log("\n🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
