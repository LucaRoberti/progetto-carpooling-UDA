// Importa tutte le funzioni del service per la gestione dei feedback
import * as reviewService from "../services/review.service.js";

/**
 * Controller per la creazione di un nuovo feedback.
 * Determina automaticamente la direzione del feedback in base al ruolo dell'utente:
 *   - Se l'utente è un passeggero: direzione=true (recensisce l'autista)
 *     e imposta il proprio codiceFiscale come codiceFiscaleP
 *   - Se l'utente è un autista: direzione=false (recensisce il passeggero)
 *     e imposta il proprio codiceFiscale come codiceFiscaleA
 * Il body della richiesta deve includere: voto, giudizio, idViaggio,
 * e codiceFiscaleA (se passeggero) o codiceFiscaleP (se autista).
 *
 * @param {Object} req - Request Express (req.user contiene id e role dall'autenticazione JWT)
 * @param {Object} res - Response Express
 * @param {Function} next - Middleware successivo per la gestione degli errori
 */
export async function create(req, res, next) {
  try {
    // Estrae il ruolo e l'ID (codice fiscale) dell'utente autenticato dal token JWT
    const { role, id } = req.user;
    // Copia i dati del body della richiesta per poterli modificare
    const data = { ...req.body };

    // Imposta automaticamente i campi in base al ruolo dell'utente:
    if (role === "passeggero") {
      // Il passeggero recensisce l'autista: direzione=true, il proprio CF è codiceFiscaleP
      data.codiceFiscaleP = id;
      data.direzione = true;
    } else {
      // L'autista recensisce il passeggero: direzione=false, il proprio CF è codiceFiscaleA
      data.codiceFiscaleA = id;
      data.direzione = false;
    }

    // Chiama il service per creare il feedback nel database
    const review = await reviewService.createReview(data);
    // Restituisce il feedback creato con status HTTP 201 (Created)
    res.status(201).json(review);
  } catch (err) {
    // Passa l'errore al middleware globale di gestione degli errori
    next(err);
  }
}

/**
 * Controller per recuperare i feedback ricevuti dall'utente autenticato.
 * Il comportamento dipende dal ruolo:
 *   - Autista: ottiene i feedback ricevuti dai passeggeri (direzione=true)
 *   - Passeggero: ottiene i feedback ricevuti dagli autisti (direzione=false)
 *
 * @param {Object} req - Request Express (req.user contiene id e role)
 * @param {Object} res - Response Express
 * @param {Function} next - Middleware per la gestione degli errori
 */
export async function getReviews(req, res, next) {
  try {
    // Estrae il ruolo e l'ID dell'utente autenticato
    const { role, id } = req.user;
    let reviews;

    // Chiama la funzione del service corretta in base al ruolo dell'utente
    if (role === "autista") {
      // Recupera i feedback ricevuti dall'autista (scritti dai passeggeri)
      reviews = await reviewService.getReviewsForDriver(id);
    } else {
      // Recupera i feedback ricevuti dal passeggero (scritti dagli autisti)
      reviews = await reviewService.getReviewsForPassenger(id);
    }
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller per eliminare un feedback esistente.
 * Delega al service la verifica dei permessi (solo l'autore può eliminare).
 * L'ID del feedback viene letto dai parametri dell'URL e convertito in numero intero.
 *
 * @param {Object} req - Request Express (req.params.id = ID del feedback, req.user = utente autenticato)
 * @param {Object} res - Response Express
 * @param {Function} next - Middleware per la gestione degli errori
 */
export async function deleteReview(req, res, next) {
  try {
    // Converte l'ID del parametro URL da stringa a numero intero e chiama il service
    await reviewService.deleteReview(Number(req.params.id), req.user.id);
    // Restituisce un oggetto di conferma dell'eliminazione
    res.json({ success: true });
  } catch (err) { next(err); }
}

/**
 * Controller per aggiornare un feedback esistente.
 * Delega al service la verifica dei permessi (solo l'autore può modificare).
 * Il body deve contenere i nuovi valori di voto e/o giudizio.
 *
 * @param {Object} req - Request Express (req.params.id = ID del feedback, req.body = nuovi dati)
 * @param {Object} res - Response Express
 * @param {Function} next - Middleware per la gestione degli errori
 */
export async function updateReview(req, res, next) {
  try {
    // Aggiorna il feedback con i nuovi dati, verificando l'autorizzazione tramite requesterId
    const updated = await reviewService.updateReview(Number(req.params.id), req.user.id, req.body);
    // Restituisce il feedback aggiornato
    res.json(updated);
  } catch (err) { next(err); }
}

/**
 * Controller per recuperare i feedback scritti dall'utente autenticato.
 * Il comportamento dipende dal ruolo:
 *   - Autista: ottiene i feedback da lui scritti verso i passeggeri (direzione=false)
 *   - Passeggero: ottiene i feedback da lui scritti verso gli autisti (direzione=true)
 *
 * @param {Object} req - Request Express (req.user contiene id e role)
 * @param {Object} res - Response Express
 * @param {Function} next - Middleware per la gestione degli errori
 */
export async function getWrittenReviews(req, res, next) {
  try {
    // Estrae il ruolo e l'ID dell'utente autenticato
    const { role, id } = req.user;
    let reviews;

    // Chiama la funzione del service corretta in base al ruolo dell'utente
    if (role === "autista") {
      // Recupera i feedback scritti dall'autista verso i passeggeri
      reviews = await reviewService.getReviewsWrittenByDriver(id);
    } else {
      // Recupera i feedback scritti dal passeggero verso gli autisti
      reviews = await reviewService.getReviewsWrittenByPassenger(id);
    }
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}
