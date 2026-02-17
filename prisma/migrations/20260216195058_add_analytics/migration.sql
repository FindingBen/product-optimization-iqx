-- CreateTable
CREATE TABLE "ProductContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "metaDescription" TEXT
);

-- CreateTable
CREATE TABLE "ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productContextId" TEXT NOT NULL,
    "altText" TEXT
);

-- CreateTable
CREATE TABLE "SeoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completness" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductContext_shop_key" ON "ProductContext"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMediaContext_shop_key" ON "ProductMediaContext"("shop");
