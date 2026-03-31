import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const driver = await prisma.autista.upsert({
    where: { codiceFiscale: "RSSMRA85M01H501Z" },
    update: {},
    create: {
      codiceFiscale: "RSSMRA85M01H501Z",
      numPatente: 123456789,
      telefono: "3331234567",
      emailA: "mario.rossi@email.it",
      password,
      scadenzaPatente: new Date("2028-12-31"),
      nome: "Mario",
      cognome: "Rossi",
    },
  });

  await prisma.macchina.upsert({
    where: { targa: "AB123CD" },
    update: {},
    create: {
      targa: "AB123CD",
      marca: "Fiat",
      modello: "Panda",
      nPosti: 4,
      codiceFiscaleA: driver.codiceFiscale,
    },
  });

  const passenger = await prisma.passeggero.upsert({
    where: { codiceFiscale: "VRDLGI90A01F205X" },
    update: {},
    create: {
      codiceFiscale: "VRDLGI90A01F205X",
      emailP: "luigi.verdi@email.it",
      password,
      telefono: "3339876543",
      nome: "Luigi",
      cognome: "Verdi",
    },
  });

  const trip = await prisma.viaggio.upsert({
    where: { idViaggio: 1 },
    update: {},
    create: {
      cittaP: "Milano",
      cittaD: "Roma",
      dataOra: new Date("2026-04-15T08:00:00"),
      costo: 25,
      tempo: 360,
      bagagli: true,
      animali: false,
      nPosti: 3,
      codiceFiscaleA: driver.codiceFiscale,
      chiuso: false,
    },
  });

  await prisma.viaggio.upsert({
    where: { idViaggio: 2 },
    update: {},
    create: {
      cittaP: "Torino",
      cittaD: "Firenze",
      dataOra: new Date("2026-04-20T09:30:00"),
      costo: 20,
      tempo: 300,
      bagagli: true,
      animali: true,
      nPosti: 2,
      codiceFiscaleA: driver.codiceFiscale,
      chiuso: false,
    },
  });

  console.log("🌱 Seed completato:", { driver: driver.nome, passenger: passenger.nome, tripId: trip.idViaggio });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
