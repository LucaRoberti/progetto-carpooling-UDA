/*
  Warnings:

  - The primary key for the `feedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[codiceFiscaleP,codiceFiscaleA,idViaggio,direzione]` on the table `feedback` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_codiceFiscaleP_codiceFiscaleA_idViaggio_direzione_key" ON "feedback"("codiceFiscaleP", "codiceFiscaleA", "idViaggio", "direzione");

-- AddForeignKey
ALTER TABLE "viaggio" ADD CONSTRAINT "viaggio_targa_fkey" FOREIGN KEY ("targa") REFERENCES "macchina"("targa") ON DELETE SET NULL ON UPDATE CASCADE;
