-- CreateTable
CREATE TABLE "autista" (
    "codiceFiscale" VARCHAR(30) NOT NULL,
    "numPatente" INTEGER NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "emailA" VARCHAR(40) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "foto" BYTEA,
    "scadenzaPatente" DATE NOT NULL,
    "nome" VARCHAR(15) NOT NULL,
    "cognome" VARCHAR(15) NOT NULL,

    CONSTRAINT "autista_pkey" PRIMARY KEY ("codiceFiscale")
);

-- CreateTable
CREATE TABLE "passeggero" (
    "codiceFiscale" VARCHAR(30) NOT NULL,
    "emailP" VARCHAR(30) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(15) NOT NULL,
    "nome" VARCHAR(20) NOT NULL,
    "cognome" VARCHAR(20) NOT NULL,

    CONSTRAINT "passeggero_pkey" PRIMARY KEY ("codiceFiscale")
);

-- CreateTable
CREATE TABLE "macchina" (
    "targa" VARCHAR(15) NOT NULL,
    "marca" VARCHAR(20) NOT NULL,
    "modello" VARCHAR(20) NOT NULL,
    "nPosti" INTEGER NOT NULL,
    "codiceFiscaleA" VARCHAR(30) NOT NULL,

    CONSTRAINT "macchina_pkey" PRIMARY KEY ("targa")
);

-- CreateTable
CREATE TABLE "viaggio" (
    "idViaggio" SERIAL NOT NULL,
    "cittaP" VARCHAR(30) NOT NULL,
    "cittaD" VARCHAR(30) NOT NULL,
    "dataOra" TIMESTAMP(3) NOT NULL,
    "costo" INTEGER NOT NULL,
    "tempo" INTEGER NOT NULL,
    "bagagli" BOOLEAN NOT NULL,
    "animali" BOOLEAN NOT NULL,
    "nPosti" INTEGER NOT NULL,
    "codiceFiscaleA" VARCHAR(30) NOT NULL,
    "chiuso" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "viaggio_pkey" PRIMARY KEY ("idViaggio")
);

-- CreateTable
CREATE TABLE "prenotazioni" (
    "idPrenotazione" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "stato" VARCHAR(10) NOT NULL DEFAULT 'pending',
    "idViaggio" INTEGER NOT NULL,
    "codiceFiscaleP" VARCHAR(30) NOT NULL,

    CONSTRAINT "prenotazioni_pkey" PRIMARY KEY ("idPrenotazione")
);

-- CreateTable
CREATE TABLE "feedback" (
    "voto" INTEGER NOT NULL,
    "giudizio" VARCHAR(200) NOT NULL,
    "direzione" BOOLEAN NOT NULL,
    "codiceFiscaleP" VARCHAR(30) NOT NULL,
    "codiceFiscaleA" VARCHAR(30) NOT NULL,
    "idViaggio" INTEGER NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("codiceFiscaleP","codiceFiscaleA","idViaggio")
);

-- CreateIndex
CREATE UNIQUE INDEX "autista_emailA_key" ON "autista"("emailA");

-- CreateIndex
CREATE UNIQUE INDEX "passeggero_emailP_key" ON "passeggero"("emailP");

-- AddForeignKey
ALTER TABLE "macchina" ADD CONSTRAINT "macchina_codiceFiscaleA_fkey" FOREIGN KEY ("codiceFiscaleA") REFERENCES "autista"("codiceFiscale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viaggio" ADD CONSTRAINT "viaggio_codiceFiscaleA_fkey" FOREIGN KEY ("codiceFiscaleA") REFERENCES "autista"("codiceFiscale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenotazioni" ADD CONSTRAINT "prenotazioni_idViaggio_fkey" FOREIGN KEY ("idViaggio") REFERENCES "viaggio"("idViaggio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenotazioni" ADD CONSTRAINT "prenotazioni_codiceFiscaleP_fkey" FOREIGN KEY ("codiceFiscaleP") REFERENCES "passeggero"("codiceFiscale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_codiceFiscaleP_fkey" FOREIGN KEY ("codiceFiscaleP") REFERENCES "passeggero"("codiceFiscale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_codiceFiscaleA_fkey" FOREIGN KEY ("codiceFiscaleA") REFERENCES "autista"("codiceFiscale") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_idViaggio_fkey" FOREIGN KEY ("idViaggio") REFERENCES "viaggio"("idViaggio") ON DELETE RESTRICT ON UPDATE CASCADE;
