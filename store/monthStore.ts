import { create } from "zustand";

interface MonthState {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  nextMonth: () => void;
  prevMonth: () => void;
}

export const useMonthStore = create<MonthState>((set) => ({
  selectedMonth: new Date(),
  setSelectedMonth: (date) => set({ selectedMonth: date }),
  nextMonth: () =>
    set((state) => {
      const next = new Date(state.selectedMonth);
      next.setMonth(next.getMonth() + 1);
      return { selectedMonth: next };
    }),
  prevMonth: () =>
    set((state) => {
      const prev = new Date(state.selectedMonth);
      prev.setMonth(prev.getMonth() - 1);
      return { selectedMonth: prev };
    }),
}));
