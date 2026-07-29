"use client";

import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <div className="finance-chip flex items-center gap-1 p-1">
      <button
        onClick={() => setCurrentUser("Bon")}
        className={cn(
          "px-3 sm:px-4 py-1.5 rounded-full text-sm font-bold transition-all finance-action",
          currentUser === "Bon"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Bon
      </button>
      <button
        onClick={() => setCurrentUser("Ray")}
        className={cn(
          "px-3 sm:px-4 py-1.5 rounded-full text-sm font-bold transition-all finance-action",
          currentUser === "Ray"
            ? "bg-white text-primary shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Ray
      </button>
    </div>
  );
}
