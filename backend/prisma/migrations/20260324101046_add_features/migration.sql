-- AlterTable
ALTER TABLE "autista" ADD COLUMN     "descrizione" VARCHAR(300);

-- AlterTable
ALTER TABLE "passeggero" ADD COLUMN     "descrizione" VARCHAR(300);

-- AlterTable
ALTER TABLE "prenotazioni" ADD COLUMN     "messaggio" VARCHAR(300);

-- AlterTable
ALTER TABLE "viaggio" ADD COLUMN     "tappe" TEXT[];
