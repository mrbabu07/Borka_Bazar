const { connectDb } = require("./db");

async function checkFlashSales() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const db = connection.db;

    const sales = await db.collection("flashsales").find({}).toArray();
    console.log(`Total flash sales: ${sales.length}`);

    const now = new Date();
    const active = sales.filter(
      (sale) =>
        sale.isActive &&
        now >= new Date(sale.startTime) &&
        now <= new Date(sale.endTime) &&
        (sale.soldCount || 0) < sale.totalStock,
    );
    const upcoming = sales.filter(
      (sale) => sale.isActive && now < new Date(sale.startTime),
    );
    const expired = sales.filter((sale) => now > new Date(sale.endTime));
    const soldOut = sales.filter(
      (sale) => (sale.soldCount || 0) >= sale.totalStock,
    );

    console.log(`Active: ${active.length}`);
    console.log(`Upcoming: ${upcoming.length}`);
    console.log(`Expired: ${expired.length}`);
    console.log(`Sold out: ${soldOut.length}`);

    active.forEach((sale) => {
      const minutesLeft = Math.round((new Date(sale.endTime) - now) / 60000);
      console.log(`- ${sale.title} (${minutesLeft} minutes left)`);
    });
  } catch (error) {
    console.error("Error checking flash sales:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

checkFlashSales();
