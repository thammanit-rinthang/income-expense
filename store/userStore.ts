import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = "Bon" | "Ray";

interface UserState {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: "Bon",
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: "user-storage",
    }
  )
);
