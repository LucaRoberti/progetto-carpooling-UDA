// Importa il client Prisma per interagire con il database
import prisma from "../utils/prisma.js";

/**
 * Crea un nuovo viaggio pubblicato da un autista.
 * Se viene specificata una targa, verifica che la macchina appartenga all'autista
 * per impedire l'uso di veicoli altrui.
 *
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista che pubblica il viaggio
 * @param {Object} data - Dati del viaggio da creare
 * @param {string} data.cittaP - Città di partenza
 * @param {string} data.cittaD - Città di destinazione
 * @param {string} data.dataOra - Data e ora di partenza (stringa ISO convertita in Date)
 * @param {number} data.costo - Costo per passeggero in euro
 * @param {number} data.tempo - Durata stimata in minuti
 * @param {boolean} [data.bagagli=false] - Se i bagagli sono ammessi
 * @param {boolean} [data.animali=false] - Se gli animali sono ammessi
 * @param {number} data.nPosti - Numero massimo di posti disponibili
 * @param {string[]} [data.tappe=[]] - Lista di tappe intermedie
 * @param {string} [data.targa] - Targa del veicolo (opzionale)
 * @returns {Promise<Object>} Il viaggio creato con i dati dell'autista inclusi
 * @throws {Object} Errore 400 se la targa non appartiene all'autista
 */
export async function createTrip(codiceFiscaleA, data) {
  // Se è stata specificata una targa, verifica che la macchina esista
  // e che appartenga effettivamente all'autista che sta creando il viaggio
  if (data.targa) {
    const car = await prisma.macchina.findFirst({ where: { targa: data.targa, codiceFiscaleA } });
    if (!car) throw { status: 400, message: "Macchina non trovata o non di tua proprietà" };
  }

  // Crea il viaggio nel database con tutti i dati forniti
  return prisma.viaggio.create({
    data: {
      cittaP: data.cittaP,
      cittaD: data.cittaD,
      // Converte la stringa della data in oggetto Date per Prisma
      dataOra: new Date(data.dataOra),
      costo: data.costo,
      tempo: data.tempo,
      // Usa false come valore di default se il campo non è specificato
      bagagli: data.bagagli ?? false,
      animali: data.animali ?? false,
      nPosti: data.nPosti,
      codiceFiscaleA,
      // I nuovi viaggi sono sempre aperti alla prenotazione
      chiuso: false,
      // Array vuoto se non sono specificate tappe intermedie
      tappe: data.tappe ?? [],
      // null se non è specificata una targa
      targa: data.targa || null,
    },
    // Include i dati dell'autista nella risposta per la visualizzazione immediata
    include: { autista: { select: { nome: true, cognome: true, emailA: true, telefono: true } } },
  });
}

/**
 * Cerca viaggi disponibili applicando filtri opzionali su città di partenza,
 * città di destinazione e data. Restituisce solo i viaggi non chiusi.
 * Aggiunge il conteggio delle prenotazioni accettate per calcolare i posti rimasti.
 *
 * @param {Object} params - Parametri di ricerca
 * @param {string} [params.cittaP] - Filtro sulla città di partenza (ricerca parziale, case-insensitive)
 * @param {string} [params.cittaD] - Filtro sulla città di destinazione (ricerca parziale, case-insensitive)
 * @param {string} [params.data] - Filtro sulla data (restituisce i viaggi del giorno specificato)
 * @returns {Promise<Array>} Lista dei viaggi trovati, ordinati per data crescente
 */
export async function searchTrips({ cittaP, cittaD, data }) {
  // Il filtro base esclude sempre i viaggi chiusi dalla ricerca
  const where = { chiuso: false };

  // Aggiunge il filtro sulla città di partenza solo se specificato
  // "contains" con "insensitive" permette ricerca parziale senza distinzione maiuscole/minuscole
  if (cittaP) where.cittaP = { contains: cittaP, mode: "insensitive" };
  // Aggiunge il filtro sulla città di destinazione solo se specificato
  if (cittaD) where.cittaD = { contains: cittaD, mode: "insensitive" };

  // Filtra per data: crea un intervallo da inizio a fine giornata per includere tutti gli orari
  if (data) {
    const start = new Date(data);
    const end = new Date(data);
    // Aggiunge un giorno alla fine dell'intervallo per includere l'intera giornata
    end.setDate(end.getDate() + 1);
    where.dataOra = { gte: start, lt: end };
  }

  return prisma.viaggio.findMany({
    where,
    include: {
      // Include nome, cognome e telefono dell'autista per la visualizzazione nella lista
      autista: { select: { nome: true, cognome: true, telefono: true } },
      // Conta le prenotazioni accettate per calcolare i posti disponibili rimasti
      _count: { select: { prenotazioni: { where: { stato: "accepted" } } } },
    },
    // Ordina per data crescente: i viaggi più imminenti appaiono per primi
    orderBy: { dataOra: "asc" },
  });
}

/**
 * Recupera i dettagli completi di un singolo viaggio tramite il suo ID.
 * Include tutti i dati correlati: autista, macchina, prenotazioni e feedback.
 *
 * @param {number} id - ID del viaggio da recuperare
 * @returns {Promise<Object>} Il viaggio con tutti i dati associati
 * @throws {Object} Errore 404 se il viaggio non esiste
 */
