"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useCategories } from "@/hooks/useCategories";
import { useFixedCosts, useDeleteFixedCost, useToggleFixedCost } from "@/hooks/useFixedCosts";
import CategoryItem from "@/components/categories/CategoryItem";
import CategorySheet from "@/components/categories/CategorySheet";
import FixedCostItem from "@/components/budget/FixedCostItem";
import FixedCostSheet from "@/components/budget/FixedCostSheet";
import { Plus, Settings2, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import IncomeSummary from "@/components/summary/IncomeSummary";

export default function IncomePage() {
  const [activeTab, setActiveTab] = useState<"categories" | "fixed">("categories");
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  const [isFixedSheetOpen, setIsFixedSheetOpen] = useState(false);
  const [selectedFixedCost, setSelectedFixedCost] = useState<any>(null);

  const { data: budget, isLoading: isBudgetLoading } = useMonthlyBudget();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories(budget?.id || null);
  const { data: fixedCosts, isLoading: isFixedLoading } = useFixedCosts(budget?.id || null);
  
  const { mutate: deleteFixedCost } = useDeleteFixedCost();
  const { mutate: toggleFixedCost } = useToggleFixedCost();

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
    setIsCategorySheetOpen(true);
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategorySheetOpen(true);
  };

  const handleEditFixedCost = (fixedCost: any) => {
    setSelectedFixedCost(fixedCost);
    setIsFixedSheetOpen(true);
  };

  const handleAddFixedCost = () => {
    setSelectedFixedCost(null);
    setIsFixedSheetOpen(true);
  };

  const handleDeleteFixedCost = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      deleteFixedCost({ id, budgetId: budget!.id }, {
        onSuccess: () => toast.success("ลบรายการแล้ว"),
        onError: () => toast.error("ล้มเหลวในการลบรายการ"),
      });
    }
  };

  const handleToggleFixedCost = (id: number, is_paid: boolean) => {
    toggleFixedCost({ id, is_paid });
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />

      <div className="px-5 pt-6 pb-24 space-y-8">
        {/* Tabs */}
        <div className="flex bg-base-100 p-1 rounded-xl border-[0.5px] border-base-300">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "categories" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            หมวดหมู่
          </button>
          <button
            onClick={() => setActiveTab("fixed")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "fixed" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            ค่าใช้จ่ายคงที่
          </button>
        </div>

        {activeTab === "categories" ? (
          <div className="space-y-6">
            <IncomeSummary 
              type="categories" 
              categories={categories} 
            />

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">หมวดหมู่ค่าใช้จ่าย</h2>
              <button 
                onClick={handleAddCategory}
                className="btn btn-sm btn-primary rounded-xl px-4"
              >
                <Plus size={18} className="mr-1" />
                เพิ่ม
              </button>
            </div>

            {isCategoriesLoading || isBudgetLoading ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <div className="grid gap-4">
                {categories?.map((category) => (
                  <CategoryItem
                    key={category.id}
                    name={category.name}
                    spent={category.spent || 0}
                    budget={category.monthly_budget}
                    onClick={() => handleEditCategory(category)}
                  />
                ))}
                {categories?.length === 0 && (
                  <div className="text-center p-12 bg-base-100 rounded-xl border-[0.5px] border-dashed border-base-300">
                    <Settings2 size={48} className="mx-auto text-base-300 mb-4" />
                    <p className="text-gray-400 font-medium">ยังไม่มีหมวดหมู่<br/>เริ่มเพิ่มหมวดหมู่แรกของคุณได้เลย</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <IncomeSummary 
              type="fixed" 
              fixedCosts={fixedCosts} 
            />

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-900">ค่าใช้จ่ายคงที่</h2>
              <button 
                onClick={handleAddFixedCost}
                className="btn btn-sm btn-primary rounded-xl px-4"
              >
                <Plus size={18} className="mr-1" />
                เพิ่ม
              </button>
            </div>

            {isFixedLoading || isBudgetLoading ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <div className="grid gap-4">
                {fixedCosts?.map((fixed) => (
                  <FixedCostItem
                    key={fixed.id}
                    fixedCost={fixed}
                    onEdit={handleEditFixedCost}
                    onDelete={handleDeleteFixedCost}
                    onToggle={handleToggleFixedCost}
                  />
                ))}
                {fixedCosts?.length === 0 && (
                  <div className="text-center p-12 bg-base-100 rounded-xl border-[0.5px] border-dashed border-base-300">
                    <ReceiptText size={48} className="mx-auto text-base-300 mb-4" />
                    <p className="text-gray-400 font-medium">ยังไม่มีค่าใช้จ่ายคงที่<br/>เพิ่มรายการเพื่อติดตามยอดจ่ายรายเดือน</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {budget && (
        <>
          <CategorySheet
            isOpen={isCategorySheetOpen}
            onClose={() => setIsCategorySheetOpen(false)}
            budgetId={budget.id}
            initialData={selectedCategory}
          />
          <FixedCostSheet
            isOpen={isFixedSheetOpen}
            onClose={() => setIsFixedSheetOpen(false)}
            budgetId={budget.id}
            fixedCost={selectedFixedCost}
          />
        </>
      )}
    </div>
  );
}
