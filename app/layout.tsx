import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import BottomNav from "@/components/ui/BottomNav";
import GlobalTransactionSheet from "@/components/transactions/GlobalTransactionSheet";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "รายรับรายจ่าย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="pink">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-200`}
      >
        <Providers>
          <main className="pb-[env(safe-area-inset-bottom)] pb-24 max-w-md mx-auto min-h-screen relative bg-base-200">
            {children}
          </main>
          <BottomNav />
          <GlobalTransactionSheet />
        </Providers>
      </body>
    </html>
  );
}
