"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useUpdateMonthlyBudget, MonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useFixedCosts, useDeleteFixedCost, useToggleFixedCost, FixedCost } from "@/hooks/useFixedCosts";
import toast from "react-hot-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus, Copy } from "lucide-react";
import FixedCostSheet from "./FixedCostSheet";
import FixedCostItem from "./FixedCostItem";
import CopyFixedCostSheet from "./CopyFixedCostSheet";

const budgetSchema = z.object({
  id: z.number(),
  total_income: z.coerce.number().min(0, "ยอดรายได้ต้องไม่ติดลบ"),
  reserved_amount: z.coerce.number().min(0, "เงินกันไว้ต้องไม่ติดลบ"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;
type BudgetFormInput = z.input<typeof budgetSchema>;

interface BudgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budget: MonthlyBudget | null;
}

export default function BudgetEditSheet({ isOpen, onClose, budget }: BudgetEditSheetProps) {
  const { mutate: updateBudget, isPending } = useUpdateMonthlyBudget();
  const { data: fixedCosts } = useFixedCosts(budget?.id || null);
  const { mutate: deleteFixedCost } = useDeleteFixedCost();
  const { mutate: toggleFixedCost } = useToggleFixedCost();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCopySheetOpen, setIsCopySheetOpen] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BudgetFormInput, unknown, BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      id: budget?.id || 0,
      total_income: budget?.total_income || 0,
      reserved_amount: budget?.reserved_amount || 0,
    },
  });

  const watchedIncome = useWatch({ control, name: "total_income" });
  const watchedReserved = useWatch({ control, name: "reserved_amount" });

  useEffect(() => {
    if (budget) {
      reset({
        id: budget.id,
        total_income: budget.total_income,
        reserved_amount: budget.reserved_amount,
      });
    }
  }, [budget, reset]);

  const onSubmit = (data: BudgetFormValues) => {
    updateBudget(data, {
      onSuccess: () => {
        toast.success("อัปเดตงบประมาณแล้ว");
        onClose();
      },
      onError: () => {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      },
    });
  };

  const handleAddFixedCost = () => {
    setEditingFixedCost(null);
    setIsSheetOpen(true);
  };

  const handleEditFixedCost = (fixed: FixedCost) => {
    setEditingFixedCost(fixed);
    setIsSheetOpen(true);
  };

  const handleDeleteFixedCost = (id: number) => {
    if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) {
      deleteFixedCost({ id, budgetId: budget!.id }, {
        onSuccess: () => toast.success("ลบรายการแล้ว"),
      });
    }
  };

  const handleToggleFixedCost = (id: number, is_paid: boolean) => {
    toggleFixedCost({ id, is_paid }, {
      onSuccess: () => toast.success(is_paid ? "จ่ายแล้ว!" : "ยกเลิกการจ่าย"),
    });
  };

  if (!budget) return null;

  const projectedAvailable =
    Number(budget.remaining_spending_pool) +
    (Number(watchedIncome || 0) - Number(budget.total_income)) -
    (Number(watchedReserved || 0) - Number(budget.reserved_amount));
  const actualSpent = Number(budget.actual_spent || 0);

  return (
    <BottomSheet
      id="budget-edit-sheet"
      title="แก้ไขงบประมาณประจำเดือน"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-gray-700">รายรับรวม</span>
              </label>
              <input
                {...register("total_income")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn("input input-bordered rounded-xl text-lg font-bold", errors.total_income && "input-error")}
              />
              {errors.total_income && <span className="text-error text-xs mt-1 px-1">{errors.total_income.message}</span>}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold text-gray-700">เงินกันไว้</span>
              </label>
              <input
                {...register("reserved_amount")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn("input input-bordered rounded-xl text-lg font-bold", errors.reserved_amount && "input-error")}
              />
              {errors.reserved_amount && <span className="text-error text-xs mt-1 px-1">{errors.reserved_amount.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="finance-card p-3">
              <p className="finance-label">เหลือใช้ตอนนี้</p>
              <p className="text-sm font-black text-primary">{formatCurrency(projectedAvailable)}</p>
            </div>
            <div className="finance-card p-3">
              <p className="finance-label">ใช้ไปแล้ว</p>
              <p className="text-sm font-black text-error">{formatCurrency(actualSpent)}</p>
            </div>
            <div className="finance-card p-3">
              <p className="finance-label">กันไว้แล้ว</p>
              <p className="text-sm font-black text-base-content">{formatCurrency(budget.reserved_amount)}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={cn("btn btn-primary w-full rounded-xl text-lg", isPending && "loading")}
          >
            {isPending ? "กำลังบันทึก..." : "บันทึกงบเดือนนี้"}
          </button>
        </form>

        <div className="divider"></div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">สิ่งที่ต้องจ่าย</h3>
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={() => setIsCopySheetOpen(true)}
                className="btn btn-sm btn-ghost text-primary gap-1 px-2 hover:bg-primary/5 rounded-lg font-bold text-xs"
              >
                <Copy size={14} />
                ก็อปปี้จากเดือนที่แล้ว
              </button>
              <button 
                type="button"
                onClick={handleAddFixedCost}
                className="btn btn-sm btn-ghost text-primary gap-1 px-2 hover:bg-primary/5 rounded-lg font-bold text-xs"
              >
                <Plus size={14} />
                เพิ่มรายการ
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {fixedCosts?.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-3">
                <p className="text-sm text-gray-400 font-medium">ยังไม่มีรายการค่าใช้จ่ายคงที่</p>
                <button
                  type="button"
                  onClick={() => setIsCopySheetOpen(true)}
                  className="btn btn-xs btn-outline btn-primary rounded-lg font-bold"
                >
                  <Copy size={12} />
                  ก็อปปี้จากเดือนที่แล้ว
                </button>
              </div>
            ) : (
              fixedCosts?.map((fixed) => (
                <div key={fixed.id} className="relative group">
                  <FixedCostItem 
                    fixedCost={fixed}
                    onEdit={handleEditFixedCost}
                    onDelete={handleDeleteFixedCost}
                    onToggle={handleToggleFixedCost}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <FixedCostSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        budgetId={budget.id}
        fixedCost={editingFixedCost}
        onCopyClick={() => {
          setIsSheetOpen(false);
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
    </BottomSheet>
  );
}
