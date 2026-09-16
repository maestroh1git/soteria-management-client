import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // A template so a page can name itself and still carry the product name —
  // without it every tab, bookmark and shared link reads "Soteria Payroll".
  title: {
    default: "Soteria Payroll",
    template: "%s · Soteria Payroll",
  },
  description: "Manage your payroll, employees, loans, and finances with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * `suppressHydrationWarning` is required by next-themes and is not
     * cosmetic. Its blocking script sets `class="dark"` and `color-scheme` on
     * <html> before React hydrates — that is the whole point, it is what stops
     * a white flash on a dark-theme load — so the server's <html> and the
     * client's provably differ. Without this React reports the mismatch on
     * EVERY page, including the ones with no session at all. It suppresses one
     * level deep, on <html>'s own attributes, not on the tree below.
     */
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

