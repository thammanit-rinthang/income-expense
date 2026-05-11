"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { usePayLoan, Loan } from "@/hooks/useLoans";
import { toast } from "react-hot-toast";
import { cn, formatCurrency, calculateMonthlyPayment, getMonthsDifference } from "@/lib/utils";
import { useEffect } from "react";

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  note: z.string(),
});

type FormInput = {
  amount: string;
  note: string;
};

interface PayLoanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  budgetId: number;
}

export default function PayLoanSheet({ isOpen, onClose, loan, budgetId }: PayLoanSheetProps) {
  const payLoan = usePayLoan();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      note: "",
    }
  });

  const watchedAmount = watch("amount");

  const paidAmount = loan?.payments.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
  const currentRemaining = (loan?.principal || 0) - paidAmount;
  const monthsPassed = loan ? getMonthsDifference(loan.start_date) : 0;
  const monthsLeft = loan ? Math.max(loan.term_months - monthsPassed, 1) : 1;
  const suggestedPayment = loan ? calculateMonthlyPayment(currentRemaining, loan.interest_rate, monthsLeft) : 0;

  useEffect(() => {
    if (loan && isOpen) {
      reset({
        amount: suggestedPayment.toFixed(2),
        note: `Payment for month ${monthsPassed + 1}`,
      });
    }
  }, [loan, isOpen, reset, suggestedPayment, monthsPassed]);

  const previewRemainingAfterPayment = Math.max(currentRemaining - (Number(watchedAmount) || 0), 0);
  const previewNextPayment = loan ? calculateMonthlyPayment(previewRemainingAfterPayment, loan.interest_rate, Math.max(monthsLeft - 1, 1)) : 0;

  const onSubmit = (data: FormInput) => {
    if (!loan) return;

    payLoan.mutate({
      loanId: loan.id,
      budget_id: budgetId,
      amount: Number(data.amount),
      note: data.note,
    }, {
      onSuccess: () => {
        toast.success(`Paid ${formatCurrency(data.amount)} to ${loan.name}`);
        reset();
        onClose();
      },
      onError: () => {
        toast.error("Payment failed");
      }
    });
  };

  return (
    <BottomSheet
      id="pay-loan-sheet"
      title={`ชำระหนี้: ${loan?.name}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-control">
          <label className="label"><span className="label-text font-bold">ยอดที่ต้องการชำระ</span></label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            placeholder="0.00"
            className={cn("input input-bordered text-2xl font-black text-center h-16 rounded-xl", errors.amount && "input-error")}
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text font-bold">บันทึกเพิ่มเติม (ไม่บังคับ)</span></label>
          <input
            {...register("note")}
            type="text"
            placeholder="เช่น งวดที่ 1/12"
            className="input input-bordered rounded-xl text-base"
          />
        </div>

        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">ยอดคงเหลือหลังจ่าย</span>
            <span className="font-bold text-gray-900">{formatCurrency(previewRemainingAfterPayment)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">ยอดผ่อนเดือนถัดไป (โดยประมาณ)</span>
            <span className="font-bold text-primary">{formatCurrency(previewNextPayment)}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            * ระบบคำนวณจากยอดคงเหลือที่เหลืออยู่ หารด้วยจำนวนเดือนที่เหลืออยู่ตามสัญญา
          </p>
        </div>

        <button 
          type="submit" 
          className={cn("btn btn-secondary w-full rounded-xl text-lg h-14", payLoan.isPending && "loading")}
          disabled={payLoan.isPending}
        >
          ยืนยันการชำระเงิน
        </button>
      </form>
    </BottomSheet>
  );
}
