const emailService = require("../services/emailService");

const getOrCreateUser = async (req, res) => {
  try {
    console.log("📝 Getting user for Firebase UID:", req.user.uid);

    const User = req.app.locals.models.User;
    let user = await User.findByFirebaseUid(req.user.uid);

    console.log("📝 Found user:", user);

    if (!user) {
      console.log("📝 Creating new user...");
      const newUser = await User.create({
        firebaseUid: req.user.uid,
        firstName: req.user.name?.split(" ")[0] || "",
        lastName: req.user.name?.split(" ").slice(1).join(" ") || "",
        email: req.user.email,
        role: "customer", // Default role should be customer
      });

      user = newUser;
      console.log("📝 Created user:", user);

      // Send welcome email to new user
      try {
        console.log("📧 Sending welcome email to new user...");
        await emailService.sendWelcomeEmail({
          userEmail: req.user.email,
          userName: req.user.name || req.user.email.split("@")[0],
        });
        console.log("✅ Welcome email sent successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send welcome email:", emailError);
        // Don't fail user creation if email fails
      }
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("❌ Error in getOrCreateUser:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserStatus = async (req, res) => {
  try {
    const User = req.app.locals.models.User;
    const user = await User.findByFirebaseUid(req.user.uid);

    res.json({
      success: true,
      data: {
        firebaseUid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        dbUser: user,
        isAdmin: user?.role === "admin",
        hasUser: !!user,
      },
    });
  } catch (error) {
    console.error("❌ Error in getUserStatus:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const cleanText = (value, maxLength = 80) =>
      typeof value === "string" ? value.trim().slice(0, maxLength) : "";

    const firstName = cleanText(req.body.firstName);
    const lastName = cleanText(req.body.lastName);
    const phone = cleanText(req.body.phone, 30);
    const avatar = cleanText(req.body.avatar, 500);

    if (phone && !/^[+\d\s().-]{6,30}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid phone number",
      });
    }

    const User = req.app.locals.models.User;
    let user = await User.findByFirebaseUid(req.user.uid);

    if (!user) {
      user = await User.create({
        firebaseUid: req.user.uid,
        firstName,
        lastName,
        phone,
        avatar,
        email: req.user.email,
        role: "customer",
      });
    } else {
      await User.updateProfile(req.user.uid, {
        firstName,
        lastName,
        phone,
        avatar,
      });
      user = await User.findByFirebaseUid(req.user.uid);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getOrCreateUser, getUserStatus, updateUserProfile };
