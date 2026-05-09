"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface Loan {
  id: number;
  name: string;
  principal: number;
  interest_rate: number;
  term_months: number;
  is_paid: boolean;
  payments: Array<{ amount: number }>;
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
