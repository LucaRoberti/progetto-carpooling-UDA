// Importa il client Prisma per interagire con il database
import prisma from "../utils/prisma.js";

/**
 * Recupera il profilo privato dell'utente autenticato.
 * Il profilo include tutti i dati personali tranne la password.
 * Se l'utente è un autista, include anche la lista delle sue macchine registrate.
 *
 * @param {string} id - Codice fiscale dell'utente
 * @param {string} role - Ruolo dell'utente ("autista" o "passeggero")
 * @returns {Promise<Object>} Dati del profilo senza la password, con il ruolo aggiunto
 * @throws {Object} Errore 404 se l'utente non esiste nel database
 */
export async function getProfile(id, role) {
  // Gestione del profilo per gli autisti
  if (role === "autista") {
    const user = await prisma.autista.findUnique({
      where: { codiceFiscale: id },
      // Include la lista delle macchine registrate dall'autista
      include: { macchine: true },
    });
    if (!user) throw { status: 404, message: "Utente non trovato" };

    // Rimuove la password dall'oggetto utente prima di restituirlo
    // La destrutturazione assegna la password a "_" (variabile ignorata) e il resto a "safe"
    const { password: _, ...safe } = user;
    // Aggiunge il campo "role" all'oggetto restituito
    return { ...safe, role };
  }

  // Gestione del profilo per i passeggeri (senza macchine)
  const user = await prisma.passeggero.findUnique({
    where: { codiceFiscale: id },
  });
  if (!user) throw { status: 404, message: "Utente non trovato" };

  // Rimuove la password prima di restituire i dati del passeggero
  const { password: _, ...safe } = user;
  return { ...safe, role };
}

/**
 * Recupera il profilo pubblico di un utente tramite codice fiscale.
 * Cerca prima tra gli autisti, poi tra i passeggeri.
 * Calcola la valutazione media e prepara la lista dei feedback ricevuti.
 * Non include dati sensibili come email e password.
 *
 * @param {string} codiceFiscale - Codice fiscale dell'utente da cercare
 * @returns {Promise<Object>} Profilo pubblico con valutazione media, numero recensioni e lista feedback
 * @throws {Object} Errore 404 se l'utente non esiste né come autista né come passeggero
 */
export async function getPublicProfile(codiceFiscale) {
  // Prima ricerca: cerca il codice fiscale nella tabella degli autisti
  // Include solo i feedback ricevuti (direzione=true = scritti dai passeggeri verso l'autista)
  const autista = await prisma.autista.findUnique({
    where: { codiceFiscale },
    select: {
      nome: true, cognome: true, telefono: true, descrizione: true, fotoUrl: true,
      feedbackA: {
        // Solo i feedback ricevuti dall'autista (direzione=true)
        where: { direzione: true },
        select: { voto: true, giudizio: true, passeggero: { select: { nome: true, cognome: true } } },
        orderBy: { id: "desc" },
      },
    },
  });

  // Se l'utente è un autista, elabora e restituisce il suo profilo pubblico
  if (autista) {
    const received = autista.feedbackA;
    // Calcola la media dei voti con una cifra decimale; null se non ci sono feedback
    const avg = received.length ? (received.reduce((s, f) => s + f.voto, 0) / received.length).toFixed(1) : null;
    // Trasforma i feedback includendo il nome completo del mittente (passeggero)
    const reviews = received.map((f) => ({ voto: f.voto, giudizio: f.giudizio, mittente: `${f.passeggero.nome} ${f.passeggero.cognome}` }));
    return { nome: autista.nome, cognome: autista.cognome, telefono: autista.telefono, descrizione: autista.descrizione, fotoUrl: autista.fotoUrl, role: "autista", avgRating: avg, reviewCount: received.length, reviews };
  }

  // Seconda ricerca: cerca il codice fiscale nella tabella dei passeggeri
  // Include solo i feedback ricevuti (direzione=false = scritti dagli autisti verso il passeggero)
  const passeggero = await prisma.passeggero.findUnique({
    where: { codiceFiscale },
    select: {
      nome: true, cognome: true, telefono: true, descrizione: true, fotoUrl: true,
      feedbackP: {
        // Solo i feedback ricevuti dal passeggero (direzione=false)
        where: { direzione: false },
        select: { voto: true, giudizio: true, autista: { select: { nome: true, cognome: true } } },
        orderBy: { id: "desc" },
      },
    },
  });

  // Se non trovato né come autista né come passeggero, lancia un errore 404
  if (!passeggero) throw { status: 404, message: "Utente non trovato" };

  const received = passeggero.feedbackP;
  // Calcola la media dei voti con una cifra decimale; null se non ci sono feedback
  const avg = received.length ? (received.reduce((s, f) => s + f.voto, 0) / received.length).toFixed(1) : null;
  // Trasforma i feedback includendo il nome completo del mittente (autista)
  const reviews = received.map((f) => ({ voto: f.voto, giudizio: f.giudizio, mittente: `${f.autista.nome} ${f.autista.cognome}` }));
  return { nome: passeggero.nome, cognome: passeggero.cognome, telefono: passeggero.telefono, descrizione: passeggero.descrizione, fotoUrl: passeggero.fotoUrl, role: "passeggero", avgRating: avg, reviewCount: received.length, reviews };
}

/**
 * Aggiorna i dati del profilo di un utente autenticato.
 * Solo alcuni campi sono modificabili: descrizione, telefono, fotoUrl ed email.
 * La funzione costruisce dinamicamente l'oggetto di aggiornamento includendo
 * solo i campi esplicitamente forniti nel body della richiesta.
 *
 * @param {string} id - Codice fiscale dell'utente da aggiornare
 * @param {string} role - Ruolo dell'utente ("autista" o "passeggero")
 * @param {Object} data - Dati da aggiornare (tutti opzionali)
 * @param {string} [data.descrizione] - Nuova descrizione/bio
 * @param {string} [data.telefono] - Nuovo numero di telefono
 * @param {string} [data.fotoUrl] - Nuovo URL della foto profilo
 * @param {string} [data.email] - Nuova email (mappata su emailA o emailP in base al ruolo)
 * @returns {Promise<Object>} Profilo aggiornato senza la password, con il ruolo aggiunto
 */
export async function updateProfile(id, role, data) {
  // Costruisce l'oggetto dei campi da aggiornare includendo solo i campi presenti
  // Questo evita di sovrascrivere accidentalmente campi con undefined
  const allowed = {};
  if (data.descrizione !== undefined) allowed.descrizione = data.descrizione;
  if (data.telefono !== undefined) allowed.telefono = data.telefono;
  if (data.fotoUrl !== undefined) allowed.fotoUrl = data.fotoUrl;

  // Il campo email ha nomi diversi per autisti e passeggeri nel database
  if (role === "autista") {
    // Per gli autisti il campo email nel DB si chiama "emailA"
    if (data.email !== undefined) allowed.emailA = data.email;
  } else {
    // Per i passeggeri il campo email nel DB si chiama "emailP"
    if (data.email !== undefined) allowed.emailP = data.email;
  }

  // Aggiorna il record nella tabella corretta in base al ruolo
  if (role === "autista") {
    const updated = await prisma.autista.update({ where: { codiceFiscale: id }, data: allowed });
    // Rimuove la password prima di restituire i dati aggiornati
    const { password: _, ...safe } = updated;
    return { ...safe, role };
  }

  const updated = await prisma.passeggero.update({ where: { codiceFiscale: id }, data: allowed });
  // Rimuove la password prima di restituire i dati aggiornati
  const { password: _, ...safe } = updated;
  return { ...safe, role };
}
