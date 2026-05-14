require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { MongoClient, ServerApiVersion } = require("mongodb");

async function connectDb() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db("Borka_Bazar");
  await db.command({ ping: 1 });

  return { client, db };
}

module.exports = { connectDb };
