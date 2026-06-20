import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Landlord-Tenant Platform",
  description: "Premium property management in Nigeria",
};

import { SiteFooter } from "@/components/site-footer";
import { GlobalErrorSuppressor } from "@/components/global-error-suppressor";
import { NotificationsProvider } from "@/components/notifications/notifications-provider";
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function isSuppressed(v) {
                if (!v) return false;
                var s = typeof v === 'string' ? v : (v.message || String(v) || '');
                return /abort|signal is aborted|lock broken|steal|isacquiretimeout|was released because another request/i.test(s) ||
                       /^failed to fetch$/i.test(s.trim());
              }
              var orig = console.error.bind(console);
              console.error = function() {
                for (var i = 0; i < arguments.length; i++) { if (isSuppressed(arguments[i])) return; }
                orig.apply(console, arguments);
              };
              window.addEventListener('error', function(e) {
                if (isSuppressed(e.message) || isSuppressed(e.error)) { e.preventDefault(); e.stopImmediatePropagation(); }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (isSuppressed(e.reason)) { e.preventDefault(); e.stopImmediatePropagation(); }
              }, true);
            })();
          `
        }} />
      </head>
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <GlobalErrorSuppressor />
        <AuthProvider>
          <NotificationsProvider>
            <div className="flex-1">
              {children}
            </div>
          </NotificationsProvider>
        </AuthProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
