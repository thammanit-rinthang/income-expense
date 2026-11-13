import { create } from "zustand";
import { getCurrentBudgetMonth } from "@/lib/billing";

interface MonthState {
  selectedMonth: Date;
  hasManualMonthSelection: boolean;
  setSelectedMonth: (date: Date) => void;
  syncCurrentBudgetMonth: () => void;
  nextMonth: () => void;
  prevMonth: () => void;
}

const getInitialMonth = () => {
  return getCurrentBudgetMonth();
};

export const useMonthStore = create<MonthState>((set) => ({
  selectedMonth: getInitialMonth(),
  hasManualMonthSelection: false,
  setSelectedMonth: (date) => set({
    selectedMonth: new Date(date.getFullYear(), date.getMonth(), 1),
    hasManualMonthSelection: true,
  }),
  syncCurrentBudgetMonth: () =>
    set((state) => {
      if (state.hasManualMonthSelection) return state;

      const currentBudgetMonth = getCurrentBudgetMonth();
      const isAlreadyCurrent =
        state.selectedMonth.getFullYear() === currentBudgetMonth.getFullYear() &&
        state.selectedMonth.getMonth() === currentBudgetMonth.getMonth();

      return isAlreadyCurrent ? state : { selectedMonth: currentBudgetMonth };
    }),
  nextMonth: () =>
    set((state) => {
      return {
        selectedMonth: new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth() + 1, 1),
        hasManualMonthSelection: true,
      };
    }),
  prevMonth: () =>
    set((state) => {
      return {
        selectedMonth: new Date(state.selectedMonth.getFullYear(), state.selectedMonth.getMonth() - 1, 1),
        hasManualMonthSelection: true,
      };
    }),
}));
