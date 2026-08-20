-- AlterTable
ALTER TABLE "ai_usage_logs"
  ALTER COLUMN "estimated_cost_usd" TYPE DOUBLE PRECISION USING "estimated_cost_usd"::DOUBLE PRECISION;
