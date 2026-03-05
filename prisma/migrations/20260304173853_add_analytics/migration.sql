-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Optimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Optimization_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Optimization" ("createdAt", "id", "productId", "shop", "status") SELECT "createdAt", "id", "productId", "shop", "status" FROM "Optimization";
DROP TABLE "Optimization";
ALTER TABLE "new_Optimization" RENAME TO "Optimization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
