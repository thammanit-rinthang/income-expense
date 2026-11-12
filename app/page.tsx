"use client";

import Header from "@/components/ui/Header";
import { useMonthlyBudget, usePreviousMonthlyBudget } from "@/hooks/useMonthlyBudget";
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
import { useBudgetCardPayments, useCards } from "@/hooks/useCards";
import { useUserStore } from "@/store/userStore";
import CategoryItem from "@/components/categories/CategoryItem";
import toast from "react-hot-toast";
import Link from "next/link";
import { useMonthStore } from "@/store/monthStore";
import dayjs from "dayjs";

export default function Home() {
  const { data: budget, isLoading } = useMonthlyBudget();
  const { data: previousBudget } = usePreviousMonthlyBudget();
  const { dashboardView, openTransactionSheet } = useUIStore();
  const [isBudgetEditOpen, setIsBudgetEditOpen] = useState(false);

  const { data: fixedCosts } = useFixedCosts(budget?.id || null);
  const { data: categories } = useCategories(budget?.id || null);
  const { data: cards } = useCards();
  const { data: cardPayments } = useBudgetCardPayments(budget?.id || null);
  const { currentUser } = useUserStore();
  const { selectedMonth } = useMonthStore();
  const isSelectedMonthPast = dayjs(selectedMonth).isBefore(dayjs(), "month");
  const { mutate: toggleFixedCost, isPending: isToggling } = useToggleFixedCost();
  const hasAutoOpened = useRef(false);

  const today = new Date();
  const is25thOrLater = today.getDate() >= 25;
  const isCurrentMonth =
    selectedMonth.getMonth() === today.getMonth() &&
    selectedMonth.getFullYear() === today.getFullYear();
  const isNextBudgetMonth = is25thOrLater && dayjs(selectedMonth).isSame(dayjs().add(1, "month"), "month");

  const showIncomeWarning =
    is25thOrLater && (isCurrentMonth || isNextBudgetMonth) && budget && Number(budget.total_income) === 0;

  useEffect(() => {
    if (showIncomeWarning && !hasAutoOpened.current) {
      setIsBudgetEditOpen(true);
      hasAutoOpened.current = true;
    }
  }, [showIncomeWarning]);

  const unpaidFixedCosts = fixedCosts?.filter((f) => !f.is_paid) || [];
  const paidFixedCosts = fixedCosts?.filter((f) => f.is_paid) || [];
  const unpaidFixedCostAmount = unpaidFixedCosts.reduce((sum, fixedCost) => sum + Number(fixedCost.amount), 0);
  const cardDueItems = (isSelectedMonthPast ? [] : cards || [])
    .filter((card) => card.person_name === currentUser || !card.person_name)
    .flatMap((card) => {
      const balance = Number(card.statement_balance || 0);
      const minimumPayment = Number(card.minimum_payment || 0);
      const amountPaid = (cardPayments || [])
        .filter((payment) => payment.card_id === card.id)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remainingMinimum = Math.max(minimumPayment - amountPaid, 0);
      if (!card.due_date || balance <= 0 || remainingMinimum <= 0) return [];

      const dueDay = dayjs(card.due_date).date();
      const dueDate = dayjs(selectedMonth)
        .startOf("month")
        .date(Math.min(dayjs(selectedMonth).daysInMonth(), dueDay));
      return [{
        ...card,
        dueDate,
        minimumDue: Math.min(remainingMinimum, balance),
        daysUntilDue: dueDate.startOf("day").diff(dayjs().startOf("day"), "day"),
      }];
    })
    .sort((left, right) => left.dueDate.valueOf() - right.dueDate.valueOf());
  const cardMinimumDue = cardDueItems.reduce((sum, card) => sum + card.minimumDue, 0);
  const allocatedCategories =
    categories?.filter((c) => c.monthly_budget && Number(c.monthly_budget) > 0) || [];
  const actualSpent = Number(budget?.actual_spent || 0);
  const availableAfterBills = Number(budget?.remaining_spending_pool || 0) - unpaidFixedCostAmount - cardMinimumDue;
  const isSelectedMonthCurrent = dayjs(selectedMonth).isSame(dayjs(), "month");
  const isSelectedMonthFuture = dayjs(selectedMonth).isAfter(dayjs(), "month");
  const daysInSelectedMonth = dayjs(selectedMonth).daysInMonth();
  const daysElapsed = isSelectedMonthCurrent ? dayjs().date() : daysInSelectedMonth;
  const daysRemaining = isSelectedMonthCurrent
    ? Math.max(daysInSelectedMonth - dayjs().date() + 1, 1)
    : daysInSelectedMonth;
  const safeDailyAllowance = Math.max(availableAfterBills, 0) / daysRemaining;
  const currentDailyOutflow = actualSpent / Math.max(daysElapsed, 1);
  const previousDailyOutflow = previousBudget
    ? Number(previousBudget.actual_spent || 0) / dayjs(previousBudget.month_year).daysInMonth()
    : null;
  const dailyOutflowChange = previousDailyOutflow && previousDailyOutflow > 0
    ? ((currentDailyOutflow - previousDailyOutflow) / previousDailyOutflow) * 100
    : null;
  const unpaidCostsByDueDate = [...unpaidFixedCosts].sort((left, right) => {
    if (!left.due_date) return right.due_date ? 1 : 0;
    if (!right.due_date) return -1;
    return dayjs(left.due_date).valueOf() - dayjs(right.due_date).valueOf();
  });

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
                      ยังไม่ได้ระบุรายรับของรอบงบนี้
                    </p>
                    <p className="text-[11px] text-error/80">
                      ระบุรายรับเพื่อคำนวณเงินใช้ได้และยอดที่ควรกันไว้
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
                    เงินใช้ได้หลังกันบิลและยอดขั้นต่ำบัตร
                  </span>
                  <div className="tabular-nums font-black text-4xl sm:text-5xl text-base-content tracking-tight">
                    {isLoading ? "..." : formatCurrency(availableAfterBills)}
                  </div>
                  <p className="mt-2 text-xs text-base-content/55">
                    ยอดในงบ {formatCurrency(budget?.remaining_spending_pool || 0)} · บิลค้าง {formatCurrency(unpaidFixedCostAmount)} · ขั้นต่ำบัตร {formatCurrency(cardMinimumDue)}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", availableAfterBills < 0 ? "text-error" : "text-primary")}>
                    {isLoading
                      ? "กำลังคำนวณวงเงินรายวัน..."
                      : availableAfterBills < 0
                      ? `ภาระที่ต้องจ่ายเกินยอดในงบ ${formatCurrency(Math.abs(availableAfterBills))}`
                      : `ใช้ได้เฉลี่ย ${formatCurrency(safeDailyAllowance)} ต่อวัน · เหลือ ${daysRemaining} วัน`}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <button
                    onClick={openTransactionSheet}
                    className="flex min-h-11 items-center gap-1.5 px-4 rounded-xl bg-primary text-primary-content text-xs font-bold hover:bg-primary/90 transition-all active:scale-[0.98]"
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
                <span className="text-xs font-semibold text-base-content/60 block mb-2.5">
                  สรุปยอดของรอบนี้
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/60 block text-xs mb-1">รายรับ</span>
                    <span className="tabular-nums font-bold text-success text-sm block">
                      {isLoading ? "..." : formatCurrency(budget?.total_income || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/60 block text-xs mb-1">เงินที่กันไว้</span>
                    <span className="tabular-nums font-bold text-base-content text-sm block">
                      {isLoading ? "..." : formatCurrency(budget?.reserved_amount || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/60 block text-xs mb-1">บิลที่ยังไม่จ่าย</span>
                    <span className="tabular-nums font-bold text-base-content text-sm block">
                      {isLoading ? "..." : formatCurrency(unpaidFixedCostAmount)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/60 block text-xs mb-1">ขั้นต่ำบัตรที่ถึงกำหนด</span>
                    <span className="tabular-nums font-bold text-base-content text-sm block">
                      {isLoading ? "..." : formatCurrency(cardMinimumDue)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50">
                    <span className="text-base-content/60 block text-xs mb-1">ใช้หรือจ่ายแล้ว</span>
                    <span className="tabular-nums font-bold text-error text-sm block">
                      {isLoading ? "..." : formatCurrency(actualSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {!isSelectedMonthFuture && previousBudget && (
                <div className="flex flex-col gap-1 border-t border-base-200 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-base-content/60">เงินออกเฉลี่ยต่อวัน เทียบกับเดือนก่อน</span>
                  <span className={cn("font-semibold", dailyOutflowChange !== null && dailyOutflowChange > 0 ? "text-error" : "text-success")}>
                    {formatCurrency(currentDailyOutflow)} / วัน
                    {dailyOutflowChange !== null && (
                      <> · {dailyOutflowChange > 0 ? "เพิ่ม" : "ลด"} {Math.abs(dailyOutflowChange).toFixed(0)}% จาก {formatCurrency(previousDailyOutflow || 0)} / วัน</>
                    )}
                  </span>
                </div>
              )}
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
                        รายการที่ต้องจ่าย
                      </h3>
                      <p className="text-xs text-base-content/50">
                        {unpaidFixedCosts.length > 0
                          ? `ค้าง ${unpaidFixedCosts.length} รายการ · ${formatCurrency(unpaidFixedCostAmount)}`
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
                      {unpaidCostsByDueDate.map((fixed) => {
                        const daysUntilDue = fixed.due_date
                          ? dayjs(fixed.due_date).startOf("day").diff(dayjs().startOf("day"), "day")
                          : null;
                        const dueLabel = daysUntilDue === null
                          ? "ยังไม่กำหนดวันจ่าย"
                          : daysUntilDue < 0
                          ? `เลยกำหนด ${Math.abs(daysUntilDue)} วัน`
                          : daysUntilDue === 0
                          ? "ครบกำหนดวันนี้"
                          : `ครบกำหนดใน ${daysUntilDue} วัน`;

                        return (
                        <div
                          key={fixed.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                              disabled={isToggling}
                              aria-label={`ทำเครื่องหมายว่าจ่าย ${fixed.name} แล้ว`}
                              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                            >
                              <span aria-hidden="true" className="h-5 w-5 rounded-md border border-base-300 bg-base-100" />
                            </button>
                            <div className="truncate">
                              <p className="text-xs sm:text-sm font-semibold text-base-content truncate">
                                {fixed.name}
                              </p>
                              <p className="tabular-nums text-xs font-bold text-primary">
                                {formatCurrency(fixed.amount)}
                              </p>
                              <p className={cn("text-xs", daysUntilDue !== null && daysUntilDue <= 3 ? "font-semibold text-warning" : "text-base-content/55")}>
                                {dueLabel}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                            disabled={isToggling}
                            className="min-h-11 shrink-0 rounded-lg border border-base-300 bg-base-100 px-3 text-xs font-bold text-base-content transition-colors hover:border-primary"
                          >
                            จ่ายแล้ว
                          </button>
                        </div>
                        );
                      })}
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
                                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-success hover:bg-success/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-success/20">
                                  <Check size={11} strokeWidth={3} />
                                </span>
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

                {cardDueItems.length > 0 && (
                  <section className="p-5 rounded-2xl bg-base-100 border border-base-300 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-base-content">ยอดขั้นต่ำบัตรเครดิต</h3>
                        <p className="text-xs text-base-content/55">
                          {cardDueItems.length} บัตร · {formatCurrency(cardMinimumDue)}
                        </p>
                      </div>
                      <Link href="/cards" className="text-xs font-semibold text-primary hover:underline">
                        ดูบัตร
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {cardDueItems.map((card) => (
                        <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl bg-base-200/50 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-base-content">{card.name}</p>
                            <p className="text-xs text-base-content/55">
                              ขั้นต่ำ {formatCurrency(card.minimumDue)} · ครบกำหนด {card.dueDate.format("D MMM")}
                            </p>
                          </div>
                          <span className={cn("shrink-0 text-xs font-semibold", card.daysUntilDue <= 3 ? "text-warning" : "text-base-content/60")}>
                            {card.daysUntilDue < 0
                              ? `เลยกำหนด ${Math.abs(card.daysUntilDue)} วัน`
                              : card.daysUntilDue === 0
                              ? "วันนี้"
                              : `อีก ${card.daysUntilDue} วัน`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
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
