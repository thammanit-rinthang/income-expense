"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BottomSheet from "@/components/ui/BottomSheet";
import { useSaveTransaction, useDeleteTransaction, Transaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCards } from "@/hooks/useCards";
import { useUserStore } from "@/store/userStore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { CreditCard, Wallet, Calendar, FileText, Trash2 } from "lucide-react";

const schema = z.object({
  id: z.number().optional(),
  budget_id: z.number(),
  amount: z.coerce.number().min(0.01, "ยอดเงินต้องมากกว่า 0"),
  description: z.string().optional(),
  category_id: z.coerce.number().nullable().optional(),
  card_id: z.coerce.number().nullable().optional(),
  created_at: z.string().optional(),
});

type TransactionFormInput = z.input<typeof schema>;
type TransactionFormValues = z.output<typeof schema>;

interface EntryPreferences {
  mode: "cash" | "card";
  recentCategoryIds: number[];
  recentCardIds: number[];
}

const EMPTY_ENTRY_PREFERENCES: EntryPreferences = {
  mode: "cash",
  recentCategoryIds: [],
  recentCardIds: [],
};
const ENTRY_PREFERENCE_EVENT = "transaction-entry-preferences-change";
const entryPreferenceCache = new Map<string, EntryPreferences>();
const entryPreferenceKey = (userName: string) => `transaction-entry:${userName}`;

function readEntryPreferences(userName: string): EntryPreferences {
  const cached = entryPreferenceCache.get(userName);
  if (cached) return cached;
  if (typeof window === "undefined") return EMPTY_ENTRY_PREFERENCES;

  let preferences = EMPTY_ENTRY_PREFERENCES;
  try {
    const rawValue = window.localStorage.getItem(entryPreferenceKey(userName));
    if (rawValue) {
      const parsed = JSON.parse(rawValue) as Partial<EntryPreferences>;
      preferences = {
        mode: parsed.mode === "card" ? "card" : "cash",
        recentCategoryIds: Array.isArray(parsed.recentCategoryIds)
          ? parsed.recentCategoryIds.filter((id): id is number => Number.isInteger(id))
          : [],
        recentCardIds: Array.isArray(parsed.recentCardIds)
          ? parsed.recentCardIds.filter((id): id is number => Number.isInteger(id))
          : [],
      };
    }
  } catch {
    preferences = EMPTY_ENTRY_PREFERENCES;
  }
  entryPreferenceCache.set(userName, preferences);
  return preferences;
}

function writeEntryPreferences(userName: string, preferences: EntryPreferences) {
  entryPreferenceCache.set(userName, preferences);
  try {
    window.localStorage.setItem(entryPreferenceKey(userName), JSON.stringify(preferences));
  } catch {
    // Saving the transaction does not depend on browser storage being available.
  }
  window.dispatchEvent(new CustomEvent(ENTRY_PREFERENCE_EVENT, { detail: userName }));
}

function useEntryPreferences(userName: string) {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === "undefined") return () => undefined;
    const onPreferenceChange = (event: Event) => {
      if (event.type === ENTRY_PREFERENCE_EVENT) {
        if ((event as CustomEvent<string>).detail !== userName) return;
      } else {
        const storageEvent = event as StorageEvent;
        if (storageEvent.key && storageEvent.key !== entryPreferenceKey(userName)) return;
        entryPreferenceCache.delete(userName);
      }
      onChange();
    };
    window.addEventListener(ENTRY_PREFERENCE_EVENT, onPreferenceChange);
    window.addEventListener("storage", onPreferenceChange);
    return () => {
      window.removeEventListener(ENTRY_PREFERENCE_EVENT, onPreferenceChange);
      window.removeEventListener("storage", onPreferenceChange);
    };
  }, [userName]);
  const getSnapshot = useCallback(() => readEntryPreferences(userName), [userName]);

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_ENTRY_PREFERENCES);
}

interface TransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: number;
  transaction?: Transaction | null;
}

