const DeliverySettings = require("../models/DeliverySettings");
const { connectDb } = require("./db");

async function updateDeliverySettings() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const settings = await new DeliverySettings(connection.db).updateSettings({
      freeDeliveryThreshold: 2000,
      standardDeliveryCharge: 100,
      freeDeliveryEnabled: true,
      estimatedDeliveryDays: { min: 2, max: 5 },
    });

    console.log("Delivery settings updated.");
    console.log(`Free delivery threshold: ${settings.freeDeliveryThreshold}`);
    console.log(`Standard delivery charge: ${settings.standardDeliveryCharge}`);
  } catch (error) {
    console.error("Error updating delivery settings:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

updateDeliverySettings();
