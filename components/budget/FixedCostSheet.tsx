"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useSaveFixedCost, FixedCost } from "@/hooks/useFixedCosts";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  id: z.number().optional(),
  budget_id: z.number(),
  name: z.string().min(1, "กรุณากรอกชื่อรายการ"),
  amount: z.coerce.number().min(0.01, "ยอดเงินต้องมากกว่า 0"),
  is_paid: z.boolean().default(false),
});

interface FixedCostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number;
  fixedCost?: FixedCost | null;
}

export default function FixedCostSheet({ isOpen, onClose, budgetId, fixedCost }: FixedCostSheetProps) {
  const { mutate: saveFixedCost, isPending } = useSaveFixedCost();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      budget_id: budgetId,
      name: "",
      amount: 0,
      is_paid: false,
    },
  });

  useEffect(() => {
    if (fixedCost) {
      reset({
        id: fixedCost.id,
        budget_id: fixedCost.budget_id,
        name: fixedCost.name,
        amount: fixedCost.amount,
        is_paid: fixedCost.is_paid,
      });
    } else {
      reset({
        budget_id: budgetId,
        name: "",
        amount: 0,
        is_paid: false,
      });
    }
  }, [fixedCost, budgetId, reset]);

  const onSubmit = (data: any) => {
    saveFixedCost(data, {
      onSuccess: () => {
        toast.success(fixedCost ? "อัปเดตรายการแล้ว" : "เพิ่มรายการแล้ว");
        onClose();
      },
      onError: () => {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      },
    });
  };

  return (
    <BottomSheet
      id="fixed-cost-sheet"
      title={fixedCost ? "แก้ไขค่าใช้จ่ายคงที่" : "เพิ่มค่าใช้จ่ายคงที่"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">ชื่อรายการ</span>
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="เช่น ค่าเช่าบ้าน, ประกันรถ"
            className={cn("input input-bordered rounded-xl text-base", errors.name && "input-error")}
          />
          {errors.name && <span className="text-error text-xs mt-1 px-1">{errors.name.message}</span>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">จำนวนเงิน</span>
          </label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            placeholder="0.00"
            className={cn("input input-bordered rounded-xl text-base", errors.amount && "input-error")}
          />
          {errors.amount && <span className="text-error text-xs mt-1 px-1">{errors.amount.message}</span>}
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <label className="label cursor-pointer flex items-center gap-3">
            <input
              {...register("is_paid")}
              type="checkbox"
              className="checkbox checkbox-primary"
            />
            <span className="label-text font-bold text-blue-900">
              ชำระเงินแล้ว
            </span>
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className={cn("btn btn-primary w-full rounded-xl text-lg h-14", isPending && "loading")}
          >
            {isPending ? "กำลังบันทึก..." : "บันทึกรายการ"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
