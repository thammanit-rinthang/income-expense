ALTER TABLE "monthly_budgets"
ADD COLUMN "reserved_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;
