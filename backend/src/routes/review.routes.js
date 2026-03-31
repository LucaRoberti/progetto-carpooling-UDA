// Importa il Router di Express per definire le route modulari
import { Router } from "express";
// Importa tutti i controller per la gestione dei feedback
import * as reviewCtrl from "../controllers/review.controller.js";
// Importa il middleware di autenticazione JWT per proteggere le route
import { authenticate } from "../middlewares/auth.middleware.js";

// Crea una nuova istanza del router Express per le route dei feedback
const router = Router();

// POST /reviews
// Crea un nuovo feedback per un viaggio completato.
// Richiede autenticazione: l'utente deve essere loggato (autista o passeggero).
// La direzione del feedback viene determinata automaticamente dal controller in base al ruolo.
router.post("/", authenticate, reviewCtrl.create);

// GET /reviews/mine
// Recupera tutti i feedback ricevuti dall'utente autenticato.
// Se autista: restituisce i feedback dei passeggeri verso di lui.
// Se passeggero: restituisce i feedback degli autisti verso di lui.
router.get("/mine", authenticate, reviewCtrl.getReviews);

// GET /reviews/written
// Recupera tutti i feedback scritti dall'utente autenticato.
// Se autista: restituisce i feedback da lui scritti verso i passeggeri.
// Se passeggero: restituisce i feedback da lui scritti verso gli autisti.
router.get("/written", authenticate, reviewCtrl.getWrittenReviews);

// DELETE /reviews/:id
// Elimina un feedback specifico tramite il suo ID.
// Richiede autenticazione: solo l'autore del feedback può eliminarlo.
// Il service verifica che il richiedente sia l'autore originale.
router.delete("/:id", authenticate, reviewCtrl.deleteReview);

// PUT /reviews/:id
// Aggiorna voto e testo di un feedback esistente tramite il suo ID.
// Richiede autenticazione: solo l'autore del feedback può modificarlo.
// Il service verifica che il richiedente sia l'autore originale.
router.put("/:id", authenticate, reviewCtrl.updateReview);

// Esporta il router per essere registrato nell'applicazione principale
export default router;
