import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WhopApp } from "@whop/react/components";
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
  title: "OPTIZ",
  description: "1% better every day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <WhopApp accentColor="blue" appearance="inherit">
          {children}
        </WhopApp>
      </body>
    </html>
  );
}
