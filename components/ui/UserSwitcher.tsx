"use client";

import { useUserStore } from "@/store/userStore";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserSwitcher() {
  const { currentUser, setCurrentUser } = useUserStore();

  return (
    <div className="flex items-center gap-2 bg-base-200 p-1 rounded-xl">
      <button
        onClick={() => setCurrentUser("Bon")}
        className={cn(
          "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
          currentUser === "Bon"
            ? "bg-white text-primary"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Bon
      </button>
      <button
        onClick={() => setCurrentUser("Ray")}
        className={cn(
          "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
          currentUser === "Ray"
            ? "bg-white text-primary"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Ray
      </button>
    </div>
  );
}
