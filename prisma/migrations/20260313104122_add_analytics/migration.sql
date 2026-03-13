/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `Optimization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Optimization_productId_key" ON "Optimization"("productId");
