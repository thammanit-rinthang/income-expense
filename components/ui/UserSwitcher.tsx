"use client";

import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { UserCheck } from "lucide-react";

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-base-200/80 rounded-xl border border-base-300">
      <button
        onClick={() => setCurrentUser("Bon")}
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all finance-action flex items-center gap-1.5",
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
        className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all finance-action flex items-center gap-1.5",
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
