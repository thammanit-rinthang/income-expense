-- CreateTable
CREATE TABLE "received_payments" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "sender" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "received_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "received_payments_budget_id_idx" ON "received_payments"("budget_id");

-- AddForeignKey
ALTER TABLE "received_payments" ADD CONSTRAINT "received_payments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
