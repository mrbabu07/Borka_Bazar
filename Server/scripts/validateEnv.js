require("dotenv").config();

const required = [
  "MONGO_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FRONTEND_URL",
  "APP_NAME",
  "APP_EMAIL",
];

const recommended = [
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_EMAIL",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required server environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

recommended
  .filter((name) => !process.env[name])
  .forEach((name) =>
    console.warn(`Recommended server environment variable not set: ${name}`),
  );

console.log("Server production environment looks ready.");
