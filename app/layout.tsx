import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import BottomNav from "@/components/ui/BottomNav";
import DesktopSidebar from "@/components/ui/DesktopSidebar";
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
  title: "คนจะรวย - ระบบงบประมาณรายรับรายจ่าย",
  description: "ระบบจัดการงบประมาณและรายรับรายจ่ายส่วนบุคคลและครอบครัว",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" data-theme="pink">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-200 text-base-content`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col lg:flex-row">
            <DesktopSidebar />
            <div className="flex-1 lg:pl-60 flex flex-col min-h-screen w-full">
              <main className="flex-1 w-full pb-[env(safe-area-inset-bottom)]">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
          <GlobalTransactionSheet />
        </Providers>
      </body>
    </html>
  );
}
