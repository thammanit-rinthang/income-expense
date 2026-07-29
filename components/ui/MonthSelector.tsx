"use client";

import { useMonthStore } from "@/store/monthStore";
import { getBillingPeriod } from "@/lib/billing";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import dayjs from "dayjs";

export default function MonthSelector() {
  const { selectedMonth, nextMonth, prevMonth } = useMonthStore();
  const { start, end } = getBillingPeriod(selectedMonth);

  const formattedMonth = dayjs(selectedMonth).format("MMMM YYYY");
  const formattedCycle = `${dayjs(start).format("D MMM")} - ${dayjs(end).format("D MMM")}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={prevMonth}
          aria-label="เดือนก่อนหน้า"
          className="btn btn-circle btn-ghost btn-sm finance-action"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <span className="font-black text-lg min-w-[130px] text-center text-base-content">
            {formattedMonth}
          </span>
        </div>

        <button
          onClick={nextMonth}
          aria-label="เดือนถัดไป"
          className="btn btn-circle btn-ghost btn-sm finance-action"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <span className="finance-chip text-xs text-base-content/60 font-semibold px-3 py-1">
        รอบเงิน: {formattedCycle}
      </span>
    </div>
  );
}
