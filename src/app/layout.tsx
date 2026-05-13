import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'; // 1. 必须从这里导入
import { Analytics } from '@vercel/analytics/next';
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
  title: "AI Resume Builder",
  description: "SaaS Style Resume Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. ClerkProvider 必须包裹在 <html> 标签外面
    <ClerkProvider 
      appearance={{
        variables: {
          colorPrimary: "#000000", // 保持你的黑白灰风格
        },
        elements: {
          card: "shadow-none border border-slate-200 rounded-2xl",
          formButtonPrimary: "bg-black hover:bg-slate-800",
        }
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}