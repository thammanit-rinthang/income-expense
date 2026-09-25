"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import { useUserStore } from "@/store/userStore";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useLoans, useDeleteLoan } from "@/hooks/useLoans";
import LoanItem from "@/components/loans/LoanItem";
import LoanSheet from "@/components/loans/LoanSheet";
import PayLoanSheet from "@/components/loans/PayLoanSheet";
import { Plus, PiggyBank } from "lucide-react";
import { toast } from "react-hot-toast";

export default function LoansPage() {
  const { currentUser } = useUserStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payLoan, setPayLoan] = useState<any>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const { data: budget } = useMonthlyBudget();
  const { data: loans, isLoading } = useLoans(currentUser);
  const deleteLoan = useDeleteLoan();

  const handleEdit = (loan: any) => {
    setSelectedLoan(loan);
    setIsAddOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      deleteLoan.mutate(id, {
        onSuccess: () => toast.success("ลบรายการสำเร็จ"),
        onError: () => toast.error("ลบรายการล้มเหลว"),
      });
    }
  };

  const handleCloseSheet = () => {
    setIsAddOpen(false);
    setSelectedLoan(null);
  };

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
                id={loan.id}
                name={loan.name}
                principal={Number(loan.principal)}
                interestRate={Number(loan.interest_rate)}
                termMonths={loan.term_months}
                startDate={loan.start_date}
                paid={loan.payments.reduce((acc, p) => acc + Number(p.amount), 0)}
                payments={loan.payments}
                onPay={() => setPayLoan(loan)}
                onEdit={() => handleEdit(loan)}
                onDelete={() => handleDelete(loan.id)}
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
        onClose={handleCloseSheet}
        budgetId={budget?.id}
        loan={selectedLoan}
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
