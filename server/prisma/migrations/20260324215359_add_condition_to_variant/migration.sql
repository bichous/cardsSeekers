-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "price" REAL NOT NULL,
    "originalPrice" REAL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductVariant" ("id", "language", "originalPrice", "price", "productId", "stock") SELECT "id", "language", "originalPrice", "price", "productId", "stock" FROM "ProductVariant";
DROP TABLE "ProductVariant";
ALTER TABLE "new_ProductVariant" RENAME TO "ProductVariant";
CREATE UNIQUE INDEX "ProductVariant_productId_language_condition_key" ON "ProductVariant"("productId", "language", "condition");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
