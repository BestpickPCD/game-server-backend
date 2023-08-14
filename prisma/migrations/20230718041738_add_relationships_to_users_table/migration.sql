-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `Currencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
