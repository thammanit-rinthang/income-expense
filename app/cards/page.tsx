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

  const selectedCard = cards?.find((c) => c.id === selectedCardId);

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
    <div className="flex flex-col min-h-screen bg-base-200">
      <Header />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {selectedCardId ? (
          <CardTransactionList
            cardId={selectedCardId}
            cardName={selectedCard?.name || ""}
            onBack={() => setSelectedCardId(null)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-base-content">บัตรเครดิต</h2>
                <p className="text-xs text-base-content/60">
                  ติดตามวงเงินคงเหลือ ยอดเรียกเก็บ และบันทึกการชำระเงิน
                </p>
              </div>
              <button
                onClick={handleAddCard}
                className="btn btn-sm btn-primary rounded-xl px-4 font-bold flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>เพิ่มบัตร</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CardList
                    cards={cards || []}
                    onCardClick={(card) => setSelectedCardId(card.id)}
                    onEditClick={handleEditCard}
                    onPaymentClick={handleMakePayment}
                  />
                </div>
                {(cards?.length === 0 || !cards) && (
                  <div className="text-center p-12 bg-base-100 rounded-xl border border-dashed border-base-300">
                    <CardIcon size={40} className="mx-auto text-base-content/30 mb-3" />
                    <p className="text-sm text-base-content/60 font-medium">
                      ยังไม่มีข้อมูลบัตรเครดิต
                      <br />
                      เพิ่มบัตรเพื่อเริ่มติดตามยอดใช้จ่าย
                    </p>
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
