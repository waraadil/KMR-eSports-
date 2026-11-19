import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/unbounded/800.css";
import "@fontsource/chakra-petch/500.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/site/Navbar";
import RefreshOnFocus from "@/components/site/RefreshOnFocus";
import Footer from "@/components/site/Footer";
import ServiceWorker from "@/components/site/ServiceWorker";

export const metadata: Metadata = {
  title: {
    default: "KMR eSports — Host. Compete. Conquer.",
    template: "%s · KMR eSports",
  },
  description:
    "KMR eSports is India's competitive gaming arena. Paid and free tournaments across BGMI, Valorant, Free Fire, CODM, EA FC and CS2 — with instant payouts and a live points system.",
  keywords: ["esports", "tournaments", "BGMI", "Valorant", "gaming", "India", "KMR"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "KMR eSports",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#07070c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="bg-void-950 font-sans text-zinc-200 antialiased">
        <div className="bg-noise" aria-hidden />
        <Navbar user={user ? { username: user.username, role: user.role, avatar_color: user.avatar_color } : null} />
        {children}
        <Footer />
        <ServiceWorker />
        <RefreshOnFocus />
      </body>
    </html>
  );
}
