const DeliverySettings = require("../models/DeliverySettings");
const { connectDb } = require("./db");

async function setHighThreshold() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const settings = await new DeliverySettings(connection.db).updateSettings({
      freeDeliveryEnabled: true,
      freeDeliveryThreshold: 100000,
    });

    console.log("Free delivery threshold updated.");
    console.log(`Free delivery threshold: ${settings.freeDeliveryThreshold}`);
  } catch (error) {
    console.error("Error updating delivery threshold:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

setHighThreshold();
