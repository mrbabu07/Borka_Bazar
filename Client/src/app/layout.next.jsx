import "../index.css";
import { brand } from "../config/brand";

export const metadata = {
  title: `${brand.name} - Modern Modest Fashion`,
  description: brand.description,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: `${brand.name} - Modern Modest Fashion Online`,
    description:
      "Discover modern burkas, abayas, and hijabs with fast delivery across Bangladesh",
    url: "https://borkabazar.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} - Modern Modest Fashion Online`,
    description:
      "Discover modern burkas, abayas, and hijabs with fast delivery across Bangladesh",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1e7098",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
