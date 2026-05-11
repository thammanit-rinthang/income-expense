"use client";

import { formatCurrency, calculateMonthlyPayment, getMonthsDifference, generateLoanSchedule } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ReceiptRussianRuble, Pencil, Trash2, CalendarDays, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface LoanItemProps {
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  startDate: string | Date;
  paid: number;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function LoanItem({ 
  name, 
  principal, 
  interestRate, 
  termMonths, 
  startDate,
  paid, 
  onPay, 
  onEdit, 
  onDelete 
}: LoanItemProps) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const percentage = Math.min((paid / principal) * 100, 100);
  const remaining = principal - paid;
  
  // Calculate months left
  const monthsPassed = getMonthsDifference(startDate);
  const monthsLeft = Math.max(termMonths - monthsPassed, 1);
  
  // Recalculate monthly payment for remaining balance
  const recalculatedMonthlyPayment = remaining > 0 ? calculateMonthlyPayment(remaining, interestRate, monthsLeft) : 0;

  const schedule = generateLoanSchedule(principal, interestRate, termMonths, paid, startDate);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl shrink-0">
            <ReceiptRussianRuble size={24} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-gray-900 truncate">{name}</h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                Rem: {formatCurrency(remaining)}
              </p>
              <span className="hidden xs:inline w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1 text-primary whitespace-nowrap">
                <CalendarDays size={10} />
                <p className="text-[10px] font-black uppercase">
                  {formatCurrency(recalculatedMonthlyPayment)} / Mo
                </p>
              </div>
              <span className="hidden xs:inline w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1 text-orange-500 whitespace-nowrap">
                <Timer size={10} />
                <p className="text-[10px] font-black uppercase">
                  {monthsLeft} Mo left
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Sch.</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary toggle-xs" 
                checked={isScheduleOpen}
                onChange={() => setIsScheduleOpen(!isScheduleOpen)}
              />
            </div>
            
            <button 
              onClick={onEdit}
              className="btn btn-ghost btn-xs btn-square rounded-lg text-gray-400 hover:text-primary"
            >
              <Pencil size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="btn btn-ghost btn-xs btn-square rounded-lg text-gray-400 hover:text-error"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button 
            onClick={onPay}
            className="btn btn-sm btn-outline btn-secondary rounded-xl px-4 text-xs font-bold"
          >
            Pay Now
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-400 uppercase tracking-tight">Progress</span>
            <span className="text-secondary">{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-50 rounded-xl h-3 overflow-hidden border border-gray-100">
            <div
              className="h-full bg-secondary rounded-xl transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-black text-gray-400 px-1 uppercase">
            <span>Paid {formatCurrency(paid)}</span>
            <span>Target {formatCurrency(principal)}</span>
          </div>
        </div>

        {/* Schedule Accordion */}
        <div className={cn(
          "collapse collapse-arrow bg-gray-50/50 rounded-xl border border-gray-100 transition-all duration-300",
          isScheduleOpen ? "collapse-open" : "collapse-close"
        )}>
          <div 
            className="collapse-title text-xs font-bold flex items-center gap-2 cursor-pointer py-3 min-h-0"
            onClick={() => setIsScheduleOpen(!isScheduleOpen)}
          >
            <CalendarDays size={14} className="text-primary" />
            ตารางการผ่อนชำระ
            <span className="ml-auto text-[10px] font-black text-gray-400 uppercase mr-4">
              {schedule.length} งวดที่เหลือ
            </span>
          </div>
          <div className="collapse-content px-0">
            <div className="space-y-1 max-h-80 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {schedule.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 transition-colors",
                    item.isPaid ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
                  )}
                  onClick={() => !item.isPaid && onPay()} // Open payment sheet if unpaid
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className={cn(
                          "toggle toggle-xs", 
                          item.isPaid ? "toggle-success" : "toggle-ghost border-gray-300"
                        )}
                        checked={item.isPaid}
                        readOnly
                      />
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100 text-[10px] font-black text-gray-500">
                      {item.month}
                    </span>
                    <div>
                      <p className={cn("text-xs font-bold", item.isPaid ? "text-success line-through" : "text-gray-700")}>
                        งวดที่ {item.month}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium">คงเหลือ: {formatCurrency(item.remaining)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", item.isPaid ? "text-success" : "text-primary")}>
                      {formatCurrency(item.payment)}
                    </p>
                    <p className="text-[8px] text-gray-400 uppercase font-bold">
                      {item.isPaid ? "Paid" : "Due"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
