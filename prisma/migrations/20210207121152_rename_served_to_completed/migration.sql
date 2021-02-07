/*
  Warnings:

  - You are about to drop the column `served` on the `OrderInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderInfo" DROP COLUMN "served",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;
