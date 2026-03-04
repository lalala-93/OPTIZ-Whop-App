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
  description: "Level up your fitness — track workouts, earn XP, dominate the leaderboard.",
};

// Inline script to detect and set theme before React renders — prevents white flash
// Forces dark mode when loaded in mobile WebView (mobileUserId param) or when no Whop theme cookie exists
const themeScript = `(function(){try{var u=new URLSearchParams(window.location.search);var m=u.has('mobileUserId');var c=document.cookie.match(/whop-frosted-theme=appearance:(?<a>light|dark)/);var t=m?'dark':c?c.groups.a:(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;if(t==='dark'){document.documentElement.style.backgroundColor='#0A0A0A';}}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.backgroundColor='#0A0A0A';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0A0A0A" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WhopApp accentColor="red" appearance="inherit">
          {children}
        </WhopApp>
      </body>
    </html>
  );
}
