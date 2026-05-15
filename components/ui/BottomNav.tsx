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
  { name: "Home",    href: "/",        icon: LayoutDashboard },
  { name: "Income",  href: "/income",  icon: Wallet },
  { name: "Add",     isFab: true,      icon: Plus },
  { name: "Loans",   href: "/loans",   icon: ReceiptRussianRuble },
  { name: "Receive", href: "/receive", icon: ArrowDownLeft },
  { name: "Cards",   href: "/cards",   icon: CreditCard },
] as const;

export default function BottomNav() {
  const pathname  = usePathname();
  const { openTransactionSheet } = useUIStore();

  return (
    <>
      {/* Spacer so page content doesn't hide behind the nav */}
      <div className="h-24" />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Blur backdrop that bleeds into the screen edge */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border-t border-gray-100/80" />

        <nav
          className="relative max-w-md mx-auto flex items-end justify-around px-2 pt-2"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
        >
          {tabs.map((tab) => {
            const isFab    = "isFab" in tab && tab.isFab;
            const href     = "href" in tab ? tab.href : undefined;
            const isActive = !isFab && pathname === href;
            const Icon     = tab.icon;

            /* ── FAB ── */
            if (isFab) {
              return (
                <button
                  key={tab.name}
                  onClick={openTransactionSheet}
                  aria-label="Add transaction"
                  className="group flex flex-col items-center -mt-5 gap-1"
                >
                  <span
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      "bg-gradient-to-br from-primary to-primary/80",
                      "ring-4 ring-primary/20",
                      "transition-all duration-200",
                      "group-hover:scale-105 group-hover:ring-primary/30 group-hover:rounded-xl",
                      "group-active:scale-95"
                    )}
                  >
                    <Plus size={26} strokeWidth={2.5} className="text-primary-content" />
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">{tab.name}</span>
                </button>
              );
            }

            /* ── Regular tab ── */
            return (
              <Link
                key={tab.name}
                href={href as string}
                className="group flex flex-col items-center gap-1 flex-1"
              >
                {/* Icon pill */}
                <span
                  className={cn(
                    "relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-primary/10"
                      : "group-hover:bg-gray-100"
                  )}
                >
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={cn(
                      "transition-all duration-300",
                      isActive
                        ? "text-primary scale-110"
                        : "text-gray-400 group-hover:text-gray-600 group-hover:scale-105"
                    )}
                  />

                  {/* Active dot */}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </span>

                {/* Label — always rendered to keep layout stable */}
                <span
                  className={cn(
                    "text-[10px] leading-none transition-all duration-300 font-medium",
                    isActive
                      ? "text-primary font-semibold opacity-100"
                      : "text-gray-400 opacity-70 group-hover:opacity-100 group-hover:text-gray-500"
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
