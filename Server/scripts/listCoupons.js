const Coupon = require("../models/Coupon");
const { connectDb } = require("./db");

async function listCoupons() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const coupons = await new Coupon(connection.db).findAll();

    if (coupons.length === 0) {
      console.log("No coupons found.");
      return;
    }

    coupons.forEach((coupon, index) => {
      console.log(`${index + 1}. ${coupon.code} - ${coupon.name}`);
      console.log(`   Type: ${coupon.discountType}`);
      console.log(`   Value: ${coupon.discountValue}`);
      console.log(`   Min order: ${coupon.minOrderAmount || 0}`);
      console.log(`   Active: ${coupon.isActive ? "Yes" : "No"}`);
      console.log(`   Used: ${coupon.usedCount || 0}`);
    });
  } catch (error) {
    console.error("Error listing coupons:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

listCoupons();
