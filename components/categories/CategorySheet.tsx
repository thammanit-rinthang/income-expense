"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useSaveCategory, useDeleteCategory } from "@/hooks/useCategories";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  monthly_budget: z.string().transform(val => val === "" ? null : Number(val)).nullable(),
});

interface CategorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number;
  initialData?: { id: number; name: string; monthly_budget: number | null };
}

export default function CategorySheet({ isOpen, onClose, budgetId, initialData }: CategorySheetProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      monthly_budget: "",
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        monthly_budget: initialData.monthly_budget?.toString() || "",
      });
    } else {
      reset({
        name: "",
        monthly_budget: "",
      });
    }
  }, [initialData, reset]);

  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();

  const onSubmit = (data: any) => {
    saveCategory.mutate({
      id: initialData?.id,
      budget_id: budgetId,
      name: data.name,
      monthly_budget: data.monthly_budget,
    }, {
      onSuccess: () => {
        toast.success(initialData ? "อัปเดตหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
        reset();
        onClose();
      },
      onError: () => {
        toast.error("ล้มเหลวในการบันทึก");
      }
    });
  };

  const handleDelete = () => {
    if (!initialData) return;
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? ยอดที่จัดสรรไว้จะถูกคืนไปยังงบประมาณหลัก")) {
      deleteCategory.mutate({ id: initialData.id, budgetId }, {
        onSuccess: () => {
          toast.success("ลบหมวดหมู่แล้ว");
          onClose();
        }
      });
    }
  };

  return (
    <BottomSheet
      id="category-sheet"
      title={initialData ? "แก้ไขหมวดหมู่" : "จัดการหมวดหมู่"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-gray-700">ชื่อหมวดหมู่</span>
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="เช่น อาหาร, การเดินทาง"
            className={cn("input input-bordered w-full rounded-2xl text-base", errors.name && "input-error")}
          />
          {errors.name && <span className="text-error text-xs mt-1">{errors.name.message}</span>}
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-gray-700">งบประมาณรายเดือน (จะหักออกจากรายรับและงบส่วนตัว)</span>
          </label>
          <input
            {...register("monthly_budget")}
            type="number"
            placeholder="0.00"
            className="input input-bordered w-full rounded-2xl text-base"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {initialData && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-error btn-outline flex-1 rounded-2xl text-lg h-14"
              disabled={deleteCategory.isPending}
            >
              ลบออก
            </button>
          )}
          <button 
            type="submit" 
            className={cn("btn btn-primary flex-2 rounded-2xl text-lg h-14", saveCategory.isPending && "loading")}
            disabled={saveCategory.isPending}
          >
            {initialData ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