export async function getTripById(id) {
  const trip = await prisma.viaggio.findUnique({
    where: { idViaggio: id },
    include: {
      // Dati completi dell'autista incluse email e telefono per i contatti
      autista: { select: { nome: true, cognome: true, telefono: true, emailA: true } },
      // Dati del veicolo usato per il viaggio (se specificato)
      macchina: { select: { marca: true, modello: true, targa: true } },
      // Tutte le prenotazioni con nome e cognome di ogni passeggero
      prenotazioni: {
        include: { passeggero: { select: { nome: true, cognome: true } } },
      },
      // Tutti i feedback del viaggio con i dati degli autori
      feedback: {
        include: {
          passeggero: { select: { nome: true, cognome: true } },
          autista: { select: { nome: true, cognome: true } },
        },
      },
    },
  });
  if (!trip) throw { status: 404, message: "Viaggio non trovato" };
  return trip;
}

/**
 * Recupera tutti i viaggi pubblicati da un autista specifico.
 * Include il conteggio delle prenotazioni accettate per monitorare l'occupazione.
 *
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista
 * @returns {Promise<Array>} Lista dei viaggi dell'autista, ordinati per data decrescente
 */
export async function getDriverTrips(codiceFiscaleA) {
  return prisma.viaggio.findMany({
    // Filtra i viaggi dell'autista specificato
    where: { codiceFiscaleA },
    include: {
      // Conta le prenotazioni accettate per visualizzare i posti occupati
      _count: { select: { prenotazioni: { where: { stato: "accepted" } } } },
    },
    // I viaggi più recenti appaiono per primi nella lista personale
    orderBy: { dataOra: "desc" },
  });
}

/**
 * Aggiorna i dati di un viaggio esistente.
 * Verifica prima che il viaggio esista e che l'autista richiedente ne sia il proprietario.
 * Solo i campi presenti nel body vengono aggiornati (aggiornamento parziale).
 *
 * @param {number} id - ID del viaggio da aggiornare
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista richiedente (per l'autorizzazione)
 * @param {Object} data - Campi da aggiornare (tutti opzionali)
 * @returns {Promise<Object>} Il viaggio aggiornato
 * @throws {Object} Errore 404 se non trovato, 403 se non autorizzato
 */
export async function updateTrip(id, codiceFiscaleA, data) {
  // Verifica che il viaggio esista prima di tentare l'aggiornamento
  const trip = await prisma.viaggio.findUnique({ where: { idViaggio: id } });
  if (!trip) throw { status: 404, message: "Viaggio non trovato" };
  // Verifica che l'utente richiedente sia l'autista proprietario del viaggio
  if (trip.codiceFiscaleA !== codiceFiscaleA) throw { status: 403, message: "Non autorizzato" };

  // Aggiorna solo i campi esplicitamente presenti nel body della richiesta
  // Lo spread condizionale (...(cond && { key: val })) evita di sovrascrivere
  // campi non inclusi nella richiesta con undefined
  return prisma.viaggio.update({
    where: { idViaggio: id },
    data: {
      ...(data.cittaP && { cittaP: data.cittaP }),
      ...(data.cittaD && { cittaD: data.cittaD }),
      // Converte la data in oggetto Date se presente
      ...(data.dataOra && { dataOra: new Date(data.dataOra) }),
      // Usa !== undefined per includere anche il valore 0 come valido
      ...(data.costo !== undefined && { costo: data.costo }),
      ...(data.tempo !== undefined && { tempo: data.tempo }),
      ...(data.bagagli !== undefined && { bagagli: data.bagagli }),
      ...(data.animali !== undefined && { animali: data.animali }),
      ...(data.nPosti !== undefined && { nPosti: data.nPosti }),
      // Permette di aprire o chiudere il viaggio tramite il campo chiuso
      ...(data.chiuso !== undefined && { chiuso: data.chiuso }),
      ...(data.tappe !== undefined && { tappe: data.tappe }),
      ...(data.targa !== undefined && { targa: data.targa }),
    },
  });
}

/**
 * Elimina un viaggio e tutti i dati correlati (feedback e prenotazioni).
 * Verifica che il viaggio esista e che l'autista richiedente ne sia il proprietario.
 * L'eliminazione avviene in cascata manuale: prima feedback, poi prenotazioni, poi il viaggio.
 *
 * @param {number} id - ID del viaggio da eliminare
 * @param {string} codiceFiscaleA - Codice fiscale dell'autista richiedente (per l'autorizzazione)
 * @returns {Promise<Object>} Il viaggio eliminato
 * @throws {Object} Errore 404 se non trovato, 403 se non autorizzato
 */
export async function deleteTrip(id, codiceFiscaleA) {
  // Verifica che il viaggio esista prima di tentare l'eliminazione
  const trip = await prisma.viaggio.findUnique({ where: { idViaggio: id } });
  if (!trip) throw { status: 404, message: "Viaggio non trovato" };
  // Verifica che l'utente richiedente sia l'autista proprietario del viaggio
  if (trip.codiceFiscaleA !== codiceFiscaleA) throw { status: 403, message: "Non autorizzato" };

  // Elimina prima i record correlati per rispettare i vincoli di integrità referenziale del database
  // 1. Elimina tutti i feedback associati al viaggio
  await prisma.feedback.deleteMany({ where: { idViaggio: id } });
  // 2. Elimina tutte le prenotazioni associate al viaggio
  await prisma.prenotazione.deleteMany({ where: { idViaggio: id } });
  // 3. Infine elimina il viaggio stesso
  return prisma.viaggio.delete({ where: { idViaggio: id } });
}
