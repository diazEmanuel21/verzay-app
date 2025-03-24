/*
  Warnings:

  - You are about to drop the column `openingPhrase` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PhraseType" AS ENUM ('abrir', 'pausa');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "openingPhrase",
ALTER COLUMN "apiUrl" SET DEFAULT 'https://api.verzay.co',
ALTER COLUMN "company" SET DEFAULT 'Empresa Demo',
ALTER COLUMN "lat" SET DEFAULT '0.0000',
ALTER COLUMN "lng" SET DEFAULT '0.0000',
ALTER COLUMN "mapsUrl" SET DEFAULT 'https://maps.google.com/?q=0,0',
ALTER COLUMN "notificationNumber" SET DEFAULT '0000000000';

-- CreateTable
CREATE TABLE "ChatPhrase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL DEFAULT 'Fue un gusto ayudarle.',
    "tipo" "PhraseType" NOT NULL DEFAULT 'abrir',
    "baseurl" TEXT NOT NULL DEFAULT 'https://conexion.verzay.co',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatPhrase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatPhrase" ADD CONSTRAINT "ChatPhrase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
