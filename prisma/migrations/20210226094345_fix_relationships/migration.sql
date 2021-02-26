-- AlterTable
ALTER TABLE "User" ALTER COLUMN "licenceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Licence" ALTER COLUMN "remainingSeats" DROP NOT NULL;
