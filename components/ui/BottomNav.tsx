"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Plus,
  ReceiptRussianRuble,
  ArrowDownLeft,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

const tabs = [
  { name: "หน้าหลัก", href: "/", icon: LayoutDashboard },
  { name: "งบประมาณ", href: "/income", icon: Wallet },
  { name: "บันทึก", isFab: true, icon: Plus },
  { name: "หนี้สิน", href: "/loans", icon: ReceiptRussianRuble },
  { name: "บัตร", href: "/cards", icon: CreditCard },
  { name: "รับเงิน", href: "/receive", icon: ArrowDownLeft },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { openTransactionSheet } = useUIStore();

  return (
    <div className="lg:hidden">
      {/* Spacer so page content does not hide behind bottom nav */}
      <div className="h-20" />

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-base-100 border-t border-base-300">
        <nav
          className="flex items-center justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          {tabs.map((tab) => {
            const isFab = "isFab" in tab && tab.isFab;
            const href = "href" in tab ? tab.href : undefined;
            const isActive = !isFab && pathname === href;
            const Icon = tab.icon;

            /* ── FAB ── */
            if (isFab) {
              return (
                <button
                  key={tab.name}
                  onClick={openTransactionSheet}
                  aria-label="บันทึกรายการใหม่"
                  className="group flex flex-col items-center -mt-5 gap-1 focus:outline-none"
                >
                  <span
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      "bg-primary text-primary-content",
                      "border-2 border-base-100",
                      "transition-transform duration-150",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </span>
                  <span className="text-[10px] font-bold text-primary">{tab.name}</span>
                </button>
              );
            }

            /* ── Regular Tab ── */
            return (
              <Link
                key={tab.name}
                href={href as string}
                className="group flex flex-col items-center gap-1 min-w-[48px] py-1 text-center"
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary/10"
                      : "group-hover:bg-base-200"
                  )}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className={cn(
                      "transition-colors duration-150",
                      isActive
                        ? "text-primary"
                        : "text-base-content/50 group-hover:text-base-content"
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold leading-tight transition-colors",
                    isActive ? "text-primary" : "text-base-content/50"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
