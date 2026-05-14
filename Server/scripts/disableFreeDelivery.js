const DeliverySettings = require("../models/DeliverySettings");
const { connectDb } = require("./db");

async function disableFreeDelivery() {
  let client;
  try {
    const connection = await connectDb();
    client = connection.client;
    const settingsModel = new DeliverySettings(connection.db);
    const settings = await settingsModel.updateSettings({
      freeDeliveryEnabled: false,
    });

    console.log("Free delivery disabled.");
    console.log(`Standard delivery charge: ${settings.standardDeliveryCharge}`);
  } catch (error) {
    console.error("Error disabling free delivery:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) await client.close();
  }
}

disableFreeDelivery();
