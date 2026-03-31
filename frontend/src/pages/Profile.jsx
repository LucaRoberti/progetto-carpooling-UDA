import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reviews as reviewsApi, users } from "../services/api";

/**
 * Componente Profile - Pagina del profilo privato dell'utente autenticato.
 *
 * Mostra e permette la modifica dei propri dati personali.
 * Visualizza due sezioni distinte di feedback:
 *   - "Feedback Ricevuti": recensioni lasciate da altri utenti verso di sé (sola lettura)
 *   - "Feedback Lasciati": recensioni scritte dall'utente verso altri (modificabili/eliminabili)
 *
 * Accessibile a tutti gli utenti loggati (protezione in App.jsx tramite ProtectedRoute).
 * Route: /profile
 */
export default function Profile() {
  // Dati dell'utente loggato, ruolo, funzione per aggiornare il contesto e logout
  const { user, role, updateUser, logout } = useAuth();
  // Hook per la navigazione programmatica (usato dopo il logout)
  const navigate = useNavigate();

  // Feedback ricevuti dall'utente (scritti da altri verso di lui)
  const [myReviews, setMyReviews] = useState([]);
  // Feedback lasciati dall'utente (scritti da lui verso altri)
  const [writtenReviews, setWrittenReviews] = useState([]);
  // Controlla se il form di modifica profilo è visibile
  const [editing, setEditing] = useState(false);
  // Valori del form di modifica profilo
  const [editForm, setEditForm] = useState({ descrizione: "", telefono: "", email: "" });
  // Messaggio di errore durante il salvataggio del profilo
  const [editError, setEditError] = useState("");
  // Stato di caricamento durante il salvataggio del profilo
  const [editLoading, setEditLoading] = useState(false);
  // Feedback in fase di modifica: contiene { id, voto, giudizio } o null
  const [editingReview, setEditingReview] = useState(null);
  // File immagine selezionato dall'utente per il profilo
  const [photoFile, setPhotoFile] = useState(null);
  // URL di anteprima locale per il file selezionato
  const [photoPreview, setPhotoPreview] = useState(null);
  // Flag: l'utente vuole rimuovere la foto profilo attuale
  const [pendingRemove, setPendingRemove] = useState(false);
  // Ref per l'input file nascosto
  const fileInputRef = useRef(null);

  // Carica i feedback ricevuti e quelli lasciati dall'utente all'avvio del componente
  useEffect(() => {
    reviewsApi.getMine().then(setMyReviews).catch(console.error);
    reviewsApi.getWritten().then(setWrittenReviews).catch(console.error);
  }, []);

  // Popola il form di modifica con i dati attuali dell'utente quando questi vengono caricati
  useEffect(() => {
    if (user) {
      setEditForm({
        descrizione: user.descrizione || "",
        telefono: user.telefono || "",
        // Usa emailA per gli autisti, emailP per i passeggeri
        email: user.emailA || user.emailP || "",
      });
    }
  }, [user]);

  // Rilascia l'URL di anteprima quando viene sostituito o il componente viene smontato
  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  // Se l'utente non è ancora caricato, non renderizza nulla
  if (!user) return null;

  // Calcola la valutazione media dai feedback ricevuti (con una cifra decimale)
  // Restituisce null se non ci sono feedback (evita la visualizzazione di "NaN")
  const avgRating = myReviews.length
    ? (myReviews.reduce((s, r) => s + r.voto, 0) / myReviews.length).toFixed(1)
    : null;

  /**
   * Gestisce il salvataggio delle modifiche al profilo.
   * Se è stata selezionata una nuova foto, la converte in base64 prima dell'invio.
   * Aggiorna il contesto globale dell'utente dopo il salvataggio.
   *
   * @param {Event} e - Evento submit del form
   */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      // Gestisce la foto profilo: carica il nuovo file o rimuove quello esistente
      let photoResult = null;
      if (pendingRemove) {
        photoResult = await users.removeAvatar();
      } else if (photoFile) {
        photoResult = await users.uploadAvatar(photoFile);
      }

      // Invia i dati testuali aggiornati al backend
      const updated = await users.updateMe({
        descrizione: editForm.descrizione,
        telefono: editForm.telefono,
        email: editForm.email,
      });

      // Aggiorna il contesto globale con i nuovi dati dell'utente
      updateUser({
        descrizione: updated.descrizione,
        telefono: updated.telefono,
        emailA: updated.emailA,
        emailP: updated.emailP,
        fotoUrl: photoResult ? photoResult.fotoUrl : updated.fotoUrl,
      });

      // Chiude il form e azzera gli stati della foto
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPendingRemove(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="profile-layout">

        {/* Card principale con avatar, dati personali e form di modifica */}
        <div className="profile-card">
          {/* Avatar: mostra l'anteprima se c'è un file selezionato, la foto salvata, o le iniziali */}
          <div className="profile-avatar">
            {(() => {
              const src = editing
                ? (photoPreview || (!pendingRemove ? user.fotoUrl : null))
                : user.fotoUrl;
              return src
                ? <img src={src} alt="profilo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : `${user.nome?.[0] || ""}${user.cognome?.[0] || ""}`;
            })()}
          </div>

          {/* Bottoni per la foto: visibili solo in modalità modifica */}
          {editing && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.5rem" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                    setPendingRemove(false);
                  }
                  e.target.value = "";
                }}
              />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
                {(photoFile || (!pendingRemove && user.fotoUrl)) ? "Cambia foto" : "Aggiungi foto"}
              </button>
              {(photoFile || (!pendingRemove && user.fotoUrl)) && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    if (user.fotoUrl) setPendingRemove(true);
                  }}
                >
                  Rimuovi foto
                </button>
              )}
              {pendingRemove && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingRemove(false)}>
                  Annulla rimozione
                </button>
              )}
            </div>
          )}

          {/* Nome completo e badge colorato con il ruolo */}
          <h2>{user.nome} {user.cognome}</h2>
          <span className={`role-badge role-${role}`}>
            {role === "autista" ? "Autista" : "Passeggero"}
          </span>

          {/* Descrizione/bio: visibile solo se presente e se non si sta modificando */}
          {user.descrizione && !editing && (
            <p style={{ marginTop: "0.75rem", color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
              "{user.descrizione}"
            </p>
          )}

          {/* Bottone per aprire/chiudere il form di modifica profilo */}
          <div style={{ marginTop: "0.75rem" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditing(!editing);
                setEditError("");
                setPhotoFile(null);
                setPhotoPreview(null);
                setPendingRemove(false);
              }}
            >
              {editing ? "Annulla" : "Modifica profilo"}
            </button>
          </div>

          {/* Form di modifica profilo: visibile solo quando editing=true */}
          {editing && (
            <form onSubmit={handleEditSubmit} className="profile-edit-form">
              {/* Messaggio di errore durante il salvataggio */}
              {editError && <div className="alert alert-error">{editError}</div>}

              <div className="form-group">
                <label>Telefono</label>
                <input
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  placeholder="3331234567"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="nome@email.it"
                />
              </div>

              <div className="form-group">
                <label>Descrizione</label>
                <textarea
                  value={editForm.descrizione}
                  onChange={(e) => setEditForm({ ...editForm, descrizione: e.target.value })}
                  placeholder="Presentati alla community..."
                  rows={3}
                  maxLength={300}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                {editLoading ? "Salvataggio..." : "Salva"}
              </button>
            </form>
          )}

          {/* Dati personali dell'utente (sempre visibili) */}
          <div className="profile-details">
            <div className="profile-row">
              <span className="label">Codice Fiscale</span>
              <span>{user.codiceFiscale}</span>
            </div>
            <div className="profile-row">
              <span className="label">Email</span>
              {/* Usa il campo corretto in base al ruolo (emailA per autisti, emailP per passeggeri) */}
              <span>{user.emailA || user.emailP}</span>
            </div>
            <div className="profile-row">
              <span className="label">Telefono</span>
              <span>{user.telefono}</span>
            </div>
            {/* Campi aggiuntivi visibili solo per gli autisti */}
            {role === "autista" && (
              <>
                <div className="profile-row">
                  <span className="label">N° Patente</span>
                  <span>{user.numPatente}</span>
                </div>
                <div className="profile-row">
                  <span className="label">Scadenza Patente</span>
                  <span>{new Date(user.scadenzaPatente).toLocaleDateString("it-IT")}</span>
                </div>
              </>
            )}
          </div>

          {/* Riepilogo della valutazione media: visibile solo se c'è almeno un feedback */}
          {avgRating && (
            <div className="profile-rating">
              {/* Stelle piene in base alla media arrotondata */}
              <span className="rating-stars">{"★".repeat(Math.round(avgRating))}</span>
              <span className="rating-value">{avgRating}/5</span>
              <span className="rating-count">({myReviews.length} recensioni)</span>
            </div>
          )}
        </div>

        {/* Sezione feedback: divisa in ricevuti (sola lettura) e lasciati (modificabili) */}
        <div className="profile-reviews">

          {/* ─── FEEDBACK RICEVUTI ─── */}
          {/* Recensioni scritte da altri utenti verso l'utente loggato: sola lettura */}
          <h3>Feedback Ricevuti</h3>
          {myReviews.length === 0 ? (
            <div className="empty-state-sm">
              <p>Nessun feedback ancora</p>
            </div>
          ) : (
            myReviews.map((r, i) => (
              <div className="review-card" key={i}>
                {/* Intestazione: chi ha scritto e a chi è rivolto */}
                {(r.passeggero || r.autista) && (
                  <div className="review-identity">
                    <span className="review-from">
                      {r.passeggero?.nome || r.autista?.nome} {r.passeggero?.cognome || r.autista?.cognome}
                    </span>
                    <span className="review-arrow">→</span>
                    <span className="review-to">{user.nome} {user.cognome}</span>
                  </div>
                )}
                {/* Stelle piene e vuote basate sul voto */}
                <div className="review-header">
                  <span className="review-stars">{"★".repeat(r.voto)}{"☆".repeat(5 - r.voto)}</span>
                  {r.viaggio && (
                    <span className="review-trip">
                      {r.viaggio.cittaP} → {r.viaggio.cittaD}
                    </span>
                  )}
                </div>
                <p>{r.giudizio}</p>
              </div>
            ))
          )}

          {/* ─── FEEDBACK LASCIATI ─── */}
          {/* Recensioni scritte dall'utente loggato verso altri: modificabili ed eliminabili */}
          <h3 style={{ marginTop: "1.5rem" }}>Feedback Lasciati</h3>
          {writtenReviews.length === 0 ? (
            <div className="empty-state-sm">
              <p>Nessun feedback lasciato ancora</p>
            </div>
          ) : (
            writtenReviews.map((r, i) => (
              <div className="review-card" key={i}>
                {/* Intestazione: chi ha scritto e a chi è rivolto */}
                {(r.passeggero || r.autista) && (
                  <div className="review-identity">
                    <span className="review-from">{user.nome} {user.cognome}</span>
                    <span className="review-arrow">→</span>
                    <span className="review-to">
                      {r.passeggero?.nome || r.autista?.nome} {r.passeggero?.cognome || r.autista?.cognome}
                    </span>
                  </div>
                )}
                {/* Stelle piene e vuote basate sul voto */}
                <div className="review-header">
                  <span className="review-stars">{"★".repeat(r.voto)}{"☆".repeat(5 - r.voto)}</span>
                  {r.viaggio && (
                    <span className="review-trip">
                      {r.viaggio.cittaP} → {r.viaggio.cittaD}
                    </span>
                  )}
                </div>
                <p>{r.giudizio}</p>

                {/* Azioni disponibili per il feedback lasciato: modifica ed elimina */}
                <div className="review-actions">
                  {/* Bottone modifica: apre il form inline di modifica per questo feedback */}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingReview({ id: r.id, voto: r.voto, giudizio: r.giudizio })}
                  >
                    Modifica
                  </button>
                  {/* Bottone elimina: rimuove il feedback e aggiorna la lista locale */}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={async () => {
                      try {
                        await reviewsApi.delete(r.id);
                        // Rimuove il feedback dalla lista locale senza ricaricare dal backend
                        setWrittenReviews(writtenReviews.filter((x) => x.id !== r.id));
                      } catch (err) { alert(err.message); }
                    }}
                  >
                    Elimina
                  </button>
                </div>

                {/* Form inline di modifica: visibile solo per il feedback attualmente in modifica */}
                {editingReview && editingReview.id === r.id && (
                  <div className="review-edit-form">
                    {/* Selezione del nuovo voto tramite stelle cliccabili */}
                    <div className="star-input">
                      {[1,2,3,4,5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`star ${v <= editingReview.voto ? "active" : ""}`}
                          onClick={() => setEditingReview({ ...editingReview, voto: v })}
                          style={{ fontSize: "1.3rem" }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {/* Campo per modificare il testo della recensione */}
                    <div className="form-group">
                      <textarea
                        value={editingReview.giudizio}
                        onChange={(e) => setEditingReview({ ...editingReview, giudizio: e.target.value })}
                        rows={2}
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {/* Bottone salva: invia la modifica al backend e aggiorna la lista locale */}
                      <button className="btn btn-sm btn-primary" onClick={async () => {
                        try {
                          const updated = await reviewsApi.update(editingReview.id, {
                            voto: editingReview.voto,
                            giudizio: editingReview.giudizio,
                          });
                          // Aggiorna il feedback modificato nella lista locale
                          setWrittenReviews(writtenReviews.map((x) =>
                            x.id === updated.id ? { ...x, voto: updated.voto, giudizio: updated.giudizio } : x
                          ));
                          // Chiude il form di modifica
                          setEditingReview(null);
                        } catch (err) { alert(err.message); }
                      }}>Salva</button>
                      {/* Bottone annulla: chiude il form senza salvare */}
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditingReview(null)}>Annulla</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottone logout: disconnette l'utente e lo reindirizza alla pagina di login */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button onClick={() => { logout(); navigate("/login"); }} className="btn btn-danger">
            Esci dall'account
          </button>
        </div>
      </div>
    </div>
  );
}
