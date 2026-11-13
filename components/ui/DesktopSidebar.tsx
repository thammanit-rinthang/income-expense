"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ReceiptRussianRuble,
  ArrowDownLeft,
  CreditCard,
  ReceiptText,
  Plus,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";

const navItems = [
  { name: "ภาพรวม", href: "/", icon: LayoutDashboard },
  { name: "งบประมาณ", href: "/income", icon: Wallet },
  { name: "บัตรเครดิต", href: "/cards", icon: CreditCard },
  { name: "หนี้สิน", href: "/loans", icon: ReceiptRussianRuble },
  { name: "รับเงิน", href: "/receive", icon: ArrowDownLeft },
  { name: "ประวัติรายการ", href: "/transactions", icon: ReceiptText },
  { name: "MCP API Keys", href: "/mcp-keys", icon: KeyRound },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { openTransactionSheet } = useUIStore();
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-base-300 bg-base-100 min-h-screen fixed left-0 top-0 bottom-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-base-200">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-black text-sm">
            ฿
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-base-content block leading-tight">
              คนจะรวย
            </span>
            <span className="text-[10px] text-base-content/40 uppercase tracking-wider block">
              ระบบงบประมาณและรายจ่าย
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={openTransactionSheet}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-primary-content font-bold text-xs transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus size={16} />
          <span>บันทึกรายการ</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
              )}
            >
              <Icon
                size={16}
                className={isActive ? "text-primary" : "text-base-content/40"}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Switcher Footer */}
      <div className="p-3 border-t border-base-200">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-base-200 rounded-lg">
          <button
            onClick={() => setCurrentUser("Bon")}
            className={cn(
              "py-1 rounded-md text-xs font-bold transition-all",
              currentUser === "Bon"
                ? "bg-base-100 text-primary"
                : "text-base-content/50 hover:text-base-content"
            )}
          >
            Bon
          </button>
          <button
            onClick={() => setCurrentUser("Ray")}
            className={cn(
              "py-1 rounded-md text-xs font-bold transition-all",
              currentUser === "Ray"
                ? "bg-base-100 text-primary"
                : "text-base-content/50 hover:text-base-content"
            )}
          >
            Ray
          </button>
        </div>
      </div>
    </aside>
  );
}
