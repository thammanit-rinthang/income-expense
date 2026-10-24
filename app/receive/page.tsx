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
  Inbox,
  TrendingUp,
  Plus,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const schema = z.object({
  amount: z
    .string()
    .min(1)
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive("กรุณาระบุจำนวนเงินที่มากกว่า 0")),
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

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-base-content">
              รับเงิน / เงินคืน
            </h2>
            <p className="text-xs text-base-content/60">
              บันทึกเงินโอนเข้า เงินคืน หรือรายรับพิเศษนอกเหนือจากเงินเดือน
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-sm btn-primary rounded-xl px-4 font-bold flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>{showForm ? "ปิดฟอร์ม" : "บันทึกรับเงิน"}</span>
          </button>
        </div>

        {/* Responsive SaaS Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Summary Card & Entry Form */}
          <div className="lg:col-span-5 space-y-5">
            {/* Summary Card */}
            <section className="finance-card p-5 sm:p-6 bg-base-100 border border-base-300 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-success/10 text-success">
                  <ArrowDownLeft size={18} />
                </div>
                <span className="text-xs font-bold text-success uppercase tracking-wider">
                  ยอดรับเงินพิเศษเดือนนี้
                </span>
              </div>

              <div className="tabular-nums font-black text-3xl sm:text-4xl text-base-content">
                {isBudgetLoading ? "..." : formatCurrency(totalReceived)}
              </div>

              <div className="p-3 bg-base-200/60 rounded-xl border border-base-300/50 flex items-center justify-between text-xs">
                <span className="text-base-content/60">รายรับหลักในรอบนี้:</span>
                <span className="tabular-nums font-bold text-base-content">
                  {isBudgetLoading ? "..." : formatCurrency(budget?.total_income ?? 0)}
                </span>
              </div>
            </section>

            {/* Entry Form (Visible on toggle or permanently on desktop if preferred) */}
            {showForm && (
              <section className="finance-card p-5 bg-base-100 border border-base-300 space-y-4">
                <div className="flex items-center justify-between border-b border-base-200 pb-3">
                  <h3 className="font-bold text-sm text-base-content">กรอกข้อมูลการรับเงิน</h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      reset();
                    }}
                    className="text-xs text-base-content/40 hover:text-base-content transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Amount */}
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
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
                        "input input-bordered rounded-xl text-xl font-bold tabular-nums",
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
                      <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
                        <User size={14} className="text-success" />
                        ผู้โอน
                      </span>
                    </label>
                    <input
                      {...register("sender")}
                      id="receive-sender"
                      type="text"
                      placeholder="ชื่อผู้โอนเงิน"
                      className={cn("input input-bordered rounded-xl", errors.sender && "input-error")}
                    />
                    {errors.sender && (
                      <span className="text-error text-xs mt-1 px-1">{errors.sender.message}</span>
                    )}
                  </div>

                  {/* Note */}
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-bold text-xs text-base-content flex items-center gap-1.5">
                        <FileText size={14} className="text-success" />
                        หมายเหตุ (ไม่บังคับ)
                      </span>
                    </label>
                    <input
                      {...register("note")}
                      id="receive-note"
                      type="text"
                      placeholder="เช่น เงินคืนเพื่อน, ค่าจ้างพิเศษ..."
                      className="input input-bordered rounded-xl"
                    />
                  </div>

                  <button
                    id="receive-submit-btn"
                    type="submit"
                    disabled={isPending || isBudgetLoading}
                    className="btn btn-success w-full rounded-xl text-sm font-bold"
                  >
                    {isPending ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <ArrowDownLeft size={16} />
                        <span>ยืนยันรับเงิน</span>
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Right Column: History Ledger */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-base-content">ประวัติการรับเงิน</h3>
              {payments && payments.length > 0 && (
                <span className="finance-chip px-2.5 py-0.5 text-[11px] font-bold text-base-content/60">
                  {payments.length} รายการ
                </span>
              )}
            </div>

            {isPaymentsLoading || isBudgetLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-success" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="finance-card p-4 flex items-center justify-between gap-3 hover:bg-base-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-success/10 p-2.5 rounded-xl shrink-0 text-success">
                        <ArrowDownLeft size={18} />
                      </div>

                      <div className="truncate">
                        <p className="font-bold text-sm text-base-content truncate">{payment.sender}</p>
                        {payment.note && (
                          <p className="text-xs text-base-content/50 truncate">{payment.note}</p>
                        )}
                        <p className="text-[10px] text-base-content/40 mt-0.5">
                          {dayjs(payment.received_at).format("D MMM YYYY · HH:mm")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <p className="tabular-nums text-success font-black text-sm sm:text-base">
                        +{formatCurrency(payment.amount)}
                      </p>
                      <button
                        id={`delete-payment-${payment.id}`}
                        onClick={() => handleDelete(payment.id)}
                        disabled={isDeleting}
                        aria-label="ลบรายการ"
                        className="btn btn-xs btn-ghost text-base-content/30 hover:text-error hover:bg-error/10 rounded-lg p-1.5"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-base-100 rounded-xl border border-dashed border-base-300">
                <Inbox size={40} className="mx-auto text-base-content/30 mb-3" />
                <p className="text-sm font-semibold text-base-content/50">ยังไม่มีรายการรับเงิน</p>
                <p className="text-xs text-base-content/40 mt-1">
                  กดปุ่ม &quot;บันทึกรับเงิน&quot; เพื่อเริ่มต้น
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
