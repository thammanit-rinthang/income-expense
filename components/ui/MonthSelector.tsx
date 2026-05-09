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
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-4">
        <button
          onClick={prevMonth}
          className="btn btn-circle btn-ghost btn-sm"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <span className="font-bold text-lg min-w-[120px] text-center">
            {formattedMonth}
          </span>
        </div>

        <button
          onClick={nextMonth}
          className="btn btn-circle btn-ghost btn-sm"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <span className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-xl border border-gray-100">
        Cycle: {formattedCycle}
      </span>
    </div>
  );
}
