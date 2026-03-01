/*
  Warnings:

  - You are about to drop the column `optimized` on the `ProductContext` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN "shopifyMediaId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seoDescription" TEXT
);
INSERT INTO "new_ProductContext" ("description", "id", "seoDescription", "shop", "shopifyProductId", "title") SELECT "description", "id", "seoDescription", "shop", "shopifyProductId", "title" FROM "ProductContext";
DROP TABLE "ProductContext";
ALTER TABLE "new_ProductContext" RENAME TO "ProductContext";
CREATE UNIQUE INDEX "ProductContext_shop_shopifyProductId_key" ON "ProductContext"("shop", "shopifyProductId");
CREATE TABLE "new_ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "shopifyMediaId" TEXT,
    "url" TEXT,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMediaContext_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductContext" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductMediaContext" ("altText", "createdAt", "id", "productId", "url") SELECT "altText", "createdAt", "id", "productId", "url" FROM "ProductMediaContext";
DROP TABLE "ProductMediaContext";
ALTER TABLE "new_ProductMediaContext" RENAME TO "ProductMediaContext";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
