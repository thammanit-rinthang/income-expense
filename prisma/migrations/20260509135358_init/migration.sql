-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "monthly_budget" DECIMAL(65,30),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_budgets" (
    "id" SERIAL NOT NULL,
    "person_name" TEXT NOT NULL,
    "month_year" DATE NOT NULL,
    "total_income" DECIMAL(65,30) NOT NULL,
    "remaining_spending_pool" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_costs" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fixed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_summaries" (
    "id" SERIAL NOT NULL,
    "month_year" DATE NOT NULL,
    "combined_income" DECIMAL(65,30) NOT NULL,
    "combined_spent" DECIMAL(65,30) NOT NULL,
    "combined_fixed" DECIMAL(65,30) NOT NULL,
    "person_a_spent" DECIMAL(65,30),
    "person_b_spent" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_budget_id_idx" ON "categories"("budget_id");

-- CreateIndex
CREATE INDEX "fixed_costs_budget_id_idx" ON "fixed_costs"("budget_id");

-- CreateIndex
CREATE INDEX "transactions_budget_id_idx" ON "transactions"("budget_id");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_costs" ADD CONSTRAINT "fixed_costs_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
