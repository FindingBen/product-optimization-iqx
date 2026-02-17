-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessRuleset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "storeDescription" TEXT NOT NULL,
    "productScan" BOOLEAN DEFAULT false,
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
INSERT INTO "new_BusinessRuleset" ("createdAt", "id", "keywords", "maxAltDescLength", "maxDescriptionLength", "maxTitleLength", "minDescriptionLength", "minImages", "minTitleLength", "productAltImageRule", "productDescriptionRule", "productDescriptionTemplate", "productImageRule", "productNameRule", "productScan", "productTagRule", "productVariantRule", "requiresAltText", "shop", "storeDescription", "updatedAt") SELECT "createdAt", "id", "keywords", "maxAltDescLength", "maxDescriptionLength", "maxTitleLength", "minDescriptionLength", "minImages", "minTitleLength", "productAltImageRule", "productDescriptionRule", "productDescriptionTemplate", "productImageRule", "productNameRule", "productScan", "productTagRule", "productVariantRule", "requiresAltText", "shop", "storeDescription", "updatedAt" FROM "BusinessRuleset";
DROP TABLE "BusinessRuleset";
ALTER TABLE "new_BusinessRuleset" RENAME TO "BusinessRuleset";
CREATE UNIQUE INDEX "BusinessRuleset_shop_key" ON "BusinessRuleset"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
