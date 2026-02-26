-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seoDescription" TEXT
);
INSERT INTO "new_Product" ("description", "id", "seoDescription", "shop", "shopifyProductId", "title") SELECT "description", "id", "seoDescription", "shop", "shopifyProductId", "title" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_shop_shopifyProductId_key" ON "Product"("shop", "shopifyProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
