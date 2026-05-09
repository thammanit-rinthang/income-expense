"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import { useMonthStore } from "@/store/monthStore";

export interface MonthlyBudget {
  id: number;
  person_name: string;
  month_year: string;
  total_income: number;
  remaining_spending_pool: number;
}

export function useMonthlyBudget() {
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();

  return useQuery({
    queryKey: ["monthly-budget", currentUser, selectedMonth.toISOString()],
    queryFn: async () => {
      const { data } = await axios.get<MonthlyBudget>(
        `/api/budgets?person_name=${currentUser}&month=${selectedMonth.toISOString()}`
      );
      return data;
    },
  });
}

export function useUpdateMonthlyBudget() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();

  return useMutation({
    mutationFn: async (budget: Partial<MonthlyBudget> & { id: number }) => {
      const { data } = await axios.patch("/api/budgets", budget);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-budget", currentUser, selectedMonth.toISOString()] 
      });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}
