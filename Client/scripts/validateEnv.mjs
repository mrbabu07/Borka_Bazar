import fs from "node:fs";
import path from "node:path";

[".env.local", ".env.production", ".env"].forEach((fileName) => {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    });
});

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_IMGBB_API_KEY",
  "NEXT_PUBLIC_BKASH_PAYMENT_NUMBER",
  "NEXT_PUBLIC_NAGAD_PAYMENT_NUMBER",
];

const optional = ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "SERVER_API_URL"];

const missing = required.filter((name) => !process.env[name]);
const fallbackMissing = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY"],
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN"],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID"],
  ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET"],
  ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID"],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID"],
  ["NEXT_PUBLIC_IMGBB_API_KEY", "VITE_IMGBB_API_KEY"],
  ["NEXT_PUBLIC_BKASH_PAYMENT_NUMBER", "VITE_BKASH_PAYMENT_NUMBER"],
  ["NEXT_PUBLIC_NAGAD_PAYMENT_NUMBER", "VITE_NAGAD_PAYMENT_NUMBER"],
].filter(([nextName, viteName]) => !process.env[nextName] && process.env[viteName]);

if (fallbackMissing.length > 0) {
  console.warn(
    `Using legacy VITE_* fallback variables for: ${fallbackMissing
      .map(([nextName]) => nextName)
      .join(", ")}`,
  );
}

const unresolvedMissing = missing.filter(
  (name) => !fallbackMissing.some(([nextName]) => nextName === name),
);

if (unresolvedMissing.length > 0) {
  console.error(
    `Missing required client environment variable(s): ${unresolvedMissing.join(", ")}`,
  );
  process.exit(1);
}

optional
  .filter((name) => !process.env[name])
  .forEach((name) => console.warn(`Optional client environment variable not set: ${name}`));

console.log("Client production environment looks ready.");
