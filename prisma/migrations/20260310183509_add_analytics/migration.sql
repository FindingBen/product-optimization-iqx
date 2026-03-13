/*
  Warnings:

  - Added the required column `productId` to the `AutomationResult` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "originalValue" TEXT,
    "optimizedValue" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutomationResult" ("approved", "createdAt", "id", "optimizedValue", "originalValue", "runId", "type") SELECT "approved", "createdAt", "id", "optimizedValue", "originalValue", "runId", "type" FROM "AutomationResult";
DROP TABLE "AutomationResult";
ALTER TABLE "new_AutomationResult" RENAME TO "AutomationResult";
CREATE TABLE "new_AutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "enable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "optimizeTitle" BOOLEAN NOT NULL DEFAULT false,
    "optimizeDescription" BOOLEAN NOT NULL DEFAULT false,
    "optimizeAltText" BOOLEAN NOT NULL DEFAULT false,
    "optimizeSeo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AutomationRun" ("createdAt", "enable", "id", "optimizeAltText", "optimizeDescription", "optimizeSeo", "optimizeTitle", "productId", "shop", "status") SELECT "createdAt", "enable", "id", "optimizeAltText", "optimizeDescription", "optimizeSeo", "optimizeTitle", "productId", "shop", "status" FROM "AutomationRun";
DROP TABLE "AutomationRun";
ALTER TABLE "new_AutomationRun" RENAME TO "AutomationRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
