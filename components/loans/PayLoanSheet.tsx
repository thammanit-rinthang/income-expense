"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { usePayLoan } from "@/hooks/useLoans";
import { toast } from "react-hot-toast";
import { cn, formatCurrency } from "@/lib/utils";

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
  loan: { id: number; name: string } | null;
  budgetId: number;
}

export default function PayLoanSheet({ isOpen, onClose, loan, budgetId }: PayLoanSheetProps) {
  const payLoan = usePayLoan();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      note: "",
    }
  });

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
            className={cn("input input-bordered text-2xl font-black text-center h-16 rounded-xl text-base", errors.amount && "input-error")}
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

        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <p className="text-xs text-orange-800 font-medium">
            * ยอดที่ชำระจะถูกหักออกจาก <strong>Remaining Pool</strong> ของเดือนนี้ทันที
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
