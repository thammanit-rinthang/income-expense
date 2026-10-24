"use client";

import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useTransactions, groupTransactionsByDate } from "@/hooks/useTransactions";
import { formatCurrency, cn } from "@/lib/utils";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import TransactionSheet from "@/components/transactions/TransactionSheet";

export default function TransactionsPage() {
  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudget();
  const { data: transactions, isLoading: isTransLoading } = useTransactions(budget?.id || null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "cash" | "card">("all");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState<
    "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
  >("date_desc");

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    let result = [...transactions];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.card?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType === "cash") {
      result = result.filter((t) => t.category_id != null);
    } else if (filterType === "card") {
      result = result.filter((t) => t.card_id != null);
    }

    // Date filter
    if (filterDate) {
      result = result.filter((t) => dayjs(t.created_at).format("YYYY-MM-DD") === filterDate);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date_desc")
        return dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf();
      if (sortBy === "date_asc")
        return dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf();
      if (sortBy === "amount_desc") return Number(b.amount) - Number(a.amount);
      if (sortBy === "amount_asc") return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return result;
  }, [transactions, searchTerm, filterType, filterDate, sortBy]);

  const handleEdit = (t: any) => {
    setSelectedTransaction(t);
    setIsSheetOpen(true);
  };

  const grouped = groupTransactionsByDate(filteredAndSortedTransactions);

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Page Title & Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-base-content/60 hover:text-base-content hover:bg-base-100 rounded-xl transition-colors"
              title="กลับหน้าหลัก"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-base-content">
                ประวัติรายการทั้งหมด
              </h1>
              <p className="text-xs text-base-content/60">
                ค้นหา กรอง และตรวจสอบรายการใช้จ่ายทั้งหมดในรอบบิลนี้
              </p>
            </div>
          </div>

          <span className="finance-chip px-3 py-1 text-xs font-bold text-base-content/70">
            {filteredAndSortedTransactions.length} รายการ
          </span>
        </div>

        {/* Filters Toolbar */}
        <div className="finance-card p-4 sm:p-5 bg-base-100 border border-base-300 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-8 relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                size={16}
              />
              <input
                type="text"
                placeholder="ค้นหารายละเอียด หมวดหมู่ หรือบัตร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-base-200/50 border border-base-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Date Picker */}
            <div className="sm:col-span-4 relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                size={15}
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-8 py-2.5 bg-base-200/50 border border-base-300 rounded-xl text-xs font-bold focus:outline-none focus:border-primary transition-colors",
                  filterDate && "border-primary"
                )}
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-error"
                  title="ล้างตัวกรองวันที่"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Type & Sort Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-base-200">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-base-200/70 rounded-xl border border-base-300/60">
              <button
                onClick={() => setFilterType("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterType === "all"
                    ? "bg-primary text-primary-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-100"
                )}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType("cash")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterType === "cash"
                    ? "bg-primary text-primary-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-100"
                )}
              >
                <Receipt size={13} />
                <span>เงินสด</span>
              </button>
              <button
                onClick={() => setFilterType("card")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterType === "card"
                    ? "bg-primary text-primary-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-100"
                )}
              >
                <CreditCard size={13} />
                <span>บัตรเครดิต</span>
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-base-content/40 mr-1 hidden sm:inline">
                เรียงตาม:
              </span>
              <button
                onClick={() => setSortBy("date_desc")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  sortBy === "date_desc"
                    ? "bg-base-content text-base-100"
                    : "bg-base-200 text-base-content/60 hover:text-base-content"
                )}
              >
                ล่าสุด
              </button>
              <button
                onClick={() => setSortBy("amount_desc")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  sortBy === "amount_desc"
                    ? "bg-base-content text-base-100"
                    : "bg-base-200 text-base-content/60 hover:text-base-content"
                )}
              >
                ยอดมากสุด
              </button>
              <button
                onClick={() => setSortBy("amount_asc")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                  sortBy === "amount_asc"
                    ? "bg-base-content text-base-100"
                    : "bg-base-200 text-base-content/60 hover:text-base-content"
                )}
              >
                ยอดน้อยสุด
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div>
          {isTransLoading || isBudgetLoading ? (
            <div className="flex justify-center p-12">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300">
              <SlidersHorizontal size={40} className="mx-auto text-base-content/30 mb-3" />
              <p className="text-sm font-semibold text-base-content/60">ไม่พบรายการที่ค้นหา</p>
              <p className="text-xs text-base-content/40 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Calendar size={13} className="text-primary" />
                    <h4 className="text-xs font-bold text-base-content/60">
                      {dayjs(date).format("D MMMM YYYY")}
                    </h4>
                  </div>

                  <div className="finance-card bg-base-100 border border-base-300 divide-y divide-base-200 overflow-hidden">
                    {items.map((t) => {
                      const isCreditCard = Boolean(t.card_id);
                      const isIncome =
                        t.category?.name?.includes("รายได้") ||
                        t.description?.includes("รายได้");

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleEdit(t)}
                          className="flex items-center justify-between p-4 hover:bg-base-200/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "p-2.5 rounded-xl shrink-0",
                                isIncome
                                  ? "bg-success/10 text-success"
                                  : isCreditCard
                                  ? "bg-purple-500/10 text-purple-600"
                                  : "bg-primary/10 text-primary"
                              )}
                            >
                              {isCreditCard ? <CreditCard size={18} /> : <Receipt size={18} />}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-sm text-base-content truncate">
                                {t.description || t.category?.name || t.card?.name || "ทั่วไป"}
                              </p>
                              {t.description && (t.category?.name || t.card?.name) && (
                                <p className="text-[11px] text-base-content/50 truncate">
                                  {t.category?.name || t.card?.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <p
                            className={cn(
                              "tabular-nums font-bold text-sm sm:text-base shrink-0 ml-3",
                              isIncome
                                ? "text-success"
                                : isCreditCard
                                ? "text-purple-600"
                                : "text-error"
                            )}
                          >
                            {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <TransactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        budgetId={budget?.id || 0}
        transaction={selectedTransaction}
      />
    </div>
  );
}
