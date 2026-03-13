/*
  Warnings:

  - You are about to drop the column `enable` on the `AutomationRun` table. All the data in the column will be lost.
  - You are about to drop the column `optimizeAltText` on the `AutomationRun` table. All the data in the column will be lost.
  - You are about to drop the column `optimizeDescription` on the `AutomationRun` table. All the data in the column will be lost.
  - You are about to drop the column `optimizeSeo` on the `AutomationRun` table. All the data in the column will be lost.
  - You are about to drop the column `optimizeTitle` on the `AutomationRun` table. All the data in the column will be lost.
  - Added the required column `productId` to the `AutomationRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruleId` to the `AutomationRun` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Product Optimization',
    "enable" BOOLEAN NOT NULL DEFAULT true,
    "optimizeTitle" BOOLEAN NOT NULL DEFAULT false,
    "optimizeDescription" BOOLEAN NOT NULL DEFAULT false,
    "optimizeAltText" BOOLEAN NOT NULL DEFAULT false,
    "optimizeSeo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutomationRun" ("createdAt", "id", "shop", "status") SELECT "createdAt", "id", "shop", "status" FROM "AutomationRun";
DROP TABLE "AutomationRun";
ALTER TABLE "new_AutomationRun" RENAME TO "AutomationRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
