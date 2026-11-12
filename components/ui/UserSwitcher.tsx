"use client";

import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { UserCheck } from "lucide-react";

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-base-200/80 rounded-xl border border-base-300" role="group" aria-label="เลือกเจ้าของงบส่วนตัว" title="เลือกเจ้าของงบที่กำลังจัดการ">
      <button
        onClick={() => setCurrentUser("Bon")}
        aria-pressed={currentUser === "Bon"}
        aria-label="เลือกงบของ Bon"
        className={cn(
          "min-h-11 min-w-11 justify-center px-2.5 rounded-lg text-xs font-bold transition-all finance-action flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          currentUser === "Bon"
            ? "bg-primary text-primary-content"
            : "text-base-content/60 hover:text-base-content hover:bg-base-100"
        )}
      >
        {currentUser === "Bon" && <UserCheck size={12} strokeWidth={2.5} />}
        Bon
      </button>
      <button
        onClick={() => setCurrentUser("Ray")}
        aria-pressed={currentUser === "Ray"}
        aria-label="เลือกงบของ Ray"
        className={cn(
          "min-h-11 min-w-11 justify-center px-2.5 rounded-lg text-xs font-bold transition-all finance-action flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
          currentUser === "Ray"
            ? "bg-primary text-primary-content"
            : "text-base-content/60 hover:text-base-content hover:bg-base-100"
        )}
      >
        {currentUser === "Ray" && <UserCheck size={12} strokeWidth={2.5} />}
        Ray
      </button>
    </div>
  );
}
