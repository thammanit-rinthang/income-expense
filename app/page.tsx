"use client";

import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import RecentTransactions from "@/components/transactions/RecentTransactions";
import CombinedDashboard from "@/components/summary/CombinedDashboard";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import BudgetEditSheet from "@/components/budget/BudgetEditSheet";
import { Settings2, AlertCircle, Circle } from "lucide-react";
import { useFixedCosts, useToggleFixedCost } from "@/hooks/useFixedCosts";
import { useCategories } from "@/hooks/useCategories";
import CategoryItem from "@/components/categories/CategoryItem";
import toast from "react-hot-toast";
import Link from "next/link";
import { useMonthStore } from "@/store/monthStore";
import { useEffect, useRef } from "react";

export default function Home() {
  const { data: budget, isLoading } = useMonthlyBudget();
  const { dashboardView } = useUIStore();
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
  
  const showIncomeWarning = is25thOrLater && isCurrentMonth && budget && Number(budget.total_income) === 0;

  useEffect(() => {
    if (showIncomeWarning && !hasAutoOpened.current) {
      setIsBudgetEditOpen(true);
      hasAutoOpened.current = true;
    }
  }, [showIncomeWarning]);

  const unpaidFixedCosts = fixedCosts?.filter(f => !f.is_paid) || [];
  const allocatedCategories = categories?.filter(c => c.monthly_budget && Number(c.monthly_budget) > 0) || [];
  const actualSpent = Number(budget?.actual_spent || 0);
  const reservedAmount = Number(budget?.reserved_amount || 0);

  const handleToggleFixedCost = (id: number, is_paid: boolean) => {
    toggleFixedCost({ id, is_paid }, {
      onSuccess: () => toast.success(is_paid ? "จ่ายแล้ว!" : "ยกเลิกการจ่าย"),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />
      
      <div className="flex-1 px-4 pt-6 pb-24 space-y-5">
        {dashboardView === "personal" ? (
          <>
            {/* Income Warning Banner */}
            {showIncomeWarning && (
              <section 
                onClick={() => setIsBudgetEditOpen(true)}
                className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 cursor-pointer animate-pulse"
              >
                <div className="bg-error text-white p-2 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-error">ยังไม่ได้ระบุรายรับเดือนนี้</p>
                  <p className="text-[10px] text-error/70 font-medium">วันนี้วันที่ {today.getDate()} แล้ว กรุณาระบุรายรับเพื่อให้ระบบคำนวณงบประมาณ</p>
                </div>
              </section>
            )}

            {/* Remaining Pool Summary Card */}
            <section className="bg-primary p-6 rounded-xl relative overflow-hidden text-primary-content">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium opacity-80">เงินใช้ได้คงเหลือ</p>
                  <button 
                    onClick={() => setIsBudgetEditOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors -mr-2 -mt-2"
                  >
                    <Settings2 size={18} />
                  </button>
                </div>
                
                <h2 className="text-4xl font-bold tracking-tight mb-6">
                  {isLoading ? "..." : formatCurrency(budget?.remaining_spending_pool || 0)}
                </h2>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">รายรับ</p>
                    <p className="text-sm font-bold">
                      {isLoading ? "..." : formatCurrency(budget?.total_income || 0)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">กันไว้</p>
                    <p className="text-sm font-bold">
                      {isLoading ? "..." : formatCurrency(reservedAmount)}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">ใช้ไปแล้ว</p>
                    <p className="text-sm font-bold">
                      {isLoading ? "..." : formatCurrency(actualSpent)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Unpaid Fixed Costs */}
            {unpaidFixedCosts.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-base-content/40">สิ่งที่ต้องจ่าย</h3>
                </div>
                <div className="grid gap-2">
                  {unpaidFixedCosts.map((fixed) => (
                    <div 
                      key={fixed.id} 
                      className="bg-base-100 p-2 rounded-xl border-[0.5px] border-base-300 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                          disabled={isToggling}
                          className={`transition-colors ${isToggling ? "text-base-200 cursor-not-allowed" : "text-base-300 hover:text-primary"}`}
                        >
                          <Circle size={24} />
                        </button>
                        <div>
                          <p className="font-bold text-base-content">{fixed.name}</p>
                          <p className="text-[10px] font-black text-primary uppercase">
                            {formatCurrency(fixed.amount)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => !isToggling && handleToggleFixedCost(fixed.id, true)}
                        disabled={isToggling}
                        className="btn btn-xs btn-primary rounded-full px-3 disabled:bg-primary/50"
                      >
                        {isToggling ? <span className="loading loading-spinner loading-xs"></span> : "จ่ายเลย"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Category Progress */}
            {allocatedCategories.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-base-content/40">งบรายหมวด</h3>
                  <span className="text-[10px] font-black text-base-content/40 uppercase tracking-wider">
                    {allocatedCategories.length} หมวดหมู่
                  </span>
                </div>
                <div className="grid gap-2">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-base-100 p-5 rounded-xl border-[0.5px] border-base-300">
                <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1">รายรับเดือนนี้</p>
                <p className="text-xl font-black text-success">
                  {isLoading ? "..." : formatCurrency(budget?.total_income || 0)}
                </p>
              </div>
              <div className="bg-base-100 p-5 rounded-xl border-[0.5px] border-base-300">
                <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1">จ่ายจริงแล้ว</p>
                <p className="text-xl font-black text-error">
                  {isLoading ? "..." : formatCurrency(budget?.cash_spent || 0)}
                </p>
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="space-y-4 pb-12">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-bold text-base-content/40">รายการล่าสุด</h3>
                <Link href="/transactions" className="text-xs font-bold text-primary px-2 py-1 hover:bg-primary/5 rounded-lg transition-colors">
                  ดูทั้งหมด
                </Link>
              </div>
              
              {budget && <RecentTransactions budgetId={budget.id} />}
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
