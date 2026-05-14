const normalizeApiUrl = (value, fallback) => {
  const rawValue = value || fallback;
  return rawValue.replace(/\/+$/, "");
};

const serverApiUrl = normalizeApiUrl(
  process.env.SERVER_API_URL || process.env.VITE_API_URL,
  "http://localhost:5000/api",
);
const apiTarget = serverApiUrl.replace(/\/api$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: "/api",
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
    NEXT_PUBLIC_IMGBB_API_KEY:
      process.env.NEXT_PUBLIC_IMGBB_API_KEY || process.env.VITE_IMGBB_API_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_BKASH_PAYMENT_NUMBER:
      process.env.NEXT_PUBLIC_BKASH_PAYMENT_NUMBER || process.env.VITE_BKASH_PAYMENT_NUMBER,
    NEXT_PUBLIC_NAGAD_PAYMENT_NUMBER:
      process.env.NEXT_PUBLIC_NAGAD_PAYMENT_NUMBER || process.env.VITE_NAGAD_PAYMENT_NUMBER,
  },
  pageExtensions: ["next.jsx", "next.js"],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${apiTarget}/uploads/:path*`,
      },
      {
        source: "/api/uploads/:path*",
        destination: `${apiTarget}/uploads/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
