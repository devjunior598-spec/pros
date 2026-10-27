import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRMS – Property Rental Management System",
  description: "Manage U.S. rental properties, listings, applications, leases, rent activity, and maintenance in one place.",
  keywords: "U.S. property management, rentals, landlord, tenant, leasing, PRMS",
  icons: {
    icon: "/prms-logo.png",
    shortcut: "/prms-logo.png",
    apple: "/prms-logo.png",
  },
  openGraph: {
    title: "PRMS – Property Rental Management System",
    description: "A clear workspace for U.S. rental property operations.",
    type: "website",
  }
};

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
                       /browsing context is going away|promise was rejected because/i.test(s) ||
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
        className="antialiased flex flex-col min-h-screen"
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
      </body>
    </html>
  );
}
