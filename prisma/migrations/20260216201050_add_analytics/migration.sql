/*
  Warnings:

  - You are about to drop the column `shop` on the `ProductContext` table. All the data in the column will be lost.
  - You are about to drop the column `shop` on the `ProductMediaContext` table. All the data in the column will be lost.
  - You are about to drop the column `completness` on the `SeoAnalysis` table. All the data in the column will be lost.
  - Added the required column `productId` to the `ProductContext` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `ProductMediaContext` table without a default value. This is not possible if the table is not empty.
  - Added the required column `completeness` to the `SeoAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "metaDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductContext_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductContext" ("description", "id", "metaDescription", "title") SELECT "description", "id", "metaDescription", "title" FROM "ProductContext";
DROP TABLE "ProductContext";
ALTER TABLE "new_ProductContext" RENAME TO "ProductContext";
CREATE TABLE "new_ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productContextId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMediaContext_productContextId_fkey" FOREIGN KEY ("productContextId") REFERENCES "ProductContext" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductMediaContext" ("altText", "id", "productContextId") SELECT "altText", "id", "productContextId" FROM "ProductMediaContext";
DROP TABLE "ProductMediaContext";
ALTER TABLE "new_ProductMediaContext" RENAME TO "ProductMediaContext";
CREATE TABLE "new_SeoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completeness" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SeoAnalysis" ("createdAt", "id", "productId", "score") SELECT "createdAt", "id", "productId", "score" FROM "SeoAnalysis";
DROP TABLE "SeoAnalysis";
ALTER TABLE "new_SeoAnalysis" RENAME TO "SeoAnalysis";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Product_shop_shopifyProductId_key" ON "Product"("shop", "shopifyProductId");
