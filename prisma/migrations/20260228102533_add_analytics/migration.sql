-- CreateTable
CREATE TABLE "ProductContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seoDescription" TEXT
);

-- CreateTable
CREATE TABLE "ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMediaContext_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductContext" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductContext_shop_shopifyProductId_key" ON "ProductContext"("shop", "shopifyProductId");
