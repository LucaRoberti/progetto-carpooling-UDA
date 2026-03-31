import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookings, users } from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * Componente MyBookings - Pagina delle prenotazioni dell'utente autenticato.
 *
 * Il comportamento cambia in base al ruolo dell'utente:
 *   - Passeggero: vede le proprie richieste di prenotazione con stato e dettagli viaggio.
 *     Può cliccare sul nome dell'autista per aprire una modale con il suo profilo pubblico.
 *   - Autista: vede le richieste ricevute sui propri viaggi con nome del passeggero.
 *     Può accettare o rifiutare le richieste in stato "pending".
 *     Può cliccare sul nome del passeggero per aprire la modale del suo profilo.
 *
 * Accessibile solo agli utenti loggati (protezione in App.jsx tramite ProtectedRoute).
 */
export default function MyBookings() {
  // Ruolo dell'utente autenticato ("autista" o "passeggero")
  const { role } = useAuth();

  // Lista delle prenotazioni dell'utente (ricevute o effettuate, a seconda del ruolo)
  const [myBookings, setMyBookings] = useState([]);
  // Stato di caricamento durante il recupero delle prenotazioni
  const [loading, setLoading] = useState(true);

  // Codice fiscale dell'utente di cui mostrare la modale profilo (null = modale chiusa)
  const [profileModal, setProfileModal] = useState(null);
  // Dati del profilo caricati per la modale
  const [profileData, setProfileData] = useState(null);
  // Stato di caricamento del profilo nella modale
  const [profileLoading, setProfileLoading] = useState(false);

  // Carica le prenotazioni dell'utente all'avvio del componente
  useEffect(() => {
    bookings.getMine().then(setMyBookings).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Ogni volta che cambia il CF nella modale, carica il profilo pubblico corrispondente
  useEffect(() => {
    // Se la modale viene chiusa, resetta i dati del profilo
    if (!profileModal) { setProfileData(null); return; }
    setProfileLoading(true);
    users.getPublic(profileModal)
      .then(setProfileData)
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [profileModal]);

  /**
   * Aggiorna lo stato di una prenotazione (accepted / rejected).
   * Usato dall'autista per accettare o rifiutare le richieste in stato "pending".
   * Aggiorna lo stato locale senza ricaricare tutte le prenotazioni.
   *
   * @param {number} id - ID della prenotazione da aggiornare
   * @param {string} stato - Nuovo stato ("accepted" o "rejected")
   */
  const handleStatus = async (id, stato) => {
    try {
      await bookings.updateStatus(id, stato);
      // Aggiorna solo la prenotazione modificata nella lista locale
      setMyBookings(myBookings.map((b) =>
        b.idPrenotazione === id ? { ...b, stato } : b
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Formatta una data in formato italiano compatto (giorno, mese abbreviato, anno).
   * Es: "10 mar 2025"
   *
   * @param {string|Date} d - Data da formattare
   * @returns {string} Data formattata
   */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", {
      day: "numeric", month: "short", year: "numeric",
    });

  // Mappa degli stati delle prenotazioni alle etichette italiane
  const statusLabel = { pending: "In attesa", accepted: "Accettato", rejected: "Rifiutato" };

  // Mostra il loader mentre i dati vengono caricati dal backend
  if (loading) return <div className="page-loader">Caricamento...</div>;

  return (
    <div className="page">
      {/* Intestazione della pagina con titolo e sottotitolo contestuale al ruolo */}
      <div className="page-header">
        <div>
          <h1>Prenotazioni</h1>
          <p>{role === "autista" ? "Gestisci le richieste di prenotazione" : "Le tue prenotazioni"}</p>
        </div>
      </div>

      {/* Stato vuoto: mostrato quando non ci sono prenotazioni */}
      {myBookings.length === 0 ? (
        <div className="empty-state">
          <h3>Nessuna prenotazione</h3>
          {/* Il passeggero viene invitato a cercare un viaggio */}
          {role === "passeggero" && (
            <>
              <p>Cerca un viaggio e prenota il tuo posto</p>
              <Link to="/search" className="btn btn-primary">Cerca Viaggi</Link>
            </>
          )}
        </div>
      ) : (
        // Griglia di card, una per ogni prenotazione
        <div className="bookings-grid">
          {myBookings.map((b) => {
            // Dati del viaggio associato alla prenotazione
            const trip = b.viaggio;
            const tripDate = trip?.dataOra;

            return (
              <div className="booking-card" key={b.idPrenotazione}>
                {/* Header della card: percorso e badge dello stato */}
                <div className="booking-card-header">
                  <div className="booking-route">
                    {trip?.cittaP || trip?.viaggio?.cittaP} → {trip?.cittaD || trip?.viaggio?.cittaD}
                  </div>
                  <span className={`status status-${b.stato}`}>
                    {statusLabel[b.stato]}
                  </span>
                </div>

                {/* Corpo della card: dettagli del viaggio e dell'utente coinvolto */}
                <div className="booking-card-body">
                  {/* Data del viaggio (fallback sulla data di prenotazione se non disponibile) */}
                  <div className="booking-detail">
                    <span className="label">Data viaggio</span>
                    <span>{tripDate ? formatDate(tripDate) : formatDate(b.data)}</span>
                  </div>

                  {/* Se è un passeggero: mostra il nome dell'autista come pulsante cliccabile */}
                  {role === "passeggero" && trip?.autista && (
                    <div className="booking-detail">
                      <span className="label">Autista</span>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, textDecoration: "underline", fontSize: "inherit" }}
                        onClick={() => setProfileModal(trip.codiceFiscaleA)}
                      >
                        {trip.autista.nome} {trip.autista.cognome}
                      </button>
                    </div>
                  )}

                  {/* Se è un autista: mostra il nome del passeggero come pulsante cliccabile */}
                  {role === "autista" && b.passeggero && (
                    <div className="booking-detail">
                      <span className="label">Passeggero</span>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, textDecoration: "underline", fontSize: "inherit" }}
                        onClick={() => setProfileModal(b.passeggero.codiceFiscale)}
                      >
                        {b.passeggero.nome} {b.passeggero.cognome}
                      </button>
                    </div>
                  )}

                  {/* Prezzo del viaggio (visibile se disponibile) */}
                  {trip?.costo && (
                    <div className="booking-detail">
                      <span className="label">Prezzo</span>
                      <span className="price-sm">€{trip.costo}</span>
                    </div>
                  )}

                  {/* Messaggio opzionale lasciato dal passeggero al momento della prenotazione */}
                  {b.messaggio && (
                    <div className="booking-detail" style={{ flexDirection: "column", gap: "0.2rem" }}>
                      <span className="label">Messaggio</span>
                      <span style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.88rem" }}>"{b.messaggio}"</span>
                    </div>
                  )}
                </div>

                {/* Footer della card: azioni disponibili in base al ruolo e allo stato */}
                <div className="booking-card-footer">
                  {/* Autista: bottoni Accetta/Rifiuta per le prenotazioni in attesa */}
                  {role === "autista" && b.stato === "pending" && (
                    <>
                      <button onClick={() => handleStatus(b.idPrenotazione, "accepted")} className="btn btn-sm btn-success">
                        Accetta
                      </button>
                      <button onClick={() => handleStatus(b.idPrenotazione, "rejected")} className="btn btn-sm btn-danger">
                        Rifiuta
                      </button>
                    </>
                  )}
                  {/* Passeggero: link al dettaglio del viaggio se la prenotazione è accettata */}
                  {role === "passeggero" && b.stato === "accepted" && trip && (
                    <Link to={`/trips/${trip.idViaggio || b.idViaggio}`} className="btn btn-sm btn-primary">
                      Vedi Viaggio
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale profilo utente: si apre cliccando sul nome di autista o passeggero */}
      {profileModal && (
        <div className="modal-overlay" onClick={() => setProfileModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Intestazione della modale con titolo dinamico in base al ruolo */}
            <div className="modal-header">
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
                {profileData?.role === "autista" ? "Profilo Autista" : "Profilo Passeggero"}
              </span>
              <button className="modal-close" onClick={() => setProfileModal(null)}>×</button>
            </div>

            {/* Contenuto della modale: loader, dati o messaggio di errore */}
            {profileLoading ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>Caricamento...</div>
            ) : profileData ? (
              <>
                {/* Avatar: foto profilo se disponibile, altrimenti iniziali */}
                <div className="modal-avatar">
                  {profileData.fotoUrl
                    ? <img src={profileData.fotoUrl} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} alt="avatar" />
                    : `${profileData.nome?.[0]}${profileData.cognome?.[0]}`
                  }
                </div>

                {/* Nome, ruolo e descrizione dell'utente */}
                <div className="modal-name">{profileData.nome} {profileData.cognome}</div>
                <div className="modal-role">{profileData.role === "autista" ? "Autista" : "Passeggero"}</div>
                {profileData.descrizione && (
                  <div className="modal-description">"{profileData.descrizione}"</div>
                )}

                {/* Dettagli di contatto e valutazione media */}
                <div className="modal-details">
                  <div className="modal-detail">
                    <span className="label">Telefono</span>
                    <span>{profileData.telefono}</span>
                  </div>
                  {profileData.avgRating && (
                    <div className="modal-detail">
                      <span className="label">Valutazione media</span>
                      <span>{"★".repeat(Math.round(profileData.avgRating))} {profileData.avgRating}/5 ({profileData.reviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Link alla pagina del profilo completo con tutte le recensioni */}
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
              // Fallback se il profilo non viene trovato
              <div style={{ color: "var(--text-muted)" }}>Profilo non trovato</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
