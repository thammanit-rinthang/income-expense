"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import { useUserStore } from "@/store/userStore";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useLoans } from "@/hooks/useLoans";
import LoanItem from "@/components/loans/LoanItem";
import LoanSheet from "@/components/loans/LoanSheet";
import PayLoanSheet from "@/components/loans/PayLoanSheet";
import { Plus, PiggyBank } from "lucide-react";

export default function LoansPage() {
  const { currentUser } = useUserStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payLoan, setPayLoan] = useState<any>(null);

  const { data: budget } = useMonthlyBudget();
  const { data: loans, isLoading } = useLoans(currentUser);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">หนี้สิน & เงินกู้</h2>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="btn btn-sm btn-primary rounded-xl px-4"
          >
            <Plus size={18} className="mr-1" />
            เพิ่ม
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="grid gap-6">
            {loans?.map((loan) => (
              <LoanItem
                key={loan.id}
                name={loan.name}
                principal={Number(loan.principal)}
                paid={loan.payments.reduce((acc, p) => acc + Number(p.amount), 0)}
                onPay={() => setPayLoan(loan)}
              />
            ))}
            {loans?.length === 0 && (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200">
                <PiggyBank size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">ยังไม่มีรายการหนี้สิน<br/>บันทึกรายการเพื่อติดตามการชำระได้ที่นี่</p>
              </div>
            )}
          </div>
        )}
      </div>

      <LoanSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        budgetId={budget?.id}
      />

      {budget && (
        <PayLoanSheet
          isOpen={!!payLoan}
          onClose={() => setPayLoan(null)}
          loan={payLoan}
          budgetId={budget.id}
        />
      )}
    </div>
  );
}
