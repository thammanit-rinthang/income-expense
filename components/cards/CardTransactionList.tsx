"use client";

import { useState } from "react";
import { useCardTransactions, useCardPayments, useCards, useDeleteCardPayment } from "@/hooks/useCards";
import { ShoppingBag, ArrowLeft, CheckCircle2, CreditCard, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { cn } from "@/lib/utils";

dayjs.locale("th");

interface CardTransactionListProps {
  cardId: number;
  cardName: string;
  onBack: () => void;
}

export default function CardTransactionList({ cardId, cardName, onBack }: CardTransactionListProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "payments">("transactions");
  
  const { data: cards } = useCards();
  const { data: transactions, isLoading: isTxLoading } = useCardTransactions(cardId);
  const { data: payments, isLoading: isPaymentsLoading } = useCardPayments(cardId);
  const { mutate: deletePayment, isPending: isDeletingPayment } = useDeleteCardPayment();

  const card = cards?.find(c => c.id === cardId);

  const totalSpent = transactions ? transactions.reduce((acc, t) => acc + Number(t.amount), 0) : 0;
  const totalPaid = payments ? payments.reduce((acc, p) => acc + Number(p.amount), 0) : 0;
  const remainingToPay = card ? Number(card.statement_balance) : (totalSpent - totalPaid);

  const isLoading = isTxLoading || isPaymentsLoading;

  const handleDeletePayment = (id: number) => {
    if (!window.confirm("ลบรายการชำระนี้และคืนยอดกลับเข้าบัตร/เงินคงเหลือใช่ไหม?")) return;
    deletePayment({ id, cardId });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-base-200 rounded-xl transition-colors bg-base-100 border-[0.5px] border-base-300"
        >
          <ArrowLeft size={20} className="text-base-content/60" />
        </button>
        <div>
          <h2 className="text-xl font-black text-base-content">{cardName}</h2>
          <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest">การจัดการบัตรเครดิต</p>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-base-100 rounded-2xl border-[0.5px] border-base-300 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">สถานะรอบบิลปัจจุบัน</span>
          <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-wide">
            {dayjs().format("MMMM BBBB")}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-base-200/50 rounded-xl flex flex-col justify-between animate-in fade-in slide-in-from-bottom duration-300">
            <span className="text-[9px] text-base-content/50 font-bold">ยอดใช้จ่ายรอบนี้</span>
            <p className="text-sm font-black text-base-content mt-1">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="p-3 bg-base-200/50 rounded-xl flex flex-col justify-between animate-in fade-in slide-in-from-bottom duration-300 delay-75">
            <span className="text-[9px] text-base-content/50 font-bold">ชำระแล้ว</span>
            <p className="text-sm font-black text-emerald-600 mt-1">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="p-3 bg-base-200/50 rounded-xl flex flex-col justify-between animate-in fade-in slide-in-from-bottom duration-300 delay-150">
            <span className="text-[9px] text-base-content/50 font-bold">ยอดค้างชำระ</span>
            <p className="text-sm font-black text-rose-600 mt-1">
              {formatCurrency(remainingToPay)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-base-200">
        <button
          onClick={() => setActiveTab("transactions")}
          className={cn(
            "flex-1 pb-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2",
            activeTab === "transactions" 
              ? "border-primary text-primary font-black" 
              : "border-transparent text-base-content/40 hover:text-base-content"
          )}
        >
          <CreditCard size={16} />
          รายการใช้จ่าย ({transactions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex-1 pb-3 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2",
            activeTab === "payments" 
              ? "border-primary text-primary font-black" 
              : "border-transparent text-base-content/40 hover:text-base-content"
          )}
        >
          <CheckCircle2 size={16} />
          ประวัติการชำระ ({payments?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-base-100 rounded-xl animate-pulse border-[0.5px] border-base-300" />
          ))}
        </div>
      ) : activeTab === "transactions" ? (
        transactions && transactions.length > 0 ? (
          <div className="bg-base-100 rounded-xl border-[0.5px] border-base-300 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
            {transactions.map((t, index) => (
              <div
                key={t.id}
                className={cn(
                  "p-4 flex items-center justify-between transition-colors hover:bg-base-50/50",
                  index !== transactions.length - 1 && "border-b-[0.5px] border-base-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/60">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-base-content">
                      {t.description || t.category?.name || "รายการบัตรเครดิต"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-base-content/40 font-bold uppercase">
                        {dayjs(t.created_at).format("DD MMM BBBB")}
                      </span>
                      {t.description && t.category && (
                        <>
                          <span className="text-base-300">•</span>
                          <span className="text-[9px] bg-base-200 text-base-content/60 px-2 py-0.5 rounded-lg font-black uppercase">
                            {t.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-base-content text-lg">
                    {formatCurrency(Number(t.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300 animate-in fade-in duration-300">
            <ShoppingBag className="mx-auto text-base-300 mb-4" size={48} />
            <p className="text-base-content/50 font-medium">ยังไม่มีรายการใช้จ่ายในรอบบิลนี้</p>
          </div>
        )
      ) : (
        payments && payments.length > 0 ? (
          <div className="bg-base-100 rounded-xl border-[0.5px] border-base-300 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
            {payments.map((p, index) => (
              <div
                key={p.id}
                className={cn(
                  "p-4 flex items-center justify-between transition-colors hover:bg-base-50/50",
                  index !== payments.length - 1 && "border-b-[0.5px] border-base-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-base-content">
                      {p.note || "ชำระยอดบัตรเครดิต"}
                    </p>
                    <span className="text-[10px] text-base-content/40 font-bold uppercase">
                      {dayjs(p.paid_at).format("DD MMM BBBB")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600 text-lg">
                    -{formatCurrency(Number(p.amount))}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeletePayment(p.id)}
                    disabled={isDeletingPayment}
                    className="btn btn-ghost btn-xs text-error px-1 mt-1 disabled:opacity-40"
                    aria-label="ลบรายการชำระบัตร"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300 animate-in fade-in duration-300">
            <CheckCircle2 className="mx-auto text-base-300 mb-4" size={48} />
            <p className="text-base-content/50 font-medium">ยังไม่มีการชำระเงินในรอบบิลนี้</p>
          </div>
        )
      )}
    </div>
  );
}
