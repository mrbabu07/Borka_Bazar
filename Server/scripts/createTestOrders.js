const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

async function createTestOrders() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const orders = db.collection("orders");
    const products = db.collection("products");

    // Get some products
    const productList = await products.find({}).limit(5).toArray();
    console.log(`Found ${productList.length} products`);

    if (productList.length === 0) {
      console.log("No products found to create orders");
      return;
    }

    // Create test orders for different users
    const testOrders = [
      {
        userId: "test-user-1",
        userEmail: "test1@example.com",
        items: [
          {
            productId: productList[0]._id,
            title: productList[0].title,
            price: productList[0].price,
            quantity: 1,
            image: productList[0].image,
          },
        ],
        totalAmount: productList[0].price,
        status: "delivered", // This allows the user to review
        shippingAddress: {
          name: "Test User 1",
          address: "123 Test St",
          city: "Test City",
          zipCode: "12345",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "test-user-2",
        userEmail: "test2@example.com",
        items: [
          {
            productId: productList[1]._id,
            title: productList[1].title,
            price: productList[1].price,
            quantity: 2,
            image: productList[1].image,
          },
        ],
        totalAmount: productList[1].price * 2,
        status: "completed", // This also allows reviews
        shippingAddress: {
          name: "Test User 2",
          address: "456 Test Ave",
          city: "Test City",
          zipCode: "12345",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "test-user-3",
        userEmail: "test3@example.com",
        items: [
          {
            productId: productList[2]._id,
            title: productList[2].title,
            price: productList[2].price,
            quantity: 1,
            image: productList[2].image,
          },
        ],
        totalAmount: productList[2].price,
        status: "pending", // This does NOT allow reviews (not delivered/completed)
        shippingAddress: {
          name: "Test User 3",
          address: "789 Test Blvd",
          city: "Test City",
          zipCode: "12345",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await orders.insertMany(testOrders);
    console.log(`Created ${result.insertedCount} test orders`);

    // Show which users can review which products
    console.log("\nReview eligibility:");
    console.log(
      `- test-user-1 can review product ${productList[0]._id} (status: delivered)`,
    );
    console.log(
      `- test-user-2 can review product ${productList[1]._id} (status: completed)`,
    );
    console.log(
      `- test-user-3 CANNOT review product ${productList[2]._id} (status: pending)`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createTestOrders();
