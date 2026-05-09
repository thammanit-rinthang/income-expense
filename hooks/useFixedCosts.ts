"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface FixedCost {
  id: number;
  budget_id: number;
  name: string;
  amount: number;
  is_paid: boolean;
}

export function useFixedCosts(budgetId: number | null) {
  return useQuery({
    queryKey: ["fixed-costs", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      const { data } = await axios.get<FixedCost[]>(`/api/fixed-costs?budget_id=${budgetId}`);
      return data;
    },
    enabled: !!budgetId,
  });
}

export function useSaveFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fixedCost: any) => {
      if (fixedCost.id) {
        const { data } = await axios.patch("/api/fixed-costs", fixedCost);
        return data;
      } else {
        const { data } = await axios.post("/api/fixed-costs", fixedCost);
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs", data.budget_id] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
    },
  });
}

export function useDeleteFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, budgetId }: { id: number; budgetId: number }) => {
      await axios.delete(`/api/fixed-costs?id=${id}`);
      return { budgetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs", data.budgetId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
    },
  });
}

export function useToggleFixedCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_paid }: { id: number; is_paid: boolean }) => {
      const { data } = await axios.patch("/api/fixed-costs", { id, is_paid });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs", data.budget_id] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
    },
  });
}
