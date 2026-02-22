/*
  Warnings:

  - You are about to alter the column `completeness` on the `SeoAnalysis` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SeoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeoAnalysis" ("completeness", "createdAt", "id", "productId", "score") SELECT "completeness", "createdAt", "id", "productId", "score" FROM "SeoAnalysis";
DROP TABLE "SeoAnalysis";
ALTER TABLE "new_SeoAnalysis" RENAME TO "SeoAnalysis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
