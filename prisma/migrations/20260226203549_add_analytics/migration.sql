/*
  Warnings:

  - Added the required column `shop` to the `Optimization` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Optimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL
);
INSERT INTO "new_Optimization" ("id", "productId", "status") SELECT "id", "productId", "status" FROM "Optimization";
DROP TABLE "Optimization";
ALTER TABLE "new_Optimization" RENAME TO "Optimization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
