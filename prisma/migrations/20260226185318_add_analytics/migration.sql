/*
  Warnings:

  - You are about to drop the `ProductContext` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `productContextId` on the `ProductMediaContext` table. All the data in the column will be lost.
  - Added the required column `productId` to the `ProductMediaContext` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductContext";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMediaContext_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductMediaContext" ("altText", "createdAt", "id", "url") SELECT "altText", "createdAt", "id", "url" FROM "ProductMediaContext";
DROP TABLE "ProductMediaContext";
ALTER TABLE "new_ProductMediaContext" RENAME TO "ProductMediaContext";
CREATE TABLE "new_SeoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completeness" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeoAnalysis" ("completeness", "createdAt", "id", "productId", "score") SELECT "completeness", "createdAt", "id", "productId", "score" FROM "SeoAnalysis";
DROP TABLE "SeoAnalysis";
ALTER TABLE "new_SeoAnalysis" RENAME TO "SeoAnalysis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
