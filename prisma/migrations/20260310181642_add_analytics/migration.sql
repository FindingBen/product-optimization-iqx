-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationRun_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AutomationRun" ("createdAt", "enable", "id", "productId", "shop", "status") SELECT "createdAt", "enable", "id", "productId", "shop", "status" FROM "AutomationRun";
DROP TABLE "AutomationRun";
ALTER TABLE "new_AutomationRun" RENAME TO "AutomationRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
