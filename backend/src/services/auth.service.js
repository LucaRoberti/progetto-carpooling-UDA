import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

const SALT_ROUNDS = 10;

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function registerDriver(data) {
  const existing = await prisma.autista.findUnique({
    where: { codiceFiscale: data.codiceFiscale },
  });
  if (existing) throw { status: 409, message: "Autista già registrato" };

  const emailTaken = await prisma.autista.findUnique({
    where: { emailA: data.emailA },
  });
  if (emailTaken) throw { status: 409, message: "Email già in uso" };

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  const driver = await prisma.autista.create({
    data: {
      codiceFiscale: data.codiceFiscale,
      numPatente: data.numPatente,
      telefono: data.telefono,
      emailA: data.emailA,
      password: hashed,
      scadenzaPatente: new Date(data.scadenzaPatente),
      nome: data.nome,
      cognome: data.cognome,
    },
  });

  const token = signToken({
    id: driver.codiceFiscale,
    role: "autista",
    email: driver.emailA,
  });

  const { password: _, ...safe } = driver;
  return { user: safe, token, role: "autista" };
}

export async function registerPassenger(data) {
  const existing = await prisma.passeggero.findUnique({
    where: { codiceFiscale: data.codiceFiscale },
  });
  if (existing) throw { status: 409, message: "Passeggero già registrato" };

  const emailTaken = await prisma.passeggero.findUnique({
    where: { emailP: data.emailP },
  });
  if (emailTaken) throw { status: 409, message: "Email già in uso" };

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  const passenger = await prisma.passeggero.create({
    data: {
      codiceFiscale: data.codiceFiscale,
      emailP: data.emailP,
      password: hashed,
      telefono: data.telefono,
      nome: data.nome,
      cognome: data.cognome,
    },
  });

  const token = signToken({
    id: passenger.codiceFiscale,
    role: "passeggero",
    email: passenger.emailP,
  });

  const { password: _, ...safe } = passenger;
  return { user: safe, token, role: "passeggero" };
}

export async function login(email, password) {
  // Try driver first
  let user = await prisma.autista.findUnique({ where: { emailA: email } });
  let role = "autista";

  if (!user) {
    user = await prisma.passeggero.findUnique({ where: { emailP: email } });
    role = "passeggero";
  }

  if (!user) throw { status: 401, message: "Credenziali non valide" };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: "Credenziali non valide" };

  const token = signToken({
    id: user.codiceFiscale,
    role,
    email,
  });

  const { password: _, ...safe } = user;
  return { user: safe, token, role };
}
