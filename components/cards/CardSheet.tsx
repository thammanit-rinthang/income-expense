"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useSaveCard, CreditCard } from "@/hooks/useCards";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

const cardSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "กรุณากรอกชื่อบัตร"),
  person_name: z.string().optional(),
  credit_limit: z.coerce.number().min(0, "วงเงินต้องไม่ติดลบ"),
  statement_balance: z.coerce.number().min(0, "ยอดใช้จ่ายต้องไม่ติดลบ"),
  minimum_payment: z.coerce.number().min(0, "ยอดชำระขั้นต่ำต้องไม่ติดลบ"),
  due_date: z.string().optional().nullable(),
});

interface CardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card?: CreditCard | null;
}

export default function CardSheet({ isOpen, onClose, card }: CardSheetProps) {
  const { currentUser } = useUserStore();
  const { mutate: saveCard, isPending } = useSaveCard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: "",
      person_name: currentUser,
      credit_limit: 0,
      statement_balance: 0,
      minimum_payment: 0,
      due_date: "",
    },
  });

  useEffect(() => {
    if (card) {
      reset({
        id: card.id,
        name: card.name,
        person_name: card.person_name || currentUser,
        credit_limit: card.credit_limit,
        statement_balance: card.statement_balance,
        minimum_payment: card.minimum_payment || 0,
        due_date: card.due_date ? new Date(card.due_date).toISOString().split("T")[0] : "",
      });
    } else {
      reset({
        name: "",
        person_name: currentUser,
        credit_limit: 0,
        statement_balance: 0,
        minimum_payment: 0,
        due_date: "",
      });
    }
  }, [card, currentUser, reset]);

  const onSubmit = (data: any) => {
    saveCard(data, {
      onSuccess: () => {
        toast.success(card ? "อัปเดตข้อมูลบัตรแล้ว" : "เพิ่มบัตรเครดิตแล้ว");
        onClose();
      },
      onError: () => {
        toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
      },
    });
  };

  return (
    <BottomSheet
      id="card-sheet"
      title={card ? "แก้ไขข้อมูลบัตร" : "เพิ่มบัตรเครดิตใหม่"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">ชื่อบัตรเครดิต</span>
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="เช่น Citi Premier, KBank Shopee"
            className={cn("input input-bordered rounded-xl text-base", errors.name && "input-error")}
          />
          {errors.name && <span className="text-error text-xs mt-1 px-1">{errors.name.message}</span>}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">เจ้าของบัตร</span>
          </label>
          <select
            {...register("person_name")}
            className="select select-bordered rounded-xl text-base w-full"
          >
            <option value="Bon">Bon</option>
            <option value="Ray">Ray</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">วงเงินบัตร</span>
            </label>
            <input
              {...register("credit_limit")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">ยอดใช้จ่ายปัจจุบัน</span>
            </label>
            <input
              {...register("statement_balance")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">ชำระขั้นต่ำ</span>
            </label>
            <input
              {...register("minimum_payment")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">วันครบกำหนดชำระ</span>
            </label>
            <input
              {...register("due_date")}
              type="date"
              className="input input-bordered rounded-xl text-base"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className={cn("btn btn-primary w-full rounded-xl text-lg h-14", isPending && "loading")}
          >
            {isPending ? "กำลังบันทึก..." : card ? "อัปเดตข้อมูล" : "บันทึกข้อมูลบัตร"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
