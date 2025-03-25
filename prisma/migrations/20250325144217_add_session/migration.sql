/*
  Warnings:

  - You are about to drop the column `apikey` on the `Pausar` table. All the data in the column will be lost.
  - You are about to drop the column `instancia` on the `Pausar` table. All the data in the column will be lost.
  - Added the required column `apikeyId` to the `Pausar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instanciaId` to the `Pausar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pausar" DROP COLUMN "apikey",
DROP COLUMN "instancia",
ADD COLUMN     "apikeyId" TEXT NOT NULL,
ADD COLUMN     "instanciaId" TEXT NOT NULL,
ALTER COLUMN "mensaje" SET DEFAULT 'Fue un gusto ayudarte.';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "apiUrl" SET DEFAULT 'https://api.openAI.co',
ALTER COLUMN "company" SET DEFAULT 'Empresa Demo',
ALTER COLUMN "lat" SET DEFAULT '0.0000',
ALTER COLUMN "lng" SET DEFAULT '0.0000',
ALTER COLUMN "mapsUrl" SET DEFAULT 'https://maps.google.com/?q=0,0',
ALTER COLUMN "notificationNumber" SET DEFAULT '0000000000',
ALTER COLUMN "openingPhrase" SET DEFAULT 'DEPRECATED';
