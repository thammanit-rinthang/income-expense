"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useUserStore } from "@/store/userStore";
import { useMonthStore } from "@/store/monthStore";

export interface ReceivedPayment {
  id: number;
  budget_id: number;
  amount: number;
  sender: string;
  note: string;
  received_at: string;
}

export interface ReceivePaymentInput {
  budget_id: number;
  amount: number;
  sender: string;
  note?: string;
}

export function useReceivedPayments(budgetId: number | null) {
  return useQuery({
    queryKey: ["received-payments", budgetId],
    queryFn: async () => {
      const { data } = await axios.get<ReceivedPayment[]>(
        `/api/budgets/receive-payment?budget_id=${budgetId}`
      );
      return data;
    },
    enabled: !!budgetId,
  });
}

export function useReceivePayment() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();

  return useMutation({
    mutationFn: async (input: ReceivePaymentInput) => {
      const { data } = await axios.post<ReceivedPayment>(
        "/api/budgets/receive-payment",
        input
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["received-payments", variables.budget_id] });
      queryClient.invalidateQueries({
        queryKey: ["monthly-budget", currentUser, selectedMonth.toISOString()],
      });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function useDeleteReceivedPayment() {
  const queryClient = useQueryClient();
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();

  return useMutation({
    mutationFn: async ({ id }: { id: number; budget_id: number }) => {
      const { data } = await axios.delete(`/api/budgets/receive-payment?id=${id}`);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["received-payments", variables.budget_id] });
      queryClient.invalidateQueries({
        queryKey: ["monthly-budget", currentUser, selectedMonth.toISOString()],
      });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}
