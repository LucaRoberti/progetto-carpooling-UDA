import prisma from "../utils/prisma.js";

export async function addCar(codiceFiscaleA, data) {
  return prisma.macchina.create({
    data: {
      targa: data.targa,
      marca: data.marca,
      modello: data.modello,
      nPosti: data.nPosti,
      codiceFiscaleA,
    },
  });
}

export async function getDriverCars(codiceFiscaleA) {
  return prisma.macchina.findMany({ where: { codiceFiscaleA } });
}

export async function deleteCar(targa, codiceFiscaleA) {
  const car = await prisma.macchina.findUnique({ where: { targa } });
  if (!car) throw { status: 404, message: "Macchina non trovata" };
  if (car.codiceFiscaleA !== codiceFiscaleA) throw { status: 403, message: "Non autorizzato" };
  return prisma.macchina.delete({ where: { targa } });
}
