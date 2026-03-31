// Importa il client Prisma per interagire con il database
import prisma from "../utils/prisma.js";

/**
 * Crea un nuovo feedback per un viaggio.
 * Verifica che il viaggio esista e che non sia già stato inserito
 * un feedback identico (stessa coppia utenti, stesso viaggio, stessa direzione).
 *
 * @param {Object} data - Dati del feedback da creare
 * @param {number} data.idViaggio - ID del viaggio a cui si riferisce il feedback
 * @param {string} data.codiceFiscaleP - Codice fiscale del passeggero
 * @param {string} data.codiceFiscaleA - Codice fiscale dell'autista
 * @param {boolean} data.direzione - true se il passeggero recensisce l'autista, false viceversa
 * @param {number} data.voto - Voto da 1 a 5
 * @param {string} data.giudizio - Testo della recensione
 * @returns {Promise<Object>} Il feedback creato
 * @throws {Object} Errore 404 se il viaggio non esiste, 409 se il feedback è già presente
 */
export async function createReview(data) {
  // Verifica che il viaggio a cui si vuole lasciare il feedback esista nel database
  const trip = await prisma.viaggio.findUnique({
    where: { idViaggio: data.idViaggio },
  });
  if (!trip) throw { status: 404, message: "Viaggio non trovato" };

  // Controlla se esiste già un feedback con la stessa direzione per questa coppia utenti/viaggio
  // Previene la creazione di duplicati grazie al vincolo di unicità sul database
  const existing = await prisma.feedback.findFirst({
    where: {
      codiceFiscaleP: data.codiceFiscaleP,
      codiceFiscaleA: data.codiceFiscaleA,
      idViaggio: data.idViaggio,
      direzione: data.direzione,
    },
  });
  if (existing) throw { status: 409, message: "Feedback già inserito" };

  // Crea il nuovo record di feedback nel database
  return prisma.feedback.create({
    data: {
      voto: data.voto,
      giudizio: data.giudizio,
      direzione: data.direzione,
      codiceFiscaleP: data.codiceFiscaleP,
      codiceFiscaleA: data.codiceFiscaleA,
      idViaggio: data.idViaggio,
    },
  });
}

/**
 * Recupera tutti i feedback ricevuti da un autista.
 * Restituisce solo i feedback con direzione=true (scritti dai passeggeri verso l'autista),
 * includendo i dati del passeggero autore e del viaggio associato.
 *
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista
 * @returns {Promise<Array>} Lista dei feedback ricevuti, ordinati per viaggio decrescente
 */
export async function getReviewsForDriver(codiceFiscaleA) {
  return prisma.feedback.findMany({
    // Filtra solo i feedback ricevuti dall'autista (direzione=true = scritti da passeggeri)
    where: { codiceFiscaleA, direzione: true },
    include: {
      // Include nome e cognome del passeggero che ha scritto il feedback
      passeggero: { select: { nome: true, cognome: true } },
      // Include le informazioni del viaggio per dare contesto al feedback
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true } },
    },
    // Ordine decrescente per mostrare prima i feedback più recenti
    orderBy: { idViaggio: "desc" },
  });
}

/**
 * Recupera tutti i feedback ricevuti da un passeggero.
 * Restituisce solo i feedback con direzione=false (scritti dagli autisti verso il passeggero),
 * includendo i dati dell'autista autore e del viaggio associato.
 *
 * @param {string} codiceFiscaleP - Codice fiscale del passeggero
 * @returns {Promise<Array>} Lista dei feedback ricevuti, ordinati per viaggio decrescente
 */
export async function getReviewsForPassenger(codiceFiscaleP) {
  return prisma.feedback.findMany({
    // Filtra solo i feedback ricevuti dal passeggero (direzione=false = scritti da autisti)
    where: { codiceFiscaleP, direzione: false },
    include: {
      // Include nome e cognome dell'autista che ha scritto il feedback
      autista: { select: { nome: true, cognome: true } },
      // Include le informazioni del viaggio per dare contesto al feedback
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true } },
    },
    // Ordine decrescente per mostrare prima i feedback più recenti
    orderBy: { idViaggio: "desc" },
  });
}

/**
 * Elimina un feedback esistente.
 * Verifica che il feedback esista e che solo l'autore originale possa eliminarlo.
 * La logica di autorizzazione dipende dalla direzione:
 *   - direzione=true: solo il passeggero (chi ha scritto) può eliminare
 *   - direzione=false: solo l'autista (chi ha scritto) può eliminare
 *
 * @param {number} id - ID del feedback da eliminare
 * @param {string} requesterId - Codice fiscale dell'utente che richiede l'eliminazione
 * @returns {Promise<Object>} Il feedback eliminato
 * @throws {Object} Errore 404 se non trovato, 403 se non autorizzato
 */
