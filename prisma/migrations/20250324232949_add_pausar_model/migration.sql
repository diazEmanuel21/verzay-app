/*
  Warnings:

  - You are about to drop the `ChatPhrase` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatPhrase" DROP CONSTRAINT "ChatPhrase_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "openingPhrase" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "apiUrl" SET DEFAULT '',
ALTER COLUMN "company" SET DEFAULT '',
ALTER COLUMN "lat" SET DEFAULT '',
ALTER COLUMN "lng" SET DEFAULT '',
ALTER COLUMN "mapsUrl" SET DEFAULT '',
ALTER COLUMN "notificationNumber" SET DEFAULT '';

-- DropTable
DROP TABLE "ChatPhrase";

-- DropEnum
DROP TYPE "PhraseType";

-- CreateTable
CREATE TABLE "Pausar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instancia" TEXT NOT NULL,
    "apikey" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "baseurl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pausar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pausar" ADD CONSTRAINT "Pausar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
