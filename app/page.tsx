"use client";

import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import RecentTransactions from "@/components/transactions/RecentTransactions";
import CombinedDashboard from "@/components/summary/CombinedDashboard";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency, cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import BudgetEditSheet from "@/components/budget/BudgetEditSheet";
import {
  Settings2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  ArrowRight,
  Check,
} from "lucide-react";
import { useFixedCosts, useToggleFixedCost } from "@/hooks/useFixedCosts";
import { useCategories } from "@/hooks/useCategories";
import CategoryItem from "@/components/categories/CategoryItem";
import toast from "react-hot-toast";
import Link from "next/link";
import { useMonthStore } from "@/store/monthStore";

export default function Home() {
  const { data: budget, isLoading } = useMonthlyBudget();
  const { dashboardView, openTransactionSheet } = useUIStore();
  const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);

  const { data: fixedCosts } = useFixedCosts(budget?.id || null);
  const { data: categories } = useCategories(budget?.id || null);
  const { selectedMonth } = useMonthStore();
  const { mutate: toggleFixedCost, isPending: isToggling } = useToggleFixedCost();
  const hasAutoOpened = useRef(false);

  const today = new Date();
  const is25thOrLater = today.getDate() >= 25;
  const isCurrentMonth =
    selectedMonth.getMonth() === today.getMonth() &&
    selectedMonth.getFullYear() === today.getFullYear();

  const showIncomeWarning =
    is25thOrLater && isCurrentMonth && budget && Number(budget.total_income) === 0;

  useEffect(() => {
    if (showIncomeWarning && !hasAutoOpened.current) {
      setIsBudgetEditOpen(true);
      hasAutoOpened.current = true;
    }
  }, [showIncomeWarning]);

  const unpaidFixedCosts = fixedCosts?.filter((f) => !f.is_paid) || [];
  const paidFixedCosts = fixedCosts?.filter((f) => f.is_paid) || [];
  const allocatedCategories =
    categories?.filter((c) => c.monthly_budget && Number(c.monthly_budget) > 0) || [];
  const actualSpent = Number(budget?.actual_spent || 0);

  const handleToggleFixedCost = (id: number, is_paid: boolean) => {
    toggleFixedCost(
      { id, is_paid },
      {
        onSuccess: () => toast.success(is_paid ? "ชำระแล้วเรียบร้อย" : "ยกเลิกสถานะชำระ"),
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {dashboardView === "personal" ? (
          <>
            {/* Income Warning Banner */}
            {showIncomeWarning && (
              <section
                onClick={() => setIsBudgetEditOpen(true)}
                className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-center justify-between gap-3 cursor-pointer hover:bg-error/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-error text-white flex items-center justify-center shrink-0">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-error">
                      ยังไม่ได้ระบุรายรับของเดือนนี้
                    </p>
                    <p className="text-[11px] text-error/80">
                      กรุณาระบุรายได้เพื่อให้ระบบคำนวณเงินใช้ได้คงเหลือ
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-error underline whitespace-nowrap">
                  ระบุรายรับ
                </span>
              </section>
            )}

            {/* ── Minimal Flow Hero: Remaining Spending Pool ── */}
            <section className="p-6 sm:p-8 rounded-2xl bg-base-100 border border-base-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-1">
                    เงินใช้ได้คงเหลือในรอบนี้ (Remaining Pool)
                  </span>
                  <div className="tabular-nums font-black text-4xl sm:text-5xl text-base-content tracking-tight">
                    {isLoading ? "..." : formatCurrency(budget?.remaining_spending_pool || 0)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <button
                    onClick={openTransactionSheet}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-content text-xs font-bold hover:bg-primary/90 transition-all active:scale-[0.98]"
                  >
                    <Plus size={16} />
                    <span>บันทึกรายจ่าย</span>
                  </button>
                  <button
                    onClick={() => setIsBudgetEditOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-base-200 text-base-content/70 hover:text-base-content text-xs font-semibold hover:bg-base-300 transition-colors"
                    title="แก้ไขรายรับและเงินกันไว้"
                  >
                    <Settings2 size={15} />
                    <span className="hidden sm:inline">ตั้งค่างบ</span>
                  </button>
                </div>
              </div>

              {/* The System Financial Flow Stream */}
              <div className="pt-4 border-t border-base-200">
                <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block mb-2.5">
                  เส้นทางการคำนวณงบประมาณ
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/50 block text-[11px] mb-1">1. รายรับตั้งต้น</span>
                    <span className="tabular-nums font-bold text-success text-sm block">
                      {isLoading ? "..." : formatCurrency(budget?.total_income || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/50 block text-[11px] mb-1">2. หักเงินกันไว้</span>
                    <span className="tabular-nums font-bold text-base-content text-sm block">
                      {isLoading ? "..." : formatCurrency(budget?.reserved_amount || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/50 block text-[11px] mb-1">3. หักจ่ายประจำ</span>
                    <span className="tabular-nums font-bold text-base-content text-sm block">
                      {isLoading ? "..." : formatCurrency(fixedCosts?.reduce((sum, f) => sum + Number(f.amount), 0) || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/50 block text-[11px] mb-1">4. หักใช้ไปแล้ว</span>
                    <span className="tabular-nums font-bold text-error text-sm block">
                      {isLoading ? "..." : formatCurrency(actualSpent)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Responsive 2-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Category Budgets + Recent Transactions */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Category Budgets */}
                {allocatedCategories.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h3 className="text-sm font-bold text-base-content">งบประมาณตามหมวดหมู่</h3>
                        <p className="text-xs text-base-content/50">ติดตามวงเงินที่ใช้ไปในแต่ละหมวด</p>
                      </div>
                      <Link
                        href="/income"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        จัดการงบ <ArrowRight size={13} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allocatedCategories.map((category) => (
                        <CategoryItem
                          key={category.id}
                          name={category.name}
                          spent={category.spent || 0}
                          budget={category.monthly_budget}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Recent Transactions Feed */}
                <section className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <div>
                      <h3 className="text-sm font-bold text-base-content">รายการใช้จ่ายล่าสุด</h3>
                      <p className="text-xs text-base-content/50">ประวัติการบันทึกในรอบนี้</p>
                    </div>
                    <Link
                      href="/transactions"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      ดูทั้งหมด <ArrowUpRight size={14} />
                    </Link>
                  </div>

                  {budget && <RecentTransactions budgetId={budget.id} />}
                </section>
              </div>

              {/* Right Column: Bills to Pay Checklist */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <section className="p-5 rounded-2xl bg-base-100 border border-base-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-base-content">
                        สิ่งที่ต้องจ่าย (Fixed Bills)
                      </h3>
                      <p className="text-xs text-base-content/50">
                        {unpaidFixedCosts.length > 0
                          ? `เหลืออีก ${unpaidFixedCosts.length} รายการที่ต้องจ่าย`
                          : "จ่ายครบทุกรายการแล้ว"}
                      </p>
                    </div>
                    <Link
                      href="/income"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      แก้ไข
                    </Link>
                  </div>

                  {/* Unpaid List */}
                  {unpaidFixedCosts.length > 0 ? (
                    <div className="space-y-2">
                      {unpaidFixedCosts.map((fixed) => (
                        <div
                          key={fixed.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                              disabled={isToggling}
                              aria-label={`ทำเครื่องหมายว่าจ่าย ${fixed.name} แล้ว`}
                              className="w-5 h-5 rounded-md border border-base-300 hover:border-primary flex items-center justify-center transition-colors shrink-0 bg-base-100"
                            >
                              {/* Empty check indicator */}
                            </button>
                            <div className="truncate">
                              <p className="text-xs sm:text-sm font-semibold text-base-content truncate">
                                {fixed.name}
                              </p>
                              <p className="tabular-nums text-xs font-bold text-primary">
                                {formatCurrency(fixed.amount)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                            disabled={isToggling}
                            className="px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 hover:border-primary text-[11px] font-bold text-base-content transition-colors shrink-0"
                          >
                            จ่ายแล้ว
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-success/5 border border-success/15 flex items-center gap-3 text-success">
                      <CheckCircle2 size={18} />
                      <span className="text-xs font-semibold">ชำระค่าใช้จ่ายประจำครบหมดแล้ว</span>
                    </div>
                  )}

                  {/* Paid Bills Summary / Accordion */}
                  {paidFixedCosts.length > 0 && (
                    <div className="pt-3 border-t border-base-200">
                      <span className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider block mb-2">
                        ชำระแล้ว ({paidFixedCosts.length} รายการ)
                      </span>
                      <div className="space-y-1.5 opacity-70">
                        {paidFixedCosts.map((fixed) => (
                          <div
                            key={fixed.id}
                            className="flex items-center justify-between py-1.5 px-2 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <button
                                onClick={() => !isToggling && handleToggleFixedCost(fixed.id, false)}
                                disabled={isToggling}
                                title="คลิกเพื่อยกเลิกสถานะชำระ"
                                className="w-4 h-4 rounded bg-success/20 text-success flex items-center justify-center shrink-0"
                              >
                                <Check size={11} strokeWidth={3} />
                              </button>
                              <span className="line-through text-base-content/60 truncate">
                                {fixed.name}
                              </span>
                            </div>
                            <span className="tabular-nums text-base-content/50 ml-2">
                              {formatCurrency(fixed.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        ) : (
          <CombinedDashboard />
        )}
      </div>

      <BudgetEditSheet
        isOpen={isBudgetEditOpen}
        onClose={() => setIsBudgetEditOpen(false)}
        budget={budget || null}
      />
    </div>
  );
}
