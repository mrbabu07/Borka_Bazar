const DeliverySettings = require("../models/DeliverySettings");
const { connectDb } = require("./db");

async function checkDeliverySettings() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const settings = await new DeliverySettings(connection.db).getSettings();

    console.log("Current delivery settings:");
    console.log(`Free delivery enabled: ${settings.freeDeliveryEnabled}`);
    console.log(`Free delivery threshold: ${settings.freeDeliveryThreshold}`);
    console.log(`Standard delivery charge: ${settings.standardDeliveryCharge}`);
    console.log(`Express delivery charge: ${settings.expressDeliveryCharge}`);
  } catch (error) {
    console.error("Error checking delivery settings:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

checkDeliverySettings();
