require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const Category = require("./models/Category");
const Order = require("./models/Order");
const Wishlist = require("./models/Wishlist");
const Review = require("./models/Review");
const Coupon = require("./models/Coupon");
const Address = require("./models/Address");
const Return = require("./models/Return");
const Payment = require("./models/Payment");
const SupportTicket = require("./models/SupportTicket");
const LiveChat = require("./models/LiveChat");
const CustomerInsight = require("./models/CustomerInsight");
const Offer = require("./models/Offer");
const NotificationSubscription = require("./models/NotificationSubscription");
const Question = require("./models/Question");
const DeliverySettings = require("./models/DeliverySettings");
const FlashSale = require("./models/FlashSale");
const StockAlert = require("./models/StockAlert");
const Recommendation = require("./models/Recommendation");
const Loyalty = require("./models/Loyalty");
const AppNotification = require("./models/AppNotification");

// Import routes
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const addressRoutes = require("./routes/addressRoutes");
const returnRoutes = require("./routes/returnRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const offerRoutes = require("./routes/offerRoutes");
const supportRoutes = require("./routes/supportRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const flashSaleRoutes = require("./routes/flashSaleRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const stockAlertRoutes = require("./routes/stockAlertRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const questionRoutes = require("./routes/questionRoutes");
const deliverySettingsRoutes = require("./routes/deliverySettingsRoutes");

const app = express();
const port = process.env.PORT || 5000;
const requiredEnv = [
  "MONGO_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const allowedOrigins = [
  ...defaultAllowedOrigins,
  ...(process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
    .filter(Boolean),
];

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add cache control headers for API responses
app.use((req, res, next) => {
  // Disable caching for API routes
  if (req.path.startsWith("/api/")) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });
  }
  next();
});

// MongoDB client
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let server;

const closeMongoClient = async (signal) => {
  console.log(`${signal} received. Closing server and MongoDB connection...`);
  if (server) {
    server.close();
  }
  await client.close();
  process.exit(0);
};

process.on("SIGINT", () => closeMongoClient("SIGINT"));
process.on("SIGTERM", () => closeMongoClient("SIGTERM"));

async function run() {
  try {
    // Connect MongoDB client (for existing models)
    await client.connect();
    await client.db("Borka_Bazar").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully (Borka_Bazar)");

    const db = client.db("Borka_Bazar");

    // Initialize models
    app.locals.models = {
      User: new User(db),
      Product: new Product(db),
      Category: new Category(db),
      Order: new Order(db),
      Wishlist: new Wishlist(db),
      Review: new Review(db),
      Coupon: new Coupon(db),
      Address: new Address(db),
      Return: new Return(db),
      Payment: new Payment(db),
      SupportTicket: new SupportTicket(db),
      LiveChat: new LiveChat(db),
      CustomerInsight: new CustomerInsight(db),
      Offer: new Offer(db),
      NotificationSubscription: new NotificationSubscription(db),
      Question: new Question(db),
      DeliverySettings: new DeliverySettings(db),
      FlashSale: new FlashSale(db),
      StockAlert: new StockAlert(db),
      Recommendation: new Recommendation(db),
      Loyalty: new Loyalty(db),
      AppNotification: new AppNotification(db),
    };

    await Promise.all(
      Object.values(app.locals.models)
        .filter((model) => typeof model.createIndexes === "function")
        .map((model) => model.createIndexes()),
    );

    // Store db reference for controllers that need it
    app.locals.db = db;

    // Routes
    app.get("/", (req, res) => {
      res.json({
        message: "Borka_Bazar API is running 🚀",
        endpoints: {
          products: "/api/products",
          categories: "/api/categories",
          orders: "/api/orders",
          user: "/api/user",
          wishlist: "/api/wishlist",
          reviews: "/api/reviews",
          coupons: "/api/coupons",
          addresses: "/api/addresses",
          returns: "/api/returns",
          payments: "/api/payments",
          support: "/api/support",
          userManagement: "/api/admin",
        },
      });
    });

    console.log("🔧 Registering routes...");

    app.use("/api/products", productRoutes);
    console.log("✅ Products routes registered");

    app.use("/api/categories", categoryRoutes);
    console.log("✅ Categories routes registered");

    app.use("/api/orders", orderRoutes);
    console.log("✅ Orders routes registered");

    app.use("/api/user", userRoutes);
    console.log("✅ User routes registered");

    app.use("/api/wishlist", wishlistRoutes);
    console.log("✅ Wishlist routes registered");

    app.use("/api/reviews", reviewRoutes);
    console.log("✅ Reviews routes registered");

    app.use("/api/coupons", couponRoutes);
    console.log("✅ Coupons routes registered");

    app.use("/api/addresses", addressRoutes);
    console.log("✅ Addresses routes registered");

    app.use("/api/returns", returnRoutes);
    console.log("✅ Returns routes registered");
    app.use("/api/payments", paymentRoutes);
    console.log("✅ Payments routes registered");
    app.use("/api/offers", offerRoutes);
    console.log("✅ Offers routes registered");

    app.use("/api/support", supportRoutes);
    console.log("✅ Support routes registered");

    app.use("/api/admin", userManagementRoutes);
    console.log("✅ User Management routes registered");

    app.use("/api/flash-sales", flashSaleRoutes);
    console.log("✅ Flash Sales routes registered");

    app.use("/api/recommendations", recommendationRoutes);
    console.log("✅ Recommendations routes registered");

    app.use("/api/stock-alerts", stockAlertRoutes);
    console.log("✅ Stock Alerts routes registered");

    app.use("/api/loyalty", loyaltyRoutes);
    console.log("✅ Loyalty routes registered");

    app.use("/api/notifications", notificationRoutes);
    console.log("✅ Notification routes registered");

    app.use("/api", questionRoutes);
    console.log("✅ Question routes registered");

    app.use("/api/delivery-settings", deliverySettingsRoutes);
    console.log("✅ Delivery Settings routes registered");

    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl,
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack || err.message);
      const status = err.message?.startsWith("CORS blocked origin") ? 403 : 500;
      res.status(status).json({
        success: false,
        error:
          status === 403
            ? "Origin is not allowed"
            : "Something went wrong!",
      });
    });

    // Start server
    server = app.listen(port, () => {
      console.log(`🔥 Server running on port ${port}`);
    });
  } catch (error) {
    process.exitCode = 1;
    console.error("❌ MongoDB connection failed:", error.message);
  }
}

run();
