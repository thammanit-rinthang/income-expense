"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import { Plus, CreditCard as CardIcon } from "lucide-react";
import { useCards, CreditCard } from "@/hooks/useCards";
import CardList from "@/components/cards/CardList";
import CardTransactionList from "@/components/cards/CardTransactionList";
import CardSheet from "@/components/cards/CardSheet";
import PaymentSheet from "@/components/cards/PaymentSheet";

export default function CardsPage() {
  const { data: cards, isLoading } = useCards();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isCardSheetOpen, setIsCardSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [paymentCard, setPaymentCard] = useState<CreditCard | null>(null);

  const selectedCard = cards?.find(c => c.id === selectedCardId);

  const handleAddCard = () => {
    setEditingCard(null);
    setIsCardSheetOpen(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsCardSheetOpen(true);
  };

  const handleMakePayment = (card: CreditCard) => {
    setPaymentCard(card);
    setIsPaymentSheetOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="p-6 space-y-6">
        {selectedCardId ? (
          <CardTransactionList 
            cardId={selectedCardId} 
            cardName={selectedCard?.name || ""}
            onBack={() => setSelectedCardId(null)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">บัตรเครดิต</h2>
              <button
                onClick={handleAddCard}
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
                <CardList 
                  cards={cards || []} 
                  onCardClick={(card) => setSelectedCardId(card.id)}
                  onEditClick={handleEditCard}
                  onPaymentClick={handleMakePayment}
                />
                {(cards?.length === 0 || !cards) && (
                  <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <CardIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลบัตรเครดิต<br/>เพิ่มบัตรเพื่อเริ่มติดตามยอดใช้จ่าย</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <CardSheet
        isOpen={isCardSheetOpen}
        onClose={() => setIsCardSheetOpen(false)}
        card={editingCard}
      />

      <PaymentSheet
        isOpen={isPaymentSheetOpen}
        onClose={() => setIsPaymentSheetOpen(false)}
        card={paymentCard}
      />
    </div>
  );
}
