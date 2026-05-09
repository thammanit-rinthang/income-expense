"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useMakeCardPayment, CreditCard } from "@/hooks/useCards";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { cn, formatCurrency } from "@/lib/utils";

const paymentSchema = z.object({
  card_id: z.number(),
  amount: z.coerce.number().min(0.01, "ยอดชำระต้องมากกว่า 0"),
  note: z.string().optional(),
  paid_at: z.string().min(1, "กรุณาเลือกวันที่"),
  budget_id: z.coerce.number().optional(),
});

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
}

export default function PaymentSheet({ isOpen, onClose, card }: PaymentSheetProps) {
  const { data: budget } = useMonthlyBudget();
  const { mutate: makePayment, isPending } = useMakeCardPayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      card_id: card?.id || 0,
      amount: card?.statement_balance || 0,
      note: "",
      paid_at: dayjs().format("YYYY-MM-DD"),
      budget_id: budget?.id || undefined,
    },
  });

  useEffect(() => {
    if (card) {
      reset({
        card_id: card.id,
        amount: card.statement_balance,
        note: `ชำระบัตร ${card.name}`,
        paid_at: dayjs().format("YYYY-MM-DD"),
        budget_id: budget?.id || undefined,
      });
    }
  }, [card, budget, reset]);

  const onSubmit = (data: any) => {
    makePayment(data, {
      onSuccess: () => {
        toast.success("บันทึกการชำระเงินแล้ว");
        onClose();
      },
      onError: () => {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      },
    });
  };

  if (!card) return null;

  return (
    <BottomSheet
      id="payment-sheet"
      title={`ชำระบัตร ${card.name}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">ยอดค้างชำระปัจจุบัน</div>
          <div className="text-3xl font-black text-blue-900">
            {formatCurrency(card.statement_balance)}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">ยอดที่ต้องการชำระ</span>
          </label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            className={cn("input input-bordered rounded-xl text-lg font-bold", errors.amount && "input-error")}
          />
          {errors.amount && <span className="text-error text-xs mt-1 px-1">{errors.amount.message}</span>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">วันที่ชำระ</span>
          </label>
          <input
            {...register("paid_at")}
            type="date"
            className="input input-bordered rounded-xl text-base"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">บันทึกเพิ่มเติม</span>
          </label>
          <textarea
            {...register("note")}
            className="textarea textarea-bordered rounded-xl h-24 text-base"
            placeholder="เช่น ชำระจากบัญชีออมทรัพย์"
          ></textarea>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className={cn("btn btn-primary w-full rounded-xl text-lg h-14", isPending && "loading")}
          >
            {isPending ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
