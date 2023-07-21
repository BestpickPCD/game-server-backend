/*
  Warnings:

  - You are about to drop the column `type` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `type`,
    ADD COLUMN `action` INTEGER NULL;
