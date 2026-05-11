"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useCreateLoan, useUpdateLoan, Loan } from "@/hooks/useLoans";
import { useUserStore } from "@/store/userStore";
import { toast } from "react-hot-toast";
import { cn, calculateMonthlyPayment, formatCurrency } from "@/lib/utils";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  principal: z.string().min(1, "Principal is required"),
  interest_rate: z.string(),
  term_months: z.string(),
  include_in_income: z.boolean(),
});

type FormInput = {
  name: string;
  principal: string;
  interest_rate: string;
  term_months: string;
  include_in_income: boolean;
};

interface LoanSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId?: number;
  loan?: Loan | null;
}

export default function LoanSheet({ isOpen, onClose, budgetId, loan }: LoanSheetProps) {
  const { currentUser } = useUserStore();
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan();

  const isEditing = !!loan;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      principal: "",
      interest_rate: "0",
      term_months: "12",
      include_in_income: false,
    }
  });

  const watchedPrincipal = watch("principal");
  const watchedInterest = watch("interest_rate");
  const watchedTerms = watch("term_months");

  const previewMonthly = calculateMonthlyPayment(
    Number(watchedPrincipal) || 0,
    Number(watchedInterest) || 0,
    Number(watchedTerms) || 1
  );

  useEffect(() => {
    if (loan) {
      reset({
        name: loan.name,
        principal: String(loan.principal),
        interest_rate: String(loan.interest_rate),
        term_months: String(loan.term_months),
        include_in_income: loan.include_in_income,
      });
    } else {
      reset({
        name: "",
        principal: "",
        interest_rate: "0",
        term_months: "12",
        include_in_income: false,
      });
    }
  }, [loan, reset, isOpen]);

  const onSubmit = (data: FormInput) => {
    const payload = {
      ...data,
      principal: Number(data.principal),
      interest_rate: Number(data.interest_rate),
      term_months: Number(data.term_months),
      person_name: currentUser,
      budget_id: budgetId,
    };

    if (isEditing && loan) {
      updateLoan.mutate({ id: loan.id, ...payload }, {
        onSuccess: () => {
          toast.success("Loan updated successfully");
          reset();
          onClose();
        },
        onError: () => {
          toast.error("Failed to update loan");
        }
      });
    } else {
      createLoan.mutate(payload, {
        onSuccess: () => {
          toast.success("Loan added successfully");
          reset();
          onClose();
        },
        onError: () => {
          toast.error("Failed to add loan");
        }
      });
    }
  };

  return (
    <BottomSheet
      id="loan-sheet"
      title={isEditing ? "แก้ไขหนี้สิน" : "เพิ่มหนี้สินใหม่"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="form-control">
          <label className="label"><span className="label-text font-bold">ชื่อรายการหนี้</span></label>
          <input
            {...register("name")}
            type="text"
            placeholder="เช่น กู้ซื้อรถ, ยืมเพื่อน"
            className={cn("input input-bordered rounded-xl text-base", errors.name && "input-error")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-bold">ยอดเงินต้น</span></label>
            <input
              {...register("principal")}
              type="number"
              placeholder="0.00"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-bold">ระยะเวลา (เดือน)</span></label>
            <input
              {...register("term_months")}
              type="number"
              placeholder="12"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text font-bold">อัตราดอกเบี้ย (%)</span></label>
          <input
            {...register("interest_rate")}
            type="number"
            step="0.01"
            placeholder="0.00"
            className="input input-bordered rounded-xl text-base"
          />
        </div>

        {previewMonthly > 0 && (
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500">ยอดชำระต่อเดือนโดยประมาณ</span>
            <span className="text-lg font-black text-primary">{formatCurrency(previewMonthly)}</span>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <label className="label cursor-pointer flex items-center gap-3">
            <input
              {...register("include_in_income")}
              type="checkbox"
              className="checkbox checkbox-primary"
            />
            <span className="label-text font-bold text-blue-900">
              นำยอดเงินต้นเข้าเป็นรายได้เดือนนี้
              <p className="font-normal text-xs text-blue-700 mt-0.5">
                ยอดเงินต้นจะถูกบวกเข้าใน Spending Pool ทันที
              </p>
            </span>
          </label>
        </div>

        <button 
          type="submit" 
          className={cn("btn btn-primary w-full rounded-xl text-lg h-14", (createLoan.isPending || updateLoan.isPending) && "loading")}
          disabled={createLoan.isPending || updateLoan.isPending}
        >
          {isEditing ? "อัปเดตรายการ" : "บันทึกรายการ"}
        </button>
      </form>
    </BottomSheet>
  );
}
