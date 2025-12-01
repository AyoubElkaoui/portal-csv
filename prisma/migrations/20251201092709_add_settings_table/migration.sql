/*
  Warnings:

  - You are about to drop the column `sheetNames` on the `Upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "sheetNames";

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "uploaderEmail" TEXT NOT NULL DEFAULT 'anissa@example.com',
    "reviewerEmail" TEXT NOT NULL DEFAULT 'reviewer@example.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
