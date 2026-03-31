// Importa il client Prisma per interagire con il database
import prisma from "../utils/prisma.js";

/**
 * Crea una nuova prenotazione per un viaggio.
 * Esegue una serie di verifiche prima di creare il record:
 *   1. Il viaggio esiste
 *   2. Il viaggio non è chiuso
 *   3. Il passeggero non è l'autista del viaggio
 *   4. Il passeggero non ha già una prenotazione attiva per lo stesso viaggio
 *   5. Ci sono posti disponibili
 *
 * @param {string} codiceFiscaleP - Codice fiscale del passeggero che prenota
 * @param {number} idViaggio - ID del viaggio da prenotare
 * @param {string} [messaggio] - Messaggio opzionale per l'autista
 * @returns {Promise<Object>} La prenotazione creata con i dati del viaggio inclusi
 * @throws {Object} Errori 404, 400 o 409 in base alla validazione fallita
 */
export async function createBooking(codiceFiscaleP, idViaggio, messaggio) {
  // Recupera il viaggio dal database includendo il conteggio delle prenotazioni accettate
  // per poter verificare la disponibilità dei posti
  const trip = await prisma.viaggio.findUnique({
    where: { idViaggio },
    include: { _count: { select: { prenotazioni: { where: { stato: "accepted" } } } } },
  });

  // Verifica 1: il viaggio deve esistere
  if (!trip) throw { status: 404, message: "Viaggio non trovato" };
  // Verifica 2: il viaggio non deve essere chiuso a nuove prenotazioni
  if (trip.chiuso) throw { status: 400, message: "Viaggio chiuso" };
  // Verifica 3: l'autista non può prenotare il proprio viaggio
  if (trip.codiceFiscaleA === codiceFiscaleP) {
    throw { status: 400, message: "Non puoi prenotare il tuo viaggio" };
  }

  // Verifica 4: controlla se il passeggero ha già una prenotazione non rifiutata per questo viaggio
  // Le prenotazioni rifiutate non bloccano una nuova richiesta, le pending e accepted sì
  const existing = await prisma.prenotazione.findFirst({
    where: { idViaggio, codiceFiscaleP, stato: { not: "rejected" } },
  });
  if (existing) throw { status: 409, message: "Prenotazione già esistente" };

  // Verifica 5: confronta le prenotazioni accettate con il numero massimo di posti
  if (trip._count.prenotazioni >= trip.nPosti) {
    throw { status: 400, message: "Posti esauriti" };
  }

  // Crea la prenotazione con stato iniziale "pending" (in attesa di approvazione dell'autista)
  return prisma.prenotazione.create({
    data: {
      // Registra la data odierna come data di prenotazione
      data: new Date(),
      stato: "pending",
      idViaggio,
      codiceFiscaleP,
      // Aggiunge il messaggio solo se presente (spread condizionale)
      ...(messaggio ? { messaggio } : {}),
    },
    // Include i dati del viaggio nella risposta per la visualizzazione immediata
    include: {
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true, costo: true } },
    },
  });
}

/**
 * Aggiorna lo stato di una prenotazione (accettazione o rifiuto da parte dell'autista).
 * Verifica che lo stato fornito sia valido e che solo l'autista del viaggio
 * possa modificare lo stato delle prenotazioni.
 *
 * @param {number} idPrenotazione - ID della prenotazione da aggiornare
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista che aggiorna lo stato
 * @param {string} stato - Nuovo stato: "accepted" (accettata) o "rejected" (rifiutata)
 * @returns {Promise<Object>} La prenotazione aggiornata con dati del passeggero e del viaggio
 * @throws {Object} Errore 400 per stato invalido, 404 se non trovata, 403 se non autorizzato
 */
export async function updateBookingStatus(idPrenotazione, codiceFiscaleA, stato) {
  // Verifica che lo stato fornito sia uno dei valori consentiti
  if (!["accepted", "rejected"].includes(stato)) {
    throw { status: 400, message: "Stato non valido" };
  }

  // Recupera la prenotazione dal database insieme al viaggio associato
  // per verificare che l'autista richiedente sia il proprietario del viaggio
  const booking = await prisma.prenotazione.findUnique({
    where: { idPrenotazione },
    include: { viaggio: true },
  });

  if (!booking) throw { status: 404, message: "Prenotazione non trovata" };
  // Solo l'autista proprietario del viaggio può gestire le prenotazioni
  if (booking.viaggio.codiceFiscaleA !== codiceFiscaleA) {
    throw { status: 403, message: "Non autorizzato" };
  }

  // Aggiorna lo stato della prenotazione nel database
  return prisma.prenotazione.update({
    where: { idPrenotazione },
    data: { stato },
    // Include i dati del passeggero e del viaggio nella risposta
    include: {
      passeggero: { select: { nome: true, cognome: true } },
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true } },
    },
  });
}

/**
 * Recupera tutte le prenotazioni effettuate da un passeggero.
 * Include i dati del viaggio e dell'autista per ogni prenotazione,
 * necessari per visualizzare le informazioni complete nella lista.
 *
 * @param {string} codiceFiscaleP - Codice fiscale del passeggero
 * @returns {Promise<Array>} Lista delle prenotazioni ordinate per data decrescente
 */
export async function getPassengerBookings(codiceFiscaleP) {
  return prisma.prenotazione.findMany({
    // Filtra le prenotazioni del passeggero specificato
    where: { codiceFiscaleP },
    include: {
      // Include i dati del viaggio e dell'autista per la visualizzazione
      viaggio: {
        include: {
          // Include nome, cognome e telefono dell'autista per i contatti
          autista: { select: { nome: true, cognome: true, telefono: true } },
        },
      },
    },
    // Le prenotazioni più recenti appaiono per prime
    orderBy: { data: "desc" },
  });
}

/**
 * Recupera tutte le prenotazioni ricevute per i viaggi di un autista.
 * Include i dati del passeggero e del viaggio per ogni prenotazione,
 * necessari per permettere all'autista di gestire le richieste.
 *
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista
 * @returns {Promise<Array>} Lista delle prenotazioni ordinate per data decrescente
 */
export async function getDriverBookings(codiceFiscaleA) {
  return prisma.prenotazione.findMany({
    // Filtra le prenotazioni dei viaggi dell'autista tramite relazione annidata
    where: { viaggio: { codiceFiscaleA } },
    include: {
      // Include nome, cognome, telefono e codice fiscale del passeggero (CF serve per il profilo)
      passeggero: { select: { nome: true, cognome: true, telefono: true, codiceFiscale: true } },
      // Include i dati del viaggio necessari per l'identificazione (ID incluso per link al dettaglio)
      viaggio: { select: { idViaggio: true, cittaP: true, cittaD: true, dataOra: true, codiceFiscaleA: true } },
    },
    // Le prenotazioni più recenti appaiono per prime
    orderBy: { data: "desc" },
  });
}
