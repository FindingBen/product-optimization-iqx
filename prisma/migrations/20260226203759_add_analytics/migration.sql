-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Optimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Optimization" ("id", "productId", "shop", "status") SELECT "id", "productId", "shop", "status" FROM "Optimization";
DROP TABLE "Optimization";
ALTER TABLE "new_Optimization" RENAME TO "Optimization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
