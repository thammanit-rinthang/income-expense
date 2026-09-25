"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface LoanPayment {
  id: number;
  loan_id: number;
  budget_id: number;
  amount: number;
  note: string;
  paid_at: string | Date;
}

export interface Loan {
  id: number;
  name: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  is_paid: boolean;
  include_in_income: boolean;
  budget_id?: number;
  start_date: string | Date;
  payments: LoanPayment[];
}

export function useLoans(personName: string) {
  return useQuery({
    queryKey: ["loans", personName],
    queryFn: async () => {
      const { data } = await axios.get<Loan[]>(`/api/loans?person_name=${personName}`);
      return data;
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (loan: any) => {
      const { data } = await axios.post("/api/loans", loan);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...loan }: any) => {
      const { data } = await axios.patch(`/api/loans/${id}`, loan);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/loans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function usePayLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ loanId, ...data }: any) => {
      const { data: result } = await axios.post(`/api/loans/${loanId}/pay`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}

export function useDeleteLoanPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, loanId }: { paymentId?: number; loanId?: number }) => {
      if (paymentId) {
        const { data } = await axios.delete(`/api/loans/payments?id=${paymentId}`);
        return data;
      } else if (loanId) {
        const { data } = await axios.delete(`/api/loans/${loanId}/pay`);
        return data;
      }
      throw new Error("paymentId or loanId is required");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-budget"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-summary"] });
    },
  });
}
