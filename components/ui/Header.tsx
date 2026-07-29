"use client";

import UserSwitcher from "./UserSwitcher";
import MonthSelector from "./MonthSelector";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Users, User } from "lucide-react";

export default function Header() {
  const { dashboardView, setDashboardView } = useUIStore();

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/70 bg-base-100/90 backdrop-blur-xl">
      <div className="finance-shell flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-primary whitespace-nowrap">คนจะรวย</h1>
          <div className="finance-chip flex p-1">
            <button
              onClick={() => setDashboardView("personal")}
              aria-label="ดูงบส่วนตัว"
              className={cn(
                "p-1.5 rounded-full transition-all finance-action",
                dashboardView === "personal" ? "bg-white text-primary shadow-sm" : "text-gray-400"
              )}
            >
              <User size={14} />
            </button>
            <button
              onClick={() => setDashboardView("combined")}
              aria-label="ดูงบรวม"
              className={cn(
                "p-1.5 rounded-full transition-all finance-action",
                dashboardView === "combined" ? "bg-white text-primary shadow-sm" : "text-gray-400"
              )}
            >
              <Users size={14} />
            </button>
          </div>
        </div>
        <UserSwitcher />
      </div>
      <MonthSelector />
      </div>
    </header>
  );
}