export async function deleteReview(id, requesterId) {
  // Recupera il feedback dal database per verificarne l'esistenza e i dati
  const review = await prisma.feedback.findUnique({ where: { id } });
  if (!review) throw { status: 404, message: "Feedback non trovato" };

  // Solo l'autore (chi ha lasciato la recensione) può eliminarla
  // Se direzione=true, il feedback è stato scritto dal passeggero → solo lui può eliminarlo
  if (review.direzione === true && review.codiceFiscaleP !== requesterId) throw { status: 403, message: "Non autorizzato" };
  // Se direzione=false, il feedback è stato scritto dall'autista → solo lui può eliminarlo
  if (review.direzione === false && review.codiceFiscaleA !== requesterId) throw { status: 403, message: "Non autorizzato" };

  return prisma.feedback.delete({ where: { id } });
}

/**
 * Aggiorna voto e testo di un feedback esistente.
 * Verifica che il feedback esista e che solo l'autore originale possa modificarlo.
 * La logica di autorizzazione è identica a quella di deleteReview.
 *
 * @param {number} id - ID del feedback da aggiornare
 * @param {string} requesterId - Codice fiscale dell'utente che richiede la modifica
 * @param {Object} data - Nuovi dati del feedback
 * @param {number} data.voto - Nuovo voto (1-5)
 * @param {string} data.giudizio - Nuovo testo della recensione
 * @returns {Promise<Object>} Il feedback aggiornato
 * @throws {Object} Errore 404 se non trovato, 403 se non autorizzato
 */
export async function updateReview(id, requesterId, data) {
  // Recupera il feedback dal database per verificarne l'esistenza e i dati
  const review = await prisma.feedback.findUnique({ where: { id } });
  if (!review) throw { status: 404, message: "Feedback non trovato" };

  // Solo l'autore (chi ha lasciato la recensione) può modificarla
  // Se direzione=true, l'autore è il passeggero
  if (review.direzione === true && review.codiceFiscaleP !== requesterId) throw { status: 403, message: "Non autorizzato" };
  // Se direzione=false, l'autore è l'autista
  if (review.direzione === false && review.codiceFiscaleA !== requesterId) throw { status: 403, message: "Non autorizzato" };

  // Aggiorna solo i campi voto e giudizio (non è possibile cambiare la direzione o il viaggio)
  return prisma.feedback.update({ where: { id }, data: { voto: data.voto, giudizio: data.giudizio } });
}

/**
 * Recupera tutti i feedback scritti da un autista verso i passeggeri.
 * Restituisce i feedback con direzione=false (scritti dall'autista),
 * includendo i dati del passeggero destinatario e del viaggio.
 *
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista
 * @returns {Promise<Array>} Lista dei feedback scritti dall'autista
 */
export async function getReviewsWrittenByDriver(codiceFiscaleA) {
  return prisma.feedback.findMany({
    // Filtra i feedback scritti dall'autista verso i passeggeri (direzione=false)
    where: { codiceFiscaleA, direzione: false },
    include: {
      // Include i dati del passeggero destinatario del feedback
      passeggero: { select: { nome: true, cognome: true } },
      // Include le informazioni del viaggio per il contesto
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true } },
    },
    orderBy: { idViaggio: "desc" },
  });
}

/**
 * Recupera tutti i feedback scritti da un passeggero verso gli autisti.
 * Restituisce i feedback con direzione=true (scritti dal passeggero),
 * includendo i dati dell'autista destinatario e del viaggio.
 *
 * @param {string} codiceFiscaleP - Codice fiscale del passeggero
 * @returns {Promise<Array>} Lista dei feedback scritti dal passeggero
 */
export async function getReviewsWrittenByPassenger(codiceFiscaleP) {
  return prisma.feedback.findMany({
    // Filtra i feedback scritti dal passeggero verso gli autisti (direzione=true)
    where: { codiceFiscaleP, direzione: true },
    include: {
      // Include i dati dell'autista destinatario del feedback
      autista: { select: { nome: true, cognome: true } },
      // Include le informazioni del viaggio per il contesto
      viaggio: { select: { cittaP: true, cittaD: true, dataOra: true } },
    },
    orderBy: { idViaggio: "desc" },
  });
}
