"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface CreditCard {
  id: number;
  name: string;
  person_name: string | null;
  statement_balance: number;
  credit_limit: number;
  minimum_payment?: number;
  due_date?: string | null;
}

export interface CardTransaction {
  id: number;
  amount: number;
  description: string;
  created_at: string;
  category?: { name: string };
}

export function useCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const { data } = await axios.get<CreditCard[]>("/api/cards");
      return data;
    },
  });
}

export function useCardTransactions(cardId: number | null, month?: string) {
  return useQuery({
    queryKey: ["card-transactions", cardId, month],
    queryFn: async () => {
      if (!cardId) return [];
      const url = month 
        ? `/api/cards/${cardId}/transactions?month=${month}`
        : `/api/cards/${cardId}/transactions`;
      const { data } = await axios.get<CardTransaction[]>(url);
      return data;
    },
    enabled: !!cardId,
  });
}

export interface CardPayment {
  id: number;
  card_id: number;
  budget_id?: number | null;
  amount: number;
  note: string;
  paid_at: string;
}

type SaveCardInput = Partial<CreditCard> & {
  id?: number;
  name: string;
  credit_limit: number;
  statement_balance?: number;
};

export function useCardPayments(cardId: number | null, month?: string) {
  return useQuery({
    queryKey: ["card-payments", cardId, month],
    queryFn: async () => {
      if (!cardId) return [];
      const url = month 
        ? `/api/cards/${cardId}/payments?month=${month}`
        : `/api/cards/${cardId}/payments`;
      const { data } = await axios.get<CardPayment[]>(url);
      return data;
    },
    enabled: !!cardId,
  });
}

export function useSaveCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (card: SaveCardInput) => {
      if (card.id) {
        const { data } = await axios.patch(`/api/cards/${card.id}`, card);
        return data;
      } else {
        const { data } = await axios.post("/api/cards", card);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
    },
  });
}

export function useMakeCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: {
      card_id: number;
      amount: number;
      note?: string;
      paid_at?: string;
      budget_id?: number;
    }) => {
      const { data } = await axios.post("/api/cards/payments", payment);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function useDeleteCardPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cardId }: { id: number; cardId: number }) => {
      await axios.delete(`/api/cards/payments?id=${id}`);
      return { cardId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["card-payments", data.cardId] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}
