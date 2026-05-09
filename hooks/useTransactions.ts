"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";

export interface Transaction {
  id: number;
  budget_id: number;
  category_id: number | null;
  card_id: number | null;
  amount: number;
  description: string;
  created_at: string;
  category?: { name: string };
  card?: { name: string };
}

export function useTransactions(budgetId: number | null) {
  return useQuery({
    queryKey: ["transactions", budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      const { data } = await axios.get<Transaction[]>(`/api/transactions?budget_id=${budgetId}`);
      return data;
    },
    enabled: !!budgetId,
  });
}

export function useSaveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: any) => {
      if (transaction.id) {
        const { data } = await axios.patch("/api/transactions", transaction);
        return data;
      } else {
        const { data } = await axios.post("/api/transactions", transaction);
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", data.budget_id] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, budgetId }: { id: number; budgetId: number }) => {
      await axios.delete(`/api/transactions?id=${id}`);
      return { budgetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", data.budgetId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function groupTransactionsByDate(transactions: Transaction[]) {
  const groups: { [key: string]: Transaction[] } = {};
  
  transactions.forEach((t) => {
    const date = dayjs(t.created_at).format("YYYY-MM-DD");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
  });

  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}
