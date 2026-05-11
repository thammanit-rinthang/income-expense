"use client";

import UserSwitcher from "./UserSwitcher";
import MonthSelector from "./MonthSelector";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Users, User } from "lucide-react";

export default function Header() {
  const { dashboardView, setDashboardView } = useUIStore();

  return (
    <header className="flex flex-col gap-3 p-3 sm:p-4 bg-base-100 border-b-[0.5px] border-base-300 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-primary">คนจะรวย</h1>
          <div className="flex bg-base-200 p-1 rounded-xl">
            <button
              onClick={() => setDashboardView("personal")}
              className={cn(
                "p-1 rounded-xl transition-all",
                dashboardView === "personal" ? "bg-white text-primary" : "text-gray-400"
              )}
            >
              <User size={14} />
            </button>
            <button
              onClick={() => setDashboardView("combined")}
              className={cn(
                "p-1 rounded-xl transition-all",
                dashboardView === "combined" ? "bg-white text-primary" : "text-gray-400"
              )}
            >
              <Users size={14} />
            </button>
          </div>
        </div>
        <UserSwitcher />
      </div>
      <MonthSelector />
    </header>
  );
}