export default function TransactionSheet({
  isOpen,
  onClose,
  budgetId,
  transaction,
}: TransactionSheetProps) {
  const { currentUser } = useUserStore();
  const entryPreferences = useEntryPreferences(currentUser);
  const { data: categories } = useCategories(budgetId);
  const { data: cards } = useCards();
  const { mutate: saveTransaction, isPending: isSaving } = useSaveTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  const paymentMode = transaction
    ? transaction.card_id
      ? "card"
      : "cash"
    : entryPreferences.mode === "card" && cards?.length
      ? "card"
      : "cash";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormInput, undefined, TransactionFormValues>({
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
      const preferences = readEntryPreferences(currentUser);
      const recentCategoryId = preferences.recentCategoryIds.find((id) =>
        categories?.some((category) => category.id === id)
      ) ?? null;
      const recentCardId = preferences.recentCardIds.find((id) =>
        cards?.some((card) => card.id === id)
      ) ?? null;
      const useCardMode = preferences.mode === "card" && Boolean(cards?.length);
      reset({
        budget_id: budgetId,
        amount: 0,
        description: "",
        category_id: useCardMode ? null : recentCategoryId,
        card_id: useCardMode ? recentCardId ?? cards?.[0]?.id ?? null : null,
        created_at: dayjs().format("YYYY-MM-DD"),
      });
    }
  }, [transaction, budgetId, reset, currentUser, categories, cards, isOpen]);

  const handleModeSwitch = (mode: "cash" | "card") => {
    writeEntryPreferences(currentUser, { ...entryPreferences, mode });
    if (mode === "cash") {
      setValue("card_id", null);
      const recentCategoryId = entryPreferences.recentCategoryIds.find((id) =>
        categories?.some((category) => category.id === id)
      );
      if (recentCategoryId) setValue("category_id", recentCategoryId);
    } else {
      setValue("category_id", null);
      const recentCardId = entryPreferences.recentCardIds.find((id) =>
        cards?.some((card) => card.id === id)
      );
      const cardId = recentCardId ?? cards?.[0]?.id;
      if (cardId) setValue("card_id", cardId);
    }
  };

  const onSubmit = (data: TransactionFormValues) => {
    saveTransaction(data, {
      onSuccess: () => {
        if (!transaction) {
          const nextPreferences: EntryPreferences = {
            mode: paymentMode,
            recentCategoryIds: data.category_id
              ? [data.category_id, ...entryPreferences.recentCategoryIds.filter((id) => id !== data.category_id)].slice(0, 3)
              : entryPreferences.recentCategoryIds,
            recentCardIds: data.card_id
              ? [data.card_id, ...entryPreferences.recentCardIds.filter((id) => id !== data.card_id)].slice(0, 3)
              : entryPreferences.recentCardIds,
          };
          writeEntryPreferences(currentUser, nextPreferences);
        }
        toast.success(transaction ? "อัปเดตรายการแล้ว" : "บันทึกรายการสำเร็จ");
        onClose();
      },
      onError: (error) => {
        const responseMessage = axios.isAxiosError<{ error?: unknown }>(error)
          ? error.response?.data?.error
          : undefined;
        toast.error(
          typeof responseMessage === "string"
            ? responseMessage
            : "เกิดข้อผิดพลาด กรุณาลองใหม่"
        );
      },
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    if (confirm("ต้องการลบรายการนี้ใช่หรือไม่? ยอดเงินจะถูกคืนเข้าสู่งบประมาณหรือวงเงินบัตร")) {
      deleteTransaction(
        { id: transaction.id, budgetId },
        {
          onSuccess: () => {
            toast.success("ลบรายการแล้ว");
            onClose();
          },
        }
      );
    }
  };

  return (
    <BottomSheet
      id="transaction-sheet"
      title={transaction ? "แก้ไขรายการ" : "บันทึกรายจ่าย"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Payment Mode Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-base-200 rounded-xl border border-base-300">
          <button
            type="button"
            onClick={() => handleModeSwitch("cash")}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all",
              paymentMode === "cash"
                ? "bg-base-100 text-primary shadow-none border border-base-300"
                : "text-base-content/60 hover:text-base-content"
            )}
          >
            <Wallet size={15} />
            <span>จ่ายเงินสด / งบ</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("card")}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all",
              paymentMode === "card"
                ? "bg-base-100 text-primary shadow-none border border-base-300"
                : "text-base-content/60 hover:text-base-content"
            )}
          >
            <CreditCard size={15} />
            <span>รูดบัตรเครดิต</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
            จำนวนเงิน (บาท)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-xl font-bold text-base-content/40">฿</span>
            <input
              {...register("amount")}
              type="number"
              step="0.01"
              placeholder="0.00"
              autoFocus={!transaction}
              inputMode="decimal"
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-base-100 border border-base-300 rounded-xl text-2xl font-bold tabular-nums text-base-content focus:outline-none focus:border-primary transition-colors",
                errors.amount && "border-error"
              )}
            />
          </div>
          {errors.amount && (
            <span className="text-error text-xs block px-1">{errors.amount.message}</span>
          )}
        </div>

        {/* Category or Card selection based on mode */}
        {paymentMode === "cash" ? (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
              หมวดหมู่งบประมาณ
            </label>
            <select
              {...register("category_id")}
              className="select select-bordered rounded-xl text-sm w-full bg-base-100 border-base-300 h-11"
              onChange={(e) => {
                const val = e.target.value;
                setValue("category_id", val === "" ? null : Number(val));
              }}
            >
              <option value="">งบทั่วไป (ยังไม่ระบุหมวด)</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {entryPreferences.recentCategoryIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-base-content/50">ใช้ล่าสุด</span>
                {entryPreferences.recentCategoryIds
                  .map((id) => categories?.find((category) => category.id === id))
                  .filter((category): category is NonNullable<typeof category> => Boolean(category))
                  .map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setValue("category_id", category.id)}
                      className="min-h-11 rounded-lg border border-base-300 px-3 text-xs font-semibold text-base-content/70 hover:border-primary hover:text-primary"
                    >
                      {category.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
              เลือกบัตรเครดิต
            </label>
            <select
              {...register("card_id")}
              className="select select-bordered rounded-xl text-sm w-full bg-base-100 border-base-300 h-11"
              onChange={(e) => {
                const val = e.target.value;
                setValue("card_id", val === "" ? null : Number(val));
              }}
            >
              <option value="">เลือกบัตรเครดิต</option>
              {cards?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.person_name || "หลัก"})
                </option>
              ))}
            </select>
            {entryPreferences.recentCardIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-base-content/50">ใช้ล่าสุด</span>
                {entryPreferences.recentCardIds
                  .map((id) => cards?.find((card) => card.id === id))
                  .filter((card): card is NonNullable<typeof card> => Boolean(card))
                  .map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setValue("card_id", card.id)}
                      className="min-h-11 rounded-lg border border-base-300 px-3 text-xs font-semibold text-base-content/70 hover:border-primary hover:text-primary"
                    >
                      {card.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Description & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
              รายละเอียด (ถ้ามี)
            </label>
            <div className="relative flex items-center">
              <FileText size={15} className="absolute left-3.5 text-base-content/40 pointer-events-none" />
              <input
                {...register("description")}
                type="text"
                placeholder="เช่น ค่าอาหาร, กาแฟ"
                className="w-full pl-9 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs sm:text-sm text-base-content focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
              วันที่
            </label>
            <div className="relative flex items-center">
              <Calendar size={15} className="absolute left-3.5 text-primary pointer-events-none" />
              <input
                {...register("created_at")}
                type="date"
                className="w-full pl-9 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-bold text-base-content focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-3">
          {transaction && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="p-3 rounded-xl border border-error/30 text-error hover:bg-error/10 transition-colors shrink-0"
              title="ลบรายการนี้"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-content text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : transaction ? (
              "อัปเดตรายการ"
            ) : (
              "บันทึกรายการ"
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
