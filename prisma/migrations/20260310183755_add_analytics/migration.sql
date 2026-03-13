/*
  Warnings:

  - You are about to drop the column `productId` on the `AutomationRun` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "enable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "optimizeTitle" BOOLEAN NOT NULL DEFAULT false,
    "optimizeDescription" BOOLEAN NOT NULL DEFAULT false,
    "optimizeAltText" BOOLEAN NOT NULL DEFAULT false,
    "optimizeSeo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AutomationRun" ("createdAt", "enable", "id", "optimizeAltText", "optimizeDescription", "optimizeSeo", "optimizeTitle", "shop", "status") SELECT "createdAt", "enable", "id", "optimizeAltText", "optimizeDescription", "optimizeSeo", "optimizeTitle", "shop", "status" FROM "AutomationRun";
DROP TABLE "AutomationRun";
ALTER TABLE "new_AutomationRun" RENAME TO "AutomationRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
