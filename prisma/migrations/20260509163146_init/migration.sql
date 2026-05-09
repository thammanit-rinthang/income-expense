-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "card_id" INTEGER,
ALTER COLUMN "category_id" DROP NOT NULL,
ALTER COLUMN "budget_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "loans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "person_name" TEXT,
    "budget_id" INTEGER,
    "principal" DECIMAL(65,30) NOT NULL,
    "interest_rate" DECIMAL(65,30) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_payments" (
    "id" SERIAL NOT NULL,
    "loan_id" INTEGER NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "person_name" TEXT,
    "credit_limit" DECIMAL(65,30) NOT NULL,
    "statement_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minimum_payment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due_date" DATE,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_payments" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "budget_id" INTEGER,
    "transaction_id" INTEGER,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_budget_id_idx" ON "loans"("budget_id");

-- CreateIndex
CREATE INDEX "loan_payments_loan_id_idx" ON "loan_payments"("loan_id");

-- CreateIndex
CREATE INDEX "loan_payments_budget_id_idx" ON "loan_payments"("budget_id");

-- CreateIndex
CREATE INDEX "card_payments_card_id_idx" ON "card_payments"("card_id");

-- CreateIndex
CREATE INDEX "card_payments_budget_id_idx" ON "card_payments"("budget_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_payments" ADD CONSTRAINT "card_payments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
