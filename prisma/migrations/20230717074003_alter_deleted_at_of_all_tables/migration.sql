-- AlterTable
ALTER TABLE `ip_user` MODIFY `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `roles` MODIFY `deletedAt` DATETIME(3) NULL;
