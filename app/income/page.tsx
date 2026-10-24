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
import CopyFixedCostSheet from "@/components/budget/CopyFixedCostSheet";
import { Plus, Settings2, ReceiptText, Layers, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";
import IncomeSummary from "@/components/summary/IncomeSummary";

export default function IncomePage() {
  const [activeTab, setActiveTab] = useState<"categories" | "fixed">("categories");
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [isFixedSheetOpen, setIsFixedSheetOpen] = useState(false);
  const [isCopySheetOpen, setIsCopySheetOpen] = useState(false);
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
      deleteFixedCost(
        { id, budgetId: budget!.id },
        {
          onSuccess: () => toast.success("ลบรายการแล้ว"),
          onError: () => toast.error("ล้มเหลวในการลบรายการ"),
        }
      );
    }
  };

  const handleToggleFixedCost = (id: number, is_paid: boolean) => {
    toggleFixedCost({ id, is_paid });
  };

  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Segmented Control Tabs */}
        <div className="flex bg-base-100 p-1 rounded-xl border border-base-300 max-w-md mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "categories"
                ? "bg-primary text-primary-content"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <Layers size={16} />
            <span>หมวดหมู่ค่าใช้จ่าย</span>
          </button>
          <button
            onClick={() => setActiveTab("fixed")}
            className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === "fixed"
                ? "bg-primary text-primary-content"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <BookmarkCheck size={16} />
            <span>ค่าใช้จ่ายคงที่</span>
          </button>
        </div>

        {activeTab === "categories" ? (
          <div className="space-y-6">
            <IncomeSummary type="categories" categories={categories} />

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-base-content">
                  รายการหมวดหมู่
                </h2>
                <p className="text-xs text-base-content/60">
                  ตั้งงบรายหมวดเพื่อควบคุมและติดตามการใช้จ่าย
                </p>
              </div>
              <button
                onClick={handleAddCategory}
                className="btn btn-sm btn-primary rounded-xl px-4 font-bold flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>เพิ่มหมวดหมู่</span>
              </button>
            </div>

            {isCategoriesLoading || isBudgetLoading ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                  <div className="col-span-full text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300">
                    <Settings2 size={40} className="mx-auto text-base-content/30 mb-3" />
                    <p className="text-sm text-base-content/60 font-medium">
                      ยังไม่มีหมวดหมู่
                      <br />
                      เริ่มเพิ่มหมวดหมู่แรกของคุณได้เลย
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <IncomeSummary type="fixed" fixedCosts={fixedCosts} />

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-base-content">
                  รายการค่าใช้จ่ายคงที่
                </h2>
                <p className="text-xs text-base-content/60">
                  ค่าใช้จ่ายที่ต้องจ่ายแน่นอนในแต่ละเดือน (เช่น ค่าห้อง ค่าน้ำ ค่าเน็ต)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCopySheetOpen(true)}
                  className="btn btn-sm btn-outline border-base-300 rounded-xl px-3 text-xs font-bold"
                >
                  คัดลอกจากเดือนก่อน
                </button>
                <button
                  onClick={handleAddFixedCost}
                  className="btn btn-sm btn-primary rounded-xl px-4 font-bold flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  <span>เพิ่มรายการ</span>
                </button>
              </div>
            </div>

            {isFixedLoading || isBudgetLoading ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {fixedCosts?.map((fixed) => (
                  <FixedCostItem
                    key={fixed.id}
                    fixedCost={fixed}
                    onToggle={handleToggleFixedCost}
                    onEdit={handleEditFixedCost}
                    onDelete={handleDeleteFixedCost}
                  />
                ))}
                {fixedCosts?.length === 0 && (
                  <div className="col-span-full text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300">
                    <ReceiptText size={40} className="mx-auto text-base-content/30 mb-3" />
                    <p className="text-sm text-base-content/60 font-medium">
                      ยังไม่มีค่าใช้จ่ายคงที่
                      <br />
                      เพิ่มรายการ หรือคัดลอกจากเดือนก่อนหน้าได้เลย
                    </p>
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
            onCopyClick={() => {
              setIsFixedSheetOpen(false);
              setTimeout(() => {
                setIsCopySheetOpen(true);
              }, 200);
            }}
          />

          <CopyFixedCostSheet
            isOpen={isCopySheetOpen}
            onClose={() => setIsCopySheetOpen(false)}
            budgetId={budget.id}
            personName={budget.person_name}
            currentMonthYear={budget.month_year}
          />
        </>
      )}
    </div>
  );
}
