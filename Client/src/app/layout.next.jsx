import "../index.css";

export const metadata = {
  title: "Borka Bazar - Elegant Modest Fashion",
  description:
    "Borka Bazar - Your trusted online shopping destination for elegant modest fashion, burkas, abayas, and hijabs.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Borka Bazar - Elegant Modest Fashion Online",
    description:
      "Discover elegant burkas, abayas, and hijabs with fast delivery across Bangladesh",
    url: "https://borkabazar.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Borka Bazar - Elegant Modest Fashion Online",
    description:
      "Discover elegant burkas, abayas, and hijabs with fast delivery across Bangladesh",
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
