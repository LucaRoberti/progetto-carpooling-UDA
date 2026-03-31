import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { users } from "../services/api";

/**
 * Componente PublicProfile - Pagina del profilo pubblico di un utente.
 *
 * Mostra le informazioni pubbliche di un utente (autista o passeggero)
 * identificato tramite il codice fiscale nell'URL.
 * Include tutti i feedback ricevuti con testo e nome del mittente.
 *
 * Accessibile solo agli utenti loggati (protezione in App.jsx tramite ProtectedRoute).
 * Route: /users/:cf
 */
export default function PublicProfile() {
  // Estrae il codice fiscale dall'URL (es. /users/RSSMRA80A01H501Z)
  const { cf } = useParams();

  // Dati del profilo caricati dal backend (null finché non vengono caricati)
  const [profile, setProfile] = useState(null);
  // Stato di caricamento durante il recupero dei dati
  const [loading, setLoading] = useState(true);

  // Carica il profilo pubblico dell'utente all'avvio del componente
  // o quando cambia il codice fiscale nell'URL
  useEffect(() => {
    users.getPublic(cf)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cf]);

  // Mostra un loader mentre i dati vengono recuperati dal backend
  if (loading) return <div className="page-loader">Caricamento...</div>;
  // Mostra un messaggio di errore se il profilo non è stato trovato
  if (!profile) return <div className="page"><div className="empty-state"><h3>Profilo non trovato</h3></div></div>;

  return (
    <div className="page">
      <div className="profile-layout">

        {/* Card principale con le informazioni del profilo */}
        <div className="profile-card">
          {/* Avatar: mostra la foto profilo se disponibile, altrimenti le iniziali */}
          <div className="profile-avatar">
            {profile.fotoUrl
              ? <img
                  src={profile.fotoUrl}
                  alt="profilo"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              : `${profile.nome?.[0] || ""}${profile.cognome?.[0] || ""}`
            }
          </div>

          {/* Nome completo e badge del ruolo */}
          <h2>{profile.nome} {profile.cognome}</h2>
          <span className={`role-badge role-${profile.role}`}>
            {profile.role === "autista" ? "Autista" : "Passeggero"}
          </span>

          {/* Descrizione/bio dell'utente (visibile solo se presente) */}
          {profile.descrizione && (
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
              "{profile.descrizione}"
            </p>
          )}

          {/* Dettagli di contatto pubblici */}
          <div className="profile-details">
            <div className="profile-row">
              <span className="label">Telefono</span>
              <span>{profile.telefono}</span>
            </div>
          </div>

          {/* Valutazione media: visibile solo se l'utente ha almeno una recensione */}
          {profile.avgRating && (
            <div className="profile-rating">
              {/* Stelle piene in base alla media arrotondata */}
              <span className="rating-stars">{"★".repeat(Math.round(profile.avgRating))}</span>
              <span className="rating-value">{profile.avgRating}/5</span>
              <span className="rating-count">({profile.reviewCount} recensioni)</span>
            </div>
          )}
        </div>

        {/* Sezione con tutti i feedback ricevuti dall'utente */}
        <div className="profile-reviews">
          <h3>Feedback Ricevuti</h3>
          {(!profile.reviews || profile.reviews.length === 0) ? (
            // Stato vuoto: nessun feedback ancora ricevuto
            <div className="empty-state-sm">
              <p>Nessun feedback ancora</p>
            </div>
          ) : (
            // Lista dei feedback ricevuti con voto, testo e nome del mittente
            profile.reviews.map((r, i) => (
              <div className="review-card" key={i}>
                {/* Intestazione: chi ha scritto e a chi è rivolto */}
                <div className="review-identity">
                  <span className="review-from">{r.mittente}</span>
                  <span className="review-arrow">→</span>
                  <span className="review-to">{profile.nome} {profile.cognome}</span>
                </div>
                {/* Stelle piene e vuote basate sul voto */}
                <div className="review-header">
                  <span className="review-stars">{"★".repeat(r.voto)}{"☆".repeat(5 - r.voto)}</span>
                </div>
                {/* Testo della recensione */}
                <p>{r.giudizio}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
