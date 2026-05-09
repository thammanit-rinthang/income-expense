"use client";

import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useTransactions, groupTransactionsByDate } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { ArrowLeft, Search, SlidersHorizontal, CreditCard, Receipt, TrendingUp, TrendingDown, Calendar, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import TransactionSheet from "@/components/transactions/TransactionSheet";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudget();
  const { data: transactions, isLoading: isTransLoading } = useTransactions(budget?.id || null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "cash" | "card">("all");
  const [filterDate, setFilterDate] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    let result = [...transactions];

    // Search filter
    if (searchTerm) {
      result = result.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.card?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType === "cash") {
      result = result.filter(t => t.category_id != null);
    } else if (filterType === "card") {
      result = result.filter(t => t.card_id != null);
    }

    // Date filter
    if (filterDate) {
      result = result.filter(t => dayjs(t.created_at).format("YYYY-MM-DD") === filterDate);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date_desc") return dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf();
      if (sortBy === "date_asc") return dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf();
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
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </Link>
          <h1 className="text-xl font-black text-gray-900">รายการทั้งหมด</h1>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Filters & Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาตามรายละเอียด หรือหมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
            {/* Specific Date Filter */}
            <div className="relative min-w-[150px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-8 py-2 bg-white border rounded-xl text-xs font-bold focus:outline-none transition-all",
                  filterDate ? "border-primary ring-1 ring-primary/20" : "border-gray-100"
                )}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-error transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="h-6 w-[1px] bg-gray-200 mx-1 flex-shrink-0" />

            <button 
              onClick={() => setFilterType("all")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap",
                filterType === "all" ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setFilterType("cash")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2",
                filterType === "cash" ? "bg-blue-500 text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              <Receipt size={14} /> เงินสด
            </button>
            <button 
              onClick={() => setFilterType("card")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2",
                filterType === "card" ? "bg-orange-500 text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              <CreditCard size={14} /> บัตรเครดิต
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             <button 
              onClick={() => setSortBy("date_desc")}
              className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-1",
                sortBy === "date_desc" ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              <Calendar size={12} /> ใหม่ที่สุด
            </button>
            <button 
              onClick={() => setSortBy("amount_desc")}
              className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-1",
                sortBy === "amount_desc" ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              <TrendingUp size={12} /> มาก {">"} น้อย
            </button>
             <button 
              onClick={() => setSortBy("amount_asc")}
              className={cn(
                "px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-1",
                sortBy === "amount_asc" ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-100"
              )}
            >
              <TrendingDown size={12} /> น้อย {">"} มาก
            </button>
          </div>
        </div>

        {/* List */}
        <div className="pb-24">
          {isTransLoading || isBudgetLoading ? (
            <div className="flex justify-center p-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <SlidersHorizontal size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium italic">ไม่พบรายการที่ตรงตามเงื่อนไข</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    {dayjs(date).format("D MMMM YYYY")}
                  </h4>
                  <div className="bg-white rounded-[2rem] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {items.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => handleEdit(t)}
                        className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            t.card_id ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                          )}>
                            {t.card_id ? <CreditCard size={20} /> : <Receipt size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base">{t.description}</p>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                              {t.category?.name || t.card?.name || "ทั่วไป"}
                            </p>
                          </div>
                        </div>
                        <p className={cn(
                          "font-black text-lg tracking-tight",
                          t.card_id ? 'text-gray-900' : 'text-error'
                        )}>
                          {t.card_id ? "" : "-"}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        budgetId={budget?.id || 0}
        transaction={selectedTransaction}
      />
    </div>
  );
}
