const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;

async function createTestOrdersForReviews() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Borka_Bazar");
    const orders = db.collection("orders");
    const products = db.collection("products");

    // Get some products to create orders for
    const productList = await products.find({}).limit(3).toArray();
    console.log(`Found ${productList.length} products`);

    if (productList.length === 0) {
      console.log("No products found to create orders");
      return;
    }

    // Create test orders with the correct structure for review testing
    const testOrders = [
      {
        userId: "test-user-1", // This user can review
        userEmail: "test1@example.com",
        products: [
          {
            productId: productList[0]._id,
            title: productList[0].title,
            price: productList[0].price,
            quantity: 1,
            image: productList[0].image,
          },
        ],
        subtotal: productList[0].price,
        total: productList[0].price,
        status: "delivered", // This allows reviews
        shippingInfo: {
          name: "Test User 1",
          email: "test1@example.com",
          phone: "1234567890",
          address: "123 Test St",
          city: "Test City",
          zipCode: "12345",
        },
        paymentMethod: "cash_on_delivery",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "test-user-2", // This user can also review
        userEmail: "test2@example.com",
        products: [
          {
            productId: productList[1]._id,
            title: productList[1].title,
            price: productList[1].price,
            quantity: 2,
            image: productList[1].image,
          },
        ],
        subtotal: productList[1].price * 2,
        total: productList[1].price * 2,
        status: "completed", // This also allows reviews
        shippingInfo: {
          name: "Test User 2",
          email: "test2@example.com",
          phone: "1234567891",
          address: "456 Test Ave",
          city: "Test City",
          zipCode: "12345",
        },
        paymentMethod: "cash_on_delivery",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: "test-user-3", // This user CANNOT review
        userEmail: "test3@example.com",
        products: [
          {
            productId: productList[2]._id,
            title: productList[2].title,
            price: productList[2].price,
            quantity: 1,
            image: productList[2].image,
          },
        ],
        subtotal: productList[2].price,
        total: productList[2].price,
        status: "pending", // This does NOT allow reviews
        shippingInfo: {
          name: "Test User 3",
          email: "test3@example.com",
          phone: "1234567892",
          address: "789 Test Blvd",
          city: "Test City",
          zipCode: "12345",
        },
        paymentMethod: "cash_on_delivery",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Delete existing test orders first
    await orders.deleteMany({
      userId: { $in: ["test-user-1", "test-user-2", "test-user-3"] },
    });
    console.log("Deleted existing test orders");

    const result = await orders.insertMany(testOrders);
    console.log(`Created ${result.insertedCount} test orders`);

    // Show the test scenarios
    console.log("\n=== TEST SCENARIOS ===");
    console.log(
      `✅ test-user-1 CAN review product ${productList[0]._id} (status: delivered)`,
    );
    console.log(
      `✅ test-user-2 CAN review product ${productList[1]._id} (status: completed)`,
    );
    console.log(
      `❌ test-user-3 CANNOT review product ${productList[2]._id} (status: pending)`,
    );

    console.log("\n=== VERIFICATION QUERIES ===");
    console.log("To test manually, use these MongoDB queries:");
    console.log(
      `db.orders.find({"userId": "test-user-1", "products.productId": ObjectId("${productList[0]._id}"), "status": {$in: ["delivered", "completed"]}})`,
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

createTestOrdersForReviews();
