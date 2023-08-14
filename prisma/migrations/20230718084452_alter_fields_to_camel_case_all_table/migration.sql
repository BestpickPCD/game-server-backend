/*
  Warnings:

  - You are about to drop the column `role_id` on the `ip_user` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `ip_user` table. All the data in the column will be lost.
  - You are about to drop the column `currency_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `ip_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ip_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `Users_currency_id_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `Users_role_id_fkey`;

-- AlterTable
ALTER TABLE `ip_user` DROP COLUMN `role_id`,
    DROP COLUMN `user_id`,
    ADD COLUMN `roleId` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `currency_id`,
    DROP COLUMN `role_id`,
    ADD COLUMN `currencyId` INTEGER NULL,
    ADD COLUMN `roleId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `Currencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
