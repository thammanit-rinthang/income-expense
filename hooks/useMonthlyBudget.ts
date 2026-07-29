"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import { useMonthStore } from "@/store/monthStore";
import dayjs from "dayjs";

export interface MonthlyBudget {
  id: number;
  person_name: string;
  month_year: string;
  total_income: number;
  remaining_spending_pool: number;
  actual_spent?: number;
  cash_spent?: number;
}

export function useMonthlyBudget() {
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();
  const formattedMonth = dayjs(selectedMonth).format("YYYY-MM-DD");

  return useQuery({
    queryKey: ["monthly-budget", currentUser, formattedMonth],
    queryFn: async () => {
      const { data } = await axios.get<MonthlyBudget>(
        `/api/budgets?person_name=${currentUser}&month=${formattedMonth}`
      );
      return data;
    },
  });
}

export function useUpdateMonthlyBudget() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();
  const formattedMonth = dayjs(selectedMonth).format("YYYY-MM-DD");

  return useMutation({
    mutationFn: async (budget: Partial<MonthlyBudget> & { id: number }) => {
      const { data } = await axios.patch("/api/budgets", budget);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["monthly-budget", currentUser, formattedMonth] 
      });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}
