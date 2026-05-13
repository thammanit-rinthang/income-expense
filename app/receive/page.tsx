"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import {
  useReceivedPayments,
  useReceivePayment,
  useDeleteReceivedPayment,
} from "@/hooks/useReceivedPayments";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  Trash2,
  User,
  CircleDollarSign,
  FileText,
  ChevronRight,
  Inbox,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const schema = z.object({
  amount: z.string().min(1).transform((v) => parseFloat(v)).pipe(z.number().positive("กรุณาระบุจำนวนเงินที่มากกว่า 0")),
  sender: z.string().min(1, "กรุณาระบุชื่อผู้โอน"),
  note: z.string().optional(),
});

type FormInput = { amount: string; sender: string; note?: string };
type FormData = { amount: number; sender: string; note?: string };

export default function ReceivePaymentPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudget();
  const { data: payments, isLoading: isPaymentsLoading } = useReceivedPayments(budget?.id ?? null);
  const { mutate: receivePayment, isPending } = useReceivePayment();
  const { mutate: deletePayment, isPending: isDeleting } = useDeleteReceivedPayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: { amount: "", sender: "", note: "" },
  });

  const totalReceived = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    if (!budget) return;
    receivePayment(
      { budget_id: budget.id, amount: data.amount, sender: data.sender, note: data.note ?? "" },
      {
        onSuccess: () => {
          toast.success("บันทึกการรับเงินเรียบร้อย 🎉");
          reset();
          setShowForm(false);
        },
        onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!budget) return;
    if (!confirm("ลบรายการนี้และหักยอดรายรับออกใช่หรือไม่?")) return;
    deletePayment(
      { id, budget_id: budget.id },
      {
        onSuccess: () => toast.success("ลบรายการแล้ว"),
        onError: () => toast.error("เกิดข้อผิดพลาด"),
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />

      <div className="px-4 pt-6 pb-28 space-y-5">
        {/* Summary Card */}
        <section className="bg-success p-6 rounded-2xl relative overflow-hidden text-success-content">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -right-4 w-24 h-24 bg-white/10 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft size={18} className="opacity-70" />
              <p className="text-sm font-semibold opacity-80">ยอดรับเงินเดือนนี้</p>
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-4">
              {isBudgetLoading ? "..." : formatCurrency(totalReceived)}
            </h2>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 w-fit">
              <TrendingUp size={14} />
              <p className="text-xs font-bold opacity-90">
                รายรับรวม {isBudgetLoading ? "..." : formatCurrency(budget?.total_income ?? 0)}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Button / Inline Form Toggle */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-success w-full rounded-xl text-base font-bold gap-2"
          >
            <ArrowDownLeft size={20} />
            บันทึกรับเงิน
          </button>
        ) : (
          <section className="bg-base-100 rounded-2xl border-[0.5px] border-base-300 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
              <h3 className="font-bold text-base-content">บันทึกรับเงิน</h3>
              <button
                onClick={() => { setShowForm(false); reset(); }}
                className="text-xs text-base-content/40 font-medium hover:text-base-content transition-colors"
              >
                ยกเลิก
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Amount */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-base-content flex items-center gap-1.5">
                    <CircleDollarSign size={14} className="text-success" />
                    จำนวนเงิน (บาท)
                  </span>
                </label>
                <input
                  {...register("amount")}
                  id="receive-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  inputMode="decimal"
                  className={cn(
                    "input input-bordered rounded-xl text-2xl font-black tracking-tight",
                    errors.amount && "input-error"
                  )}
                />
                {errors.amount && (
                  <span className="text-error text-xs mt-1 px-1">{errors.amount.message}</span>
                )}
              </div>

              {/* Sender */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-base-content flex items-center gap-1.5">
                    <User size={14} className="text-success" />
                    ผู้โอน
                  </span>
                </label>
                <input
                  {...register("sender")}
                  id="receive-sender"
                  type="text"
                  placeholder="ชื่อผู้โอนเงิน"
                  className={cn(
                    "input input-bordered rounded-xl",
                    errors.sender && "input-error"
                  )}
                />
                {errors.sender && (
                  <span className="text-error text-xs mt-1 px-1">{errors.sender.message}</span>
                )}
              </div>

              {/* Note */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-bold text-base-content flex items-center gap-1.5">
                    <FileText size={14} className="text-success" />
                    หมายเหตุ (ไม่บังคับ)
                  </span>
                </label>
                <input
                  {...register("note")}
                  id="receive-note"
                  type="text"
                  placeholder="เช่น เงินเดือน, โบนัส, ค่าจ้าง..."
                  className="input input-bordered rounded-xl"
                />
              </div>

              <button
                id="receive-submit-btn"
                type="submit"
                disabled={isPending || isBudgetLoading}
                className="btn btn-success w-full rounded-xl text-base font-bold mt-2"
              >
                {isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <ArrowDownLeft size={18} />
                    ยืนยันรับเงิน
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* Payment History */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-base-content/40">ประวัติการรับเงิน</h3>
            {payments && payments.length > 0 && (
              <span className="text-[10px] font-black text-base-content/40 uppercase tracking-wider">
                {payments.length} รายการ
              </span>
            )}
          </div>

          {isPaymentsLoading || isBudgetLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-success" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="grid gap-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-base-100 rounded-xl border-[0.5px] border-base-300 px-4 py-3 flex items-center gap-3"
                >
                  {/* Icon */}
                  <div className="bg-success/10 p-2.5 rounded-xl flex-shrink-0">
                    <ArrowDownLeft size={18} className="text-success" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base-content truncate">{payment.sender}</p>
                    {payment.note && (
                      <p className="text-xs text-base-content/50 truncate">{payment.note}</p>
                    )}
                    <p className="text-[10px] text-base-content/30 mt-0.5 font-medium">
                      {dayjs(payment.received_at).format("D MMM YYYY · HH:mm")}
                    </p>
                  </div>

                  {/* Amount + Delete */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-success font-black text-base">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <button
                      id={`delete-payment-${payment.id}`}
                      onClick={() => handleDelete(payment.id)}
                      disabled={isDeleting}
                      className="btn btn-xs btn-ghost text-base-content/30 hover:text-error hover:bg-error/10 rounded-lg p-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 bg-base-100 rounded-xl border-[0.5px] border-dashed border-base-300">
              <Inbox size={40} className="mx-auto text-base-300 mb-3" />
              <p className="text-sm font-semibold text-base-content/40">
                ยังไม่มีรายการรับเงิน
              </p>
              <p className="text-xs text-base-content/25 mt-1">
                กดปุ่ม &quot;บันทึกรับเงิน&quot; เพื่อเริ่มต้น
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
