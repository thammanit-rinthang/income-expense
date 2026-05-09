"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useSaveTransaction, useDeleteTransaction, Transaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCards } from "@/hooks/useCards";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

const schema = z.object({
  id: z.number().optional(),
  budget_id: z.number(),
  amount: z.coerce.number().min(0.01, "ยอดเงินต้องมากกว่า 0"),
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  category_id: z.coerce.number().nullable().optional(),
  card_id: z.coerce.number().nullable().optional(),
  created_at: z.string().optional(),
}).refine(data => data.category_id != null || data.card_id != null, {
  message: "กรุณาเลือกหมวดหมู่หรือบัตรเครดิต",
  path: ["category_id"],
});

interface TransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number;
  transaction?: Transaction | null;
}

export default function TransactionSheet({ isOpen, onClose, budgetId, transaction }: TransactionSheetProps) {
  const { data: categories } = useCategories(budgetId);
  const { data: cards } = useCards();
  const { mutate: saveTransaction, isPending: isSaving } = useSaveTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      budget_id: budgetId,
      amount: 0,
      description: "",
      category_id: null as number | null,
      card_id: null as number | null,
      created_at: dayjs().format("YYYY-MM-DD"),
    },
  });

  const watchCardId = watch("card_id");

  useEffect(() => {
    if (transaction) {
      reset({
        id: transaction.id,
        budget_id: transaction.budget_id,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id,
        card_id: transaction.card_id,
        created_at: dayjs(transaction.created_at).format("YYYY-MM-DD"),
      });
    } else {
      reset({
        budget_id: budgetId,
        amount: 0,
        description: "",
        category_id: null,
        card_id: null,
        created_at: dayjs().format("YYYY-MM-DD"),
      });
    }
  }, [transaction, budgetId, reset]);

  const onSubmit = (data: any) => {
    saveTransaction(data, {
      onSuccess: () => {
        toast.success(transaction ? "อัปเดตรายการแล้ว" : "เพิ่มรายการแล้ว");
        onClose();
      },
      onError: () => {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      },
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ยอดเงินจะถูกคืนไปยังงบประมาณหรือบัตรเครดิต")) {
      deleteTransaction({ id: transaction.id, budgetId }, {
        onSuccess: () => {
          toast.success("ลบรายการแล้ว");
          onClose();
        }
      });
    }
  };

  return (
    <BottomSheet
      id="transaction-sheet"
      title={transaction ? "แก้ไขรายการ" : "จัดการรายการ"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-gray-700">วันที่</span>
            </label>
            <input
              {...register("created_at")}
              type="date"
              className="input input-bordered rounded-xl text-base h-12"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-gray-700">จำนวนเงิน</span>
            </label>
            <input
              {...register("amount")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className={cn("input input-bordered rounded-xl text-base font-bold h-12", errors.amount && "input-error")}
            />
          </div>
        </div>
        {errors.amount && <span className="text-error text-xs px-1">{errors.amount.message}</span>}

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold text-gray-700">รายละเอียด</span>
          </label>
          <input
            {...register("description")}
            type="text"
            placeholder="เช่น ค่าอาหารกลางวัน, เติมน้ำมัน"
            className={cn("input input-bordered rounded-xl text-base h-12", errors.description && "input-error")}
          />
          {errors.description && <span className="text-error text-xs mt-1 px-1">{errors.description.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-gray-700">หมวดหมู่ (เงินสด)</span>
            </label>
            <select
              {...register("category_id")}
              disabled={!!watchCardId && watchCardId != 0}
              className="select select-bordered rounded-xl text-base w-full h-12"
              onChange={(e) => {
                const val = e.target.value;
                setValue("category_id", val === "" ? null : Number(val));
                if (val !== "") setValue("card_id", null);
              }}
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold text-gray-700">บัตรเครดิต</span>
            </label>
            <select
              {...register("card_id")}
              className="select select-bordered rounded-xl text-base w-full h-12"
              onChange={(e) => {
                const val = e.target.value;
                setValue("card_id", val === "" ? null : Number(val));
                if (val !== "") setValue("category_id", null);
              }}
            >
              <option value="">เลือกบัตร</option>
              {cards?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {errors.category_id && (
          <span className="text-error text-xs px-1 italic">
            * {errors.category_id.message}
          </span>
        )}

        <div className="flex gap-3 pt-4">
          {transaction && (
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-error btn-outline flex-1 rounded-xl text-lg h-14"
              disabled={isDeleting || isSaving}
            >
              ลบรายการ
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className={cn("btn btn-primary flex-[2] rounded-xl text-lg h-14", isSaving && "loading")}
          >
            {isSaving ? "กำลังบันทึก..." : transaction ? "อัปเดตรายการ" : "บันทึกรายการ"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
