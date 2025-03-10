/*
  Warnings:

  - You are about to drop the column `datasourceUrl` on the `WorkflowNode` table. All the data in the column will be lost.
  - You are about to drop the column `messageType` on the `WorkflowNode` table. All the data in the column will be lost.
  - You are about to drop the column `remoteId` on the `WorkflowNode` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `WorkflowNode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkflowNode" DROP COLUMN "datasourceUrl",
DROP COLUMN "messageType",
DROP COLUMN "remoteId",
ADD COLUMN     "tipo" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;
