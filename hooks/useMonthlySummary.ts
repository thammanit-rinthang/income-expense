"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMonthStore } from "@/store/monthStore";

export interface MonthlySummary {
  summary: {
    combined_income: number;
    combined_spent: number;
    combined_fixed: number;
    person_a_spent: number;
    person_b_spent: number;
  };
  bon: {
    income: number;
    spent: number;
    remaining: number;
  };
  ray: {
    income: number;
    spent: number;
    remaining: number;
  };
}

export function useMonthlySummary() {
  const { selectedMonth } = useMonthStore();

  return useQuery({
    queryKey: ["monthly-summary", selectedMonth.toISOString()],
    queryFn: async () => {
      const { data } = await axios.get<MonthlySummary>(
        `/api/summary?month=${selectedMonth.toISOString()}`
      );
      return data;
    },
  });
}
