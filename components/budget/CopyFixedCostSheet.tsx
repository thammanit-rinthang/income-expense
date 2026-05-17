"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import BottomSheet from "@/components/ui/BottomSheet";
import { useFixedCosts, useBulkSaveFixedCosts, FixedCost } from "@/hooks/useFixedCosts";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Copy, Check, AlertCircle } from "lucide-react";

interface CopyFixedCostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number;
  personName: string;
  currentMonthYear: string;
}

export default function CopyFixedCostSheet({
  isOpen,
  onClose,
  budgetId,
  personName,
  currentMonthYear,
}: CopyFixedCostSheetProps) {
  const prevMonthDate = dayjs(currentMonthYear).subtract(1, "month");
  const formattedPrevMonth = prevMonthDate.format("YYYY-MM-DD");
  
  // Fetch previous month's budget
  const { data: prevBudget, isLoading: isLoadingPrevBudget, error: prevBudgetError } = useQuery({
    queryKey: ["monthly-budget-copy-source", personName, formattedPrevMonth],
    queryFn: async () => {
      const { data } = await axios.get<any>(
        `/api/budgets?person_name=${personName}&month=${formattedPrevMonth}`
      );
      return data;
    },
    enabled: isOpen && !!personName && !!currentMonthYear,
  });

  // Fetch previous month's fixed costs
  const { data: prevFixedCosts, isLoading: isLoadingFixedCosts } = useFixedCosts(prevBudget?.id || null);
  
  const { mutate: bulkSave, isPending: isSaving } = useBulkSaveFixedCosts();

  // Local state for checkboxes and edited amounts
  const [selectedItems, setSelectedItems] = useState<{ [id: number]: boolean }>({});
  const [amounts, setAmounts] = useState<{ [id: number]: string }>({});

  // Prefill state once data is loaded
  useEffect(() => {
    if (prevFixedCosts) {
      const initialSelection: { [id: number]: boolean } = {};
      const initialAmounts: { [id: number]: string } = {};
      
      prevFixedCosts.forEach((fc) => {
        initialSelection[fc.id] = true; // Checked by default
        initialAmounts[fc.id] = fc.amount.toString();
      });
      
      setSelectedItems(initialSelection);
      setAmounts(initialAmounts);
    }
  }, [prevFixedCosts]);

  const handleToggleItem = (id: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAmountChange = (id: number, value: string) => {
    setAmounts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleCopy = () => {
    if (!prevFixedCosts) return;
    
    const itemsToCopy = prevFixedCosts
      .filter((fc) => selectedItems[fc.id])
      .map((fc) => ({
        name: fc.name,
        amount: parseFloat(amounts[fc.id] || "0") || 0,
      }));

    if (itemsToCopy.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 รายการเพื่อคัดลอก");
      return;
    }

    bulkSave(
      { budgetId, items: itemsToCopy },
      {
        onSuccess: () => {
          toast.success(`คัดลอกค่าใช้จ่ายคงที่สำเร็จ ${itemsToCopy.length} รายการ`);
          onClose();
        },
        onError: () => {
          toast.error("เกิดข้อผิดพลาดในการคัดลอกข้อมูล");
        },
      }
    );
  };

  const isLoading = isLoadingPrevBudget || isLoadingFixedCosts;
  const prevMonthLabel = prevMonthDate.format("MMMM YYYY");
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <BottomSheet
      id="copy-fixed-cost-sheet"
      title="คัดลอกค่าใช้จ่ายคงที่จากเดือนที่แล้ว"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex items-center gap-3">
          <Copy className="text-primary" size={20} />
          <div>
            <p className="text-sm font-bold text-gray-800">ดึงข้อมูลจากเดือน {prevMonthLabel}</p>
            <p className="text-xs text-gray-500 font-medium">คุณสามารถติ๊กเลือกเฉพาะรายการที่ต้องการ และแก้ไขจำนวนเงินก่อนคัดลอกได้ครับ</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : !prevFixedCosts || prevFixedCosts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="text-sm text-gray-400 font-bold">ไม่พบข้อมูลค่าใช้จ่ายคงที่ของเดือน {prevMonthLabel}</p>
          </div>
        ) : (
          <>
            <div className="max-h-[350px] overflow-y-auto pr-1 space-y-3">
              {prevFixedCosts.map((fc) => {
                const isChecked = !!selectedItems[fc.id];
                return (
                  <div
                    key={fc.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-center justify-between gap-4",
                      isChecked 
                        ? "border-primary/20 bg-primary/[0.02]" 
                        : "border-gray-200 bg-gray-50/50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(fc.id)}
                        className="checkbox checkbox-primary checkbox-sm rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 truncate text-sm">{fc.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">ยอดเดิม: ฿{fc.amount}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">฿</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isChecked}
                        value={amounts[fc.id] || ""}
                        onChange={(e) => handleAmountChange(fc.id, e.target.value)}
                        className={cn(
                          "input input-bordered input-sm rounded-lg w-24 text-right font-bold text-sm",
                          isChecked ? "bg-white text-gray-800" : "bg-gray-100 text-gray-400"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCopy}
                disabled={isSaving || selectedCount === 0}
                className={cn(
                  "btn btn-primary w-full rounded-xl text-lg h-14",
                  isSaving && "loading"
                )}
              >
                {isSaving 
                  ? "กำลังคัดลอก..." 
                  : `คัดลอกรายการที่เลือก (${selectedCount} รายการ)`
                }
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
