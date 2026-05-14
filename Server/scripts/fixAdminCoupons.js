const { connectDb } = require("./db");

async function fixAdminCoupons() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const coupons = connection.db.collection("coupons");
    const problematicCoupons = await coupons
      .find({ minOrderAmount: { $gt: 100000 } })
      .toArray();

    if (problematicCoupons.length === 0) {
      console.log("No suspicious coupon values found.");
      return;
    }

    for (const coupon of problematicCoupons) {
      await coupons.updateOne(
        { _id: coupon._id },
        {
          $set: {
            minOrderAmount: coupon.minOrderAmount / 100,
            maxDiscountAmount: coupon.maxDiscountAmount
              ? coupon.maxDiscountAmount / 100
              : coupon.maxDiscountAmount,
            discountValue:
              coupon.discountType === "fixed"
                ? coupon.discountValue / 100
                : coupon.discountValue,
            updatedAt: new Date(),
          },
        },
      );
      console.log(`Fixed coupon ${coupon.code}`);
    }
  } catch (error) {
    console.error("Error fixing coupons:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

fixAdminCoupons();
