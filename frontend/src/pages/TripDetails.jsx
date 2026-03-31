import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { trips, bookings, reviews as reviewsApi, users } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TripMap from "../components/TripMap";

/**
 * Componente TripDetails - Pagina di dettaglio di un singolo viaggio.
 *
 * Mostra tutte le informazioni del viaggio (percorso, tappe, data, costo, ecc.)
 * e gestisce le interazioni contestuali in base al ruolo dell'utente:
 *   - Passeggero: può prenotare un posto, vedere i compagni di viaggio, lasciare feedback
 *   - Autista (proprietario): può gestire le prenotazioni e lasciare feedback ai passeggeri
 *
 * Gestisce anche la visualizzazione di un modale con il profilo pubblico degli utenti.
 */
export default function TripDetails() {
  // Estrae l'ID del viaggio dall'URL (es. /trips/42)
  const { id } = useParams();
  // Recupera i dati dell'utente autenticato e il suo ruolo dal contesto di autenticazione
  const { user, role } = useAuth();

  // Stato del viaggio caricato dal backend
  const [trip, setTrip] = useState(null);
  // Stato di caricamento iniziale della pagina
  const [loading, setLoading] = useState(true);
  // Messaggio di feedback per l'operazione di prenotazione (successo o errore)
  const [bookingMsg, setBookingMsg] = useState("");
  // Testo del messaggio opzionale che il passeggero invia all'autista al momento della prenotazione
  const [bookingMessage, setBookingMessage] = useState("");
  // Stato del form per la creazione di un nuovo feedback (voto e testo)
  const [reviewForm, setReviewForm] = useState({ voto: 5, giudizio: "" });
  // Messaggio di feedback per l'operazione di invio recensione
  const [reviewMsg, setReviewMsg] = useState("");
  // Codice fiscale dell'utente di cui si vuole visualizzare il profilo nel modale (null = chiuso)
  const [profileModal, setProfileModal] = useState(null);
  // Dati del profilo caricati per il modale
  const [profileData, setProfileData] = useState(null);
  // Stato di caricamento del modale profilo
  const [profileLoading, setProfileLoading] = useState(false);

  // Carica i dati del viaggio all'avvio del componente o quando cambia l'ID nell'URL
  useEffect(() => {
    trips.getById(id).then(setTrip).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Effetto che reagisce all'apertura/chiusura del modale profilo
  // Quando profileModal viene impostato a un codice fiscale, carica il profilo pubblico
  useEffect(() => {
    // Se il modale viene chiuso, resetta i dati del profilo e interrompe il caricamento
    if (!profileModal) { setProfileData(null); return; }
    setProfileLoading(true);
    users.getPublic(profileModal)
      .then(setProfileData)
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [profileModal]);

  /**
   * Gestisce la prenotazione di un posto nel viaggio.
   * Invia la richiesta al backend e aggiorna i dati del viaggio in caso di successo.
   */
  const handleBook = async () => {
    try {
      // Crea la prenotazione con il messaggio opzionale (undefined se vuoto)
      await bookings.create(trip.idViaggio, bookingMessage || undefined);
      setBookingMsg("Prenotazione inviata!");
      // Ricarica il viaggio per aggiornare il conteggio dei posti e la lista prenotazioni
      const updated = await trips.getById(id);
      setTrip(updated);
    } catch (err) {
      // Mostra il messaggio di errore restituito dal backend
      setBookingMsg(err.message);
    }
  };

  /**
   * Gestisce l'invio di un feedback per il viaggio.
   * Verifica che l'autista abbia selezionato un passeggero prima dell'invio.
   * Costruisce il body della richiesta in base al ruolo dell'utente.
   *
   * @param {Event} e - Evento submit del form
   */
  const handleReview = async (e) => {
    e.preventDefault();
    // L'autista deve selezionare il passeggero da recensire prima di inviare
    if (role === "autista" && !reviewForm.codiceFiscaleP) {
      setReviewMsg("Seleziona prima un passeggero");
      return;
    }
    try {
      // Costruisce il body con i dati comuni del feedback
      const body = {
        voto: reviewForm.voto,
        giudizio: reviewForm.giudizio,
        idViaggio: trip.idViaggio,
      };
      // Aggiunge il destinatario del feedback in base al ruolo:
      if (role === "passeggero") {
        // Il passeggero recensisce l'autista del viaggio
        body.codiceFiscaleA = trip.codiceFiscaleA;
      } else {
        // L'autista recensisce il passeggero selezionato dal dropdown
        body.codiceFiscaleP = reviewForm.codiceFiscaleP;
      }
      await reviewsApi.create(body);
      setReviewMsg("Feedback inviato!");
      // Resetta il form al valore iniziale dopo l'invio
      setReviewForm({ voto: 5, giudizio: "" });
      // Ricarica il viaggio per mostrare il nuovo feedback nella lista
      const updated = await trips.getById(id);
      setTrip(updated);
    } catch (err) {
      setReviewMsg(err.message);
    }
  };

  // Mostra un loader durante il caricamento iniziale del viaggio
  if (loading) return <div className="page-loader">Caricamento...</div>;
  // Mostra un messaggio se il viaggio non è stato trovato
  if (!trip) return <div className="page"><div className="empty-state"><h3>Viaggio non trovato</h3></div></div>;

  /**
   * Formatta una data in formato italiano esteso con giorno della settimana.
   * Es: "lunedì 10 marzo 2025, 14:30"
   *
   * @param {string|Date} d - Data da formattare
   * @returns {string} Data formattata in italiano
   */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // Calcola il numero di prenotazioni accettate per determinare i posti occupati
  const acceptedBookings = trip.prenotazioni?.filter((b) => b.stato === "accepted").length || 0;
  // Calcola i posti ancora disponibili
  const seatsLeft = trip.nPosti - acceptedBookings;
  // Verifica se l'utente corrente ha già una prenotazione attiva (non rifiutata) per questo viaggio
  const alreadyBooked = trip.prenotazioni?.some(
    (b) => b.codiceFiscaleP === user?.codiceFiscale && b.stato !== "rejected"
  );
  // Verifica se l'utente corrente è il proprietario (autista) del viaggio
  const isOwner = user?.codiceFiscale === trip.codiceFiscaleA;
  // Verifica se il passeggero corrente ha una prenotazione accettata (necessario per il feedback)
  const hasAcceptedBooking = trip.prenotazioni?.some(
    (b) => b.codiceFiscaleP === user?.codiceFiscale && b.stato === "accepted"
  );
  // Verifica se il viaggio è già avvenuto (necessario per abilitare il feedback)
  const tripInPast = new Date(trip.dataOra) < new Date();
  // L'utente può lasciare feedback solo se: è loggato, il viaggio è passato,
  // e (se passeggero) ha avuto una prenotazione accettata, oppure (se autista) è il proprietario
  const canReview = user && tripInPast && (role === "passeggero" ? hasAcceptedBooking : isOwner);

  return (
    <div className="page">
      <div className="trip-detail">

        {/* Intestazione con il percorso del viaggio (partenza → destinazione) e prezzo */}
        <div className="detail-header">
          <div className="detail-route">
            <div className="detail-city">
              <span className="dot-lg start" />
              <div>
                <h2>{trip.cittaP.toUpperCase()}</h2>
                <span className="label">Partenza</span>
              </div>
            </div>
            <div className="route-arrow">→</div>
            <div className="detail-city">
              <span className="dot-lg end" />
              <div>
                <h2>{trip.cittaD.toUpperCase()}</h2>
                <span className="label">Destinazione</span>
              </div>
            </div>
          </div>
          <div className="detail-price">€{trip.costo}</div>
        </div>

        {/* Mappa interattiva del percorso, incluse eventuali tappe */}
        <TripMap from={trip.cittaP} to={trip.cittaD} tappe={trip.tappe ?? []} />

        {/* Sezione tappe intermedie: visibile solo se il viaggio ha tappe definite */}
        {trip.tappe && trip.tappe.length > 0 && (
          <div className="route-tappe">
            <span className="label" style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Tappe intermedie</span>
            <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {/* Renderizza ogni tappa come elemento di una lista ordinata */}
              {trip.tappe.map((tappa, i) => (
                <li key={i} style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{tappa}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Griglia informazioni principali del viaggio */}
        <div className="detail-info-grid">
          <div className="info-item">
            <span className="info-label">Data e Ora</span>
            <span className="info-value">{formatDate(trip.dataOra)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Durata</span>
            <span className="info-value">{trip.tempo} min</span>
          </div>
          <div className="info-item">
            <span className="info-label">Posti disponibili</span>
            {/* Applica una classe di avviso visivo se rimane solo 1 posto o meno */}
            <span className={`info-value ${seatsLeft <= 1 ? "text-warn" : ""}`}>
              {seatsLeft} / {trip.nPosti}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Autista</span>
            {/* Se l'utente è loggato e non è il proprietario, mostra il nome come link al profilo */}
            {user && !isOwner ? (
              <button
                type="button"
                className="info-value"
                style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontSize: "inherit" }}
                onClick={() => setProfileModal(trip.codiceFiscaleA)}
              >
                {trip.autista?.nome} {trip.autista?.cognome}
              </button>
            ) : (
              // Se è il proprietario o non è loggato, mostra solo il nome (non cliccabile)
              <span className="info-value">{trip.autista?.nome} {trip.autista?.cognome}</span>
            )}
          </div>
          {/* Informazioni sul veicolo: visibili solo se è stato specificato un veicolo */}
          {trip.macchina && (
            <div className="info-item">
              <span className="info-label">Veicolo</span>
              <span className="info-value">{trip.macchina.marca} {trip.macchina.modello} ({trip.macchina.targa})</span>
            </div>
          )}
        </div>

        {/* Tag per le caratteristiche del viaggio (bagagli, animali, stato chiuso) */}
        <div className="detail-tags">
          {trip.bagagli && <span className="tag">Bagagli ammessi</span>}
          {trip.animali && <span className="tag">Animali ammessi</span>}
          {trip.chiuso && <span className="tag tag-warn">Viaggio chiuso</span>}
        </div>

        {/* Sezione prenotazione: visibile solo ai passeggeri per viaggi aperti di cui non sono proprietari */}
        {user && role === "passeggero" && !isOwner && !trip.chiuso && (
          <div className="detail-actions">
            {alreadyBooked ? (
              // Se già prenotato mostra un messaggio informativo
              <div className="alert alert-info">Hai già prenotato questo viaggio</div>
            ) : seatsLeft > 0 ? (
              <>
                {/* Form per il messaggio opzionale e il bottone di prenotazione */}
                <div className="form-group" style={{ width: "100%" }}>
                  <label>Messaggio per l'autista (opzionale)</label>
                  <textarea
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="Presentati o aggiungi una nota..."
                    rows={2}
                    style={{ resize: "vertical" }}
                  />
                </div>
                <button onClick={handleBook} className="btn btn-primary btn-lg">
                  Prenota Posto
                </button>
              </>
            ) : (
              // Se non ci sono posti disponibili mostra un avviso
              <div className="alert alert-warn">Posti esauriti</div>
            )}
            {/* Messaggio di esito della prenotazione (successo o errore) */}
            {bookingMsg && <div className="alert alert-info">{bookingMsg}</div>}
          </div>
        )}

        {/* Lista compagni di viaggio: visibile al passeggero loggato (esclude se stesso) */}
        {user && role === "passeggero" && !isOwner && (() => {
          // Filtra le prenotazioni accettate degli altri passeggeri (non l'utente corrente)
          const coPassengers = trip.prenotazioni?.filter(
            (b) => b.stato === "accepted" && b.codiceFiscaleP !== user.codiceFiscale
          ) || [];
          // Non mostra la sezione se non ci sono compagni di viaggio
          if (coPassengers.length === 0) return null;
          return (
            <div className="detail-section">
              <h3>Compagni di Viaggio</h3>
              <div className="bookings-list">
                {/* Ogni compagno è un link cliccabile che apre il modale del profilo */}
                {coPassengers.map((b) => (
                  <div key={b.idPrenotazione} className="booking-item">
                    <button
                      type="button"
                      style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontWeight: 600, fontSize: "inherit", cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => setProfileModal(b.codiceFiscaleP)}
                    >
                      {b.passeggero?.nome} {b.passeggero?.cognome}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Lista prenotazioni ricevute: visibile solo all'autista proprietario del viaggio */}
        {isOwner && trip.prenotazioni?.length > 0 && (
          <div className="detail-section">
            <h3>Prenotazioni</h3>
            <div className="bookings-list">
              {/* Renderizza ogni prenotazione con il componente BookingItem */}
              {trip.prenotazioni.map((b) => (
                <BookingItem
                  key={b.idPrenotazione}
                  booking={b}
                  tripId={id}
                  onUpdate={async () => {
                    // Ricarica il viaggio dopo ogni aggiornamento di stato di una prenotazione
                    const updated = await trips.getById(id);
                    setTrip(updated);
                  }}
                  onViewProfile={(cf) => setProfileModal(cf)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sezione per lasciare un feedback: visibile solo se canReview è true */}
        {canReview && (
          <div className="detail-section">
            <h3>Lascia un Feedback</h3>
            {/* Se l'utente è autista, mostra un dropdown per selezionare il passeggero da recensire */}
            {role === "autista" && (
              <div className="form-group">
                <label>Passeggero (Codice Fiscale)</label>
                <select
                  value={reviewForm.codiceFiscaleP || ""}
                  onChange={(e) => setReviewForm({ ...reviewForm, codiceFiscaleP: e.target.value })}
                >
                  <option value="">Seleziona passeggero</option>
                  {/* Mostra solo i passeggeri con prenotazione accettata */}
                  {trip.prenotazioni?.filter(b => b.stato === "accepted").map((b) => (
                    <option key={b.codiceFiscaleP} value={b.codiceFiscaleP}>
                      {b.passeggero?.nome} {b.passeggero?.cognome}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <form onSubmit={handleReview} className="review-form">
              <div className="form-group">
                <label>Voto (1-5)</label>
                {/* Selezione del voto tramite stelle cliccabili */}
                <div className="star-input">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      type="button"
                      key={v}
                      // La stella è "attiva" (piena) se il suo valore è minore o uguale al voto selezionato
                      className={`star ${v <= reviewForm.voto ? "active" : ""}`}
                      onClick={() => setReviewForm({ ...reviewForm, voto: v })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Commento</label>
                <textarea
                  value={reviewForm.giudizio}
                  onChange={(e) => setReviewForm({ ...reviewForm, giudizio: e.target.value })}
                  placeholder="La tua esperienza..."
                  required
                  rows={3}
                />
              </div>
              <button type="submit" className="btn btn-primary">Invia Feedback</button>
              {/* Messaggio di esito dell'invio del feedback */}
              {reviewMsg && <div className="alert alert-info">{reviewMsg}</div>}
            </form>
          </div>
        )}

        {/* Lista dei feedback esistenti per questo viaggio */}
        {trip.feedback?.length > 0 && (
          <div className="detail-section">
            <h3>Feedback</h3>
            {trip.feedback.map((f, i) => (
              <div key={i} className="review-card">
                {/* Intestazione: chi ha scritto e a chi è rivolto */}
                <div className="review-identity">
                  {f.direzione ? (
                    <>
                      <span className="review-from">{f.passeggero?.nome} {f.passeggero?.cognome}</span>
                      <span className="review-arrow">→</span>
                      <span className="review-to">{trip.autista?.nome} {trip.autista?.cognome}</span>
                    </>
                  ) : (
                    <>
                      <span className="review-from">{trip.autista?.nome} {trip.autista?.cognome}</span>
                      <span className="review-arrow">→</span>
                      <span className="review-to">{f.passeggero?.nome} {f.passeggero?.cognome}</span>
                    </>
                  )}
                </div>
                {/* Stelle piene e vuote in base al voto */}
                <div className="review-header">
                  <span className="review-stars">{"★".repeat(f.voto)}{"☆".repeat(5 - f.voto)}</span>
                </div>
                <p>{f.giudizio}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale per la visualizzazione del profilo pubblico di un utente */}
      {/* Viene aperto cliccando sul nome di un autista o passeggero */}
      {profileModal && (
        <div className="modal-overlay" onClick={() => setProfileModal(null)}>
          {/* Stoppa la propagazione del click per evitare la chiusura accidentale del modale */}
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {profileData?.role === "autista" ? "Profilo Autista" : "Profilo Passeggero"}
              </span>
              <button className="modal-close" onClick={() => setProfileModal(null)}>×</button>
            </div>
            {profileLoading ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>Caricamento...</div>
            ) : profileData ? (
              <>
                {/* Avatar con iniziali del nome e cognome */}
                <div className="modal-avatar">
                  {profileData.nome?.[0]}{profileData.cognome?.[0]}
                </div>
                <div className="modal-name">{profileData.nome} {profileData.cognome}</div>
                <div className="modal-role">{profileData.role === "autista" ? "Autista" : "Passeggero"}</div>
                {/* Descrizione/bio opzionale dell'utente */}
                {profileData.descrizione && (
                  <div className="modal-description">"{profileData.descrizione}"</div>
                )}
                <div className="modal-details">
                  <div className="modal-detail">
                    <span className="label">Telefono</span>
                    <span>{profileData.telefono}</span>
                  </div>
                  {/* Valutazione media: visibile solo se l'utente ha almeno una recensione */}
                  {profileData.avgRating && (
                    <div className="modal-detail">
                      <span className="label">Valutazione media</span>
                      <span>{"★".repeat(Math.round(profileData.avgRating))} {profileData.avgRating}/5 ({profileData.reviewCount})</span>
                    </div>
                  )}
                </div>
                {/* Link al profilo completo che chiude il modale al click */}
                <Link
                  to={`/users/${profileModal}`}
                  className="btn btn-outline btn-sm"
                  style={{ display: "block", textAlign: "center", marginTop: "1rem" }}
                  onClick={() => setProfileModal(null)}
                >
                  Vedi profilo completo →
                </Link>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>Profilo non trovato</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente BookingItem - Elemento della lista prenotazioni per l'autista.
 * Mostra i dettagli di una singola prenotazione (nome passeggero, stato, messaggio)
 * e i bottoni per accettare o rifiutare se la prenotazione è in attesa.
 *
 * @param {Object} props
 * @param {Object} props.booking - Dati della prenotazione
 * @param {string} props.tripId - ID del viaggio (non usato direttamente ma disponibile)
 * @param {Function} props.onUpdate - Callback chiamata dopo ogni aggiornamento di stato
 * @param {Function} props.onViewProfile - Callback per aprire il modale del profilo passeggero
 */
function BookingItem({ booking, tripId, onUpdate, onViewProfile }) {
  // Stato di caricamento durante l'aggiornamento dello stato della prenotazione
  const [loading, setLoading] = useState(false);

  /**
   * Gestisce il cambio di stato di una prenotazione (accettazione o rifiuto).
   * Disabilita i bottoni durante l'elaborazione per prevenire click multipli.
   *
   * @param {string} stato - Nuovo stato ("accepted" o "rejected")
   */
  const handleStatus = async (stato) => {
    setLoading(true);
    try {
      // Chiama l'API per aggiornare lo stato della prenotazione
      await bookings.updateStatus(booking.idPrenotazione, stato);
      // Notifica il componente padre per ricaricare i dati aggiornati
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      // Riabilita i bottoni indipendentemente dall'esito
      setLoading(false);
    }
  };

  return (
    <div className="booking-item" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="booking-info">
          {/* Nome del passeggero come bottone che apre il modale del profilo */}
          <button
            type="button"
            style={{ background: "none", border: "none", padding: 0, color: "var(--accent)", fontWeight: 600, fontSize: "inherit", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => onViewProfile && onViewProfile(booking.codiceFiscaleP)}
          >
            {booking.passeggero?.nome} {booking.passeggero?.cognome}
          </button>
          {/* Badge colorato con lo stato della prenotazione */}
          <span className={`status status-${booking.stato}`}>
            {booking.stato === "pending" ? "In attesa" : booking.stato === "accepted" ? "Accettato" : "Rifiutato"}
          </span>
        </div>
        {/* Bottoni accetta/rifiuta: visibili solo per le prenotazioni in stato "pending" */}
        {booking.stato === "pending" && (
          <div className="booking-actions">
            <button onClick={() => handleStatus("accepted")} className="btn btn-sm btn-success" disabled={loading}>
              Accetta
            </button>
            <button onClick={() => handleStatus("rejected")} className="btn btn-sm btn-danger" disabled={loading}>
              Rifiuta
            </button>
          </div>
        )}
      </div>
      {/* Messaggio opzionale del passeggero: visibile solo se presente */}
      {booking.messaggio && (
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", paddingLeft: "0.25rem" }}>
          "{booking.messaggio}"
        </div>
      )}
    </div>
  );
}
