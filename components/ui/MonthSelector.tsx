"use client";

import { useMonthStore } from "@/store/monthStore";
import { getBillingPeriod } from "@/lib/billing";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

export default function MonthSelector() {
  const { selectedMonth, nextMonth, prevMonth } = useMonthStore();
  const { start, end } = getBillingPeriod(selectedMonth);

  const formattedMonth = dayjs(selectedMonth).format("MMMM YYYY");
  const formattedCycle = `${dayjs(start).format("D MMM")} – ${dayjs(end).format("D MMM")}`;

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      <button
        onClick={prevMonth}
        aria-label="เดือนก่อนหน้า"
        className="p-1 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex flex-col items-center">
        <span className="font-bold text-sm sm:text-base text-base-content tracking-tight">
          {formattedMonth}
        </span>
        <span className="text-[10px] text-base-content/40 tabular-nums">
          {formattedCycle}
        </span>
      </div>

      <button
        onClick={nextMonth}
        aria-label="เดือนถัดไป"
        className="p-1 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
