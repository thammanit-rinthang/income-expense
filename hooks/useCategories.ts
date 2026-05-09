"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Category {
  id: number;
  budget_id: number;
  name: string;
  monthly_budget: number | null;
  spent: number;
  // We'll calculate spent on the frontend or include it in the API if needed
  _count?: {
    transactions: number;
  };
}

export function useCategories(budgetId: number | null) {
  return useQuery({
    queryKey: ["categories", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      // Assuming we might need a GET categories by budget_id later, 
      // but for now we can just fetch all or filter.
      // Actually, let's just create the GET if it's missing or use a mock for now.
      // Wait, the prompt didn't ask for GET /api/categories, but I need it for the UI.
      // I'll add GET to app/api/categories/route.ts.
      const { data } = await axios.get<Category[]>(`/api/categories?budget_id=${budgetId}`);
      return data;
    },
    enabled: !!budgetId,
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { data } = await axios.post("/api/categories", category);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.budget_id] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, budgetId }: { id: number; budgetId: number }) => {
      await axios.delete(`/api/categories?id=${id}`);
      return { budgetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.budgetId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
    },
  });
}
