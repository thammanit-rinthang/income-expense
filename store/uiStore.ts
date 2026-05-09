import { create } from "zustand";

interface UIState {
  isTransactionSheetOpen: boolean;
  dashboardView: "personal" | "combined";
  openTransactionSheet: () => void;
  closeTransactionSheet: () => void;
  setDashboardView: (view: "personal" | "combined") => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTransactionSheetOpen: false,
  dashboardView: "personal",
  openTransactionSheet: () => set({ isTransactionSheetOpen: true }),
  closeTransactionSheet: () => set({ isTransactionSheetOpen: false }),
  setDashboardView: (view) => set({ dashboardView: view }),
}));
