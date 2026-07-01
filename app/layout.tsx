import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://supportcraft.aakasa.dev";
const DESCRIPTION = "AI-powered customer support platform for freelancers, agencies, and growing businesses.";

export const metadata: Metadata = {
  title: {
    default: "SupportCraft AI",
    template: "%s | SupportCraft AI",
  },
  description: DESCRIPTION,
  metadataBase: new URL(APP_URL),
  icons: {
    icon: [
      { url: "/favicon.ico",       sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png" },
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  openGraph: {
    type:        "website",
    siteName:    "SupportCraft AI",
    title:       "SupportCraft AI — AI-Powered Help Desk Software",
    description: DESCRIPTION,
    url:         APP_URL,
    images: [
      {
        url:    "/android-chrome-512x512.png",
        width:  512,
        height: 512,
        alt:    "SupportCraft AI",
      },
    ],
  },
  twitter: {
    card:        "summary",
    title:       "SupportCraft AI — AI-Powered Help Desk Software",
    description: DESCRIPTION,
    images:      ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
