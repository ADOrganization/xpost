-- AlterTable
ALTER TABLE "User" ADD COLUMN     "encryptedXClientId" TEXT,
ADD COLUMN     "encryptedXClientSecret" TEXT;

-- AlterTable
ALTER TABLE "XAccount" ADD COLUMN     "encryptedClientId" TEXT,
ADD COLUMN     "encryptedClientSecret" TEXT;
