const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Check if Firebase credentials are configured
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("\n❌ Firebase Admin SDK not configured!");
    console.error("Please configure the following in Server/.env:");
    console.error("  - FIREBASE_PROJECT_ID");
    console.error("  - FIREBASE_CLIENT_EMAIL");
    console.error("  - FIREBASE_PRIVATE_KEY");
    console.error("\nSee BACKEND_FIREBASE_SETUP.md for instructions.\n");
    process.exit(1);
  }

  if (projectId.includes("your_project_id") || clientEmail.includes("xxxxx")) {
    console.error("\n❌ Firebase credentials are still placeholder values!");
    console.error(
      "Please replace them with actual values from Firebase Console."
    );
    console.error(
      "See BACKEND_FIREBASE_SETUP.md for step-by-step instructions.\n"
    );
    process.exit(1);
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("\n❌ Failed to initialize Firebase Admin SDK");
    console.error("Error:", error.message);
    console.error("\nCommon issues:");
    console.error("  1. FIREBASE_PRIVATE_KEY must be wrapped in quotes");
    console.error("  2. Keep \\n as text (don't replace with actual newlines)");
    console.error("  3. Copy the entire private_key value from the JSON file");
    console.error(
      "\nSee BACKEND_FIREBASE_SETUP.md for detailed instructions.\n"
    );
    process.exit(1);
  }
}

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const User = req.app.locals.models.User;
    let user = await User.findByFirebaseUid(req.user.uid);

    // If user doesn't exist in database, create them
    if (!user) {
      console.log(`Creating new user in database for Firebase UID: ${req.user.uid}`);
      user = await User.create({
        firebaseUid: req.user.uid,
        email: req.user.email,
        firstName: req.user.name?.split(' ')[0] || '',
        lastName: req.user.name?.split(' ').slice(1).join(' ') || '',
        role: 'customer', // Default role
      });
    }

    // Check if user has admin role
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = { verifyToken, verifyAdmin };
