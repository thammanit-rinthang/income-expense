"use client";

import UserSwitcher from "./UserSwitcher";
import MonthSelector from "./MonthSelector";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Users, User } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { dashboardView, setDashboardView } = useUIStore();

  return (
    <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Mobile View Header */}
        <div className="flex lg:hidden flex-col gap-2.5">
          <div className="flex justify-between items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary text-primary-content flex items-center justify-center font-black text-xs">
                ฿
              </span>
              <span className="text-sm font-black tracking-tight text-base-content">
                คนจะรวย
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              {/* Personal / Combined Toggle */}
              <div className="flex items-center p-0.5 bg-base-200 rounded-lg">
                <button
                  onClick={() => setDashboardView("personal")}
                  aria-label="ดูงบส่วนตัว"
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    dashboardView === "personal"
                      ? "bg-base-100 text-primary"
                      : "text-base-content/40 hover:text-base-content"
                  )}
                  title="งบส่วนตัว"
                >
                  <User size={14} />
                </button>
                <button
                  onClick={() => setDashboardView("combined")}
                  aria-label="ดูงบรวม"
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    dashboardView === "combined"
                      ? "bg-base-100 text-primary"
                      : "text-base-content/40 hover:text-base-content"
                  )}
                  title="งบรวม"
                >
                  <Users size={14} />
                </button>
              </div>

              <UserSwitcher />
            </div>
          </div>

          <MonthSelector />
        </div>

        {/* Desktop SaaS View Header */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          {/* Left: View Mode Segmented Control */}
          <div className="flex items-center gap-1 p-0.5 bg-base-200 rounded-xl">
            <button
              onClick={() => setDashboardView("personal")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                dashboardView === "personal"
                  ? "bg-base-100 text-primary"
                  : "text-base-content/60 hover:text-base-content"
              )}
            >
              <User size={13} />
              <span>งบส่วนตัว</span>
            </button>
            <button
              onClick={() => setDashboardView("combined")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                dashboardView === "combined"
                  ? "bg-base-100 text-primary"
                  : "text-base-content/60 hover:text-base-content"
              )}
            >
              <Users size={13} />
              <span>งบรวมครอบครัว</span>
            </button>
          </div>

          {/* Center: Month Selector */}
          <div className="flex-1 flex justify-center">
            <MonthSelector />
          </div>

          {/* Right: User Switcher */}
          <div className="flex items-center gap-3">
            <UserSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
