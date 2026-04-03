-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "products" INTEGER NOT NULL DEFAULT 20,
ALTER COLUMN "monthlyOptimizationLimit" SET DEFAULT 20;
