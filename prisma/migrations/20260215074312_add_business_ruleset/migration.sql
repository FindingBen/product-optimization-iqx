-- CreateTable
CREATE TABLE "BusinessRuleset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productNameRule" TEXT,
    "productDescriptionRule" TEXT,
    "productImageRule" TEXT,
    "productVariantRule" TEXT,
    "productTagRule" TEXT,
    "productAltImageRule" TEXT,
    "keywords" TEXT,
    "minTitleLength" INTEGER NOT NULL DEFAULT 20,
    "maxTitleLength" INTEGER NOT NULL DEFAULT 70,
    "productDescriptionTemplate" TEXT,
    "minDescriptionLength" INTEGER NOT NULL DEFAULT 120,
    "maxDescriptionLength" INTEGER NOT NULL DEFAULT 300,
    "maxAltDescLength" INTEGER NOT NULL DEFAULT 30,
    "minImages" INTEGER NOT NULL DEFAULT 1,
    "requiresAltText" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRuleset_shop_key" ON "BusinessRuleset"("shop");
