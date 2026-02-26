-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductMediaContext" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductMediaContext_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductMediaContext" ("altText", "createdAt", "id", "productId", "url") SELECT "altText", "createdAt", "id", "productId", "url" FROM "ProductMediaContext";
DROP TABLE "ProductMediaContext";
ALTER TABLE "new_ProductMediaContext" RENAME TO "ProductMediaContext";
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
