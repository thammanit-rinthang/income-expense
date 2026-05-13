"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Plus, ReceiptRussianRuble, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import { useUIStore } from "@/store/uiStore";

const tabs = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Add", onClick: true, icon: Plus, isFab: true },
  { name: "Loans", href: "/loans", icon: ReceiptRussianRuble },
  { name: "Receive", href: "/receive", icon: ArrowDownLeft },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { openTransactionSheet } = useUIStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t-[0.5px] border-base-300 px-6 pt-2 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="max-w-md mx-auto flex justify-between items-end">
        {tabs.map((tab) => {
          const isActive = !tab.onClick && pathname === tab.href;
          const Icon = tab.icon;

          if (tab.isFab) {
            return (
              <button
                key={tab.name}
                onClick={openTransactionSheet}
                className="flex flex-col items-center -mt-8"
              >
                <div className="bg-primary p-4 rounded-xl text-primary-content hover:scale-105 transition-transform active:scale-95">
                  <Icon size={28} />
                </div>
                <span className="text-[10px] mt-1 font-medium text-gray-500">
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href as string}
              className={cn(
                "flex flex-col items-center py-2 transition-colors",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={24} />
              <span className="text-[10px] mt-1 font-medium">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
