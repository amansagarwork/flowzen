import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowZen",
  description: "Intelligent Automation Dashboard",
};

import { ThemeProvider } from "./components/theme-provider"
import { SessionProvider } from "../contexts/SessionContext"
import { StoreProvider } from "./components/StoreProvider"
import { Toaster } from "@/lib/toast"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <SessionProvider>
              {children}
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                toastOptions={{
                  className: 'border-border bg-background shadow-lg',
                  style: {
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    borderRadius: '12px',
                    padding: '16px',
                  },
                }}
              />
            </SessionProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
