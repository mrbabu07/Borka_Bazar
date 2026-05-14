const Coupon = require("../models/Coupon");
const { connectDb } = require("./db");

const coupons = [
  {
    code: "SAVE10",
    name: "10% Off",
    description: "Get 10% off on your order",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 500,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: "WELCOME50",
    name: "Welcome Discount",
    description: "Get 50 taka off on your first order",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 500,
    userUsageLimit: 1,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

async function createTestCoupon() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const couponModel = new Coupon(connection.db);

    for (const coupon of coupons) {
      const existing = await connection.db
        .collection("coupons")
        .findOne({ code: coupon.code });
      if (existing) {
        console.log(`Coupon ${coupon.code} already exists`);
        continue;
      }

      await couponModel.create(coupon);
      console.log(`Created coupon ${coupon.code}`);
    }
  } catch (error) {
    console.error("Error creating coupons:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

createTestCoupon();
