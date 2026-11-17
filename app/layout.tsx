import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { NotificationProvider } from "@/hooks/useNotification";
import { AppQueryProvider } from "@/lib/query-provider";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { getSeoConfig, getSiteVerification, PUBLIC_ROBOTS } from "@/lib/seo";

const { siteUrl } = getSeoConfig();

export const metadata: Metadata = {
  title: "ATLAS by Altimeda — AI Operating Engine",
  description:
    "Unify operational data and turn it into explainable decisions with ATLAS.",
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  robots: PUBLIC_ROBOTS,
  verification: getSiteVerification()
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-white text-gray-900"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          <SessionProvider>
            <AppearanceProvider />
            <AuthBootstrap />
            <NotificationProvider>
              <AppQueryProvider>{children}</AppQueryProvider>
            </NotificationProvider>
          </SessionProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
