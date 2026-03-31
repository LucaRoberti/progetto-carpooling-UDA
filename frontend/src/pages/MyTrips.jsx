import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { trips } from "../services/api";

/**
 * Componente MyTrips - Pagina di gestione dei viaggi pubblicati dall'autista.
 *
 * Mostra una tabella con tutti i viaggi creati dall'autista autenticato.
 * Per ogni viaggio permette di:
 *   - Vedere i dettagli
 *   - Modificare i dati
 *   - Aprire/chiudere le prenotazioni
 *   - Eliminare il viaggio
 *
 * Accessibile solo agli autisti (protezione garantita da ProtectedRoute in App.jsx).
 */
export default function MyTrips() {
  // Lista dei viaggi pubblicati dall'autista, inizialmente vuota
  const [myTrips, setMyTrips] = useState([]);
  // Stato di caricamento durante il recupero dei dati dal backend
  const [loading, setLoading] = useState(true);

  // Carica i viaggi dell'autista all'avvio del componente
  useEffect(() => {
    trips.getMine().then(setMyTrips).catch(console.error).finally(() => setLoading(false));
  }, []);

  /**
   * Elimina un viaggio dopo conferma dell'utente.
   * Rimuove il viaggio dalla lista locale in caso di successo,
   * evitando una nuova chiamata al backend.
   *
   * @param {number} id - ID del viaggio da eliminare
   */
  const handleDelete = async (id) => {
    // Richiede conferma esplicita prima di procedere con l'eliminazione
    if (!confirm("Sei sicuro di voler eliminare questo viaggio?")) return;
    try {
      await trips.delete(id);
      // Aggiorna lo stato locale rimuovendo il viaggio eliminato dalla lista
      setMyTrips(myTrips.filter((t) => t.idViaggio !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Chiude un viaggio alle nuove prenotazioni impostando chiuso=true.
   * Aggiorna lo stato locale del viaggio senza ricaricare tutta la lista.
   *
   * @param {number} id - ID del viaggio da chiudere
   */
  const handleClose = async (id) => {
    try {
      await trips.update(id, { chiuso: true });
      // Aggiorna solo il viaggio specifico nella lista locale usando map
      setMyTrips(myTrips.map((t) => (t.idViaggio === id ? { ...t, chiuso: true } : t)));
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Riapre un viaggio alle nuove prenotazioni impostando chiuso=false.
   * Aggiorna lo stato locale del viaggio senza ricaricare tutta la lista.
   *
   * @param {number} id - ID del viaggio da riaprire
   */
  const handleOpen = async (id) => {
    try {
      await trips.update(id, { chiuso: false });
      // Aggiorna solo il viaggio specifico nella lista locale usando map
      setMyTrips(myTrips.map((t) => (t.idViaggio === id ? { ...t, chiuso: false } : t)));
    } catch (err) {
      alert(err.message);
    }
  };

  /**
   * Formatta una data in formato italiano compatto (giorno, mese abbreviato, ora).
   * Es: "10 mar, 14:30"
   *
   * @param {string|Date} d - Data da formattare
   * @returns {string} Data formattata
   */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

  // Mostra il loader mentre i dati vengono caricati dal backend
  if (loading) return <div className="page-loader">Caricamento...</div>;

  return (
    <div className="page">
      {/* Intestazione della pagina con titolo, sottotitolo e bottone per creare nuovo viaggio */}
      <div className="page-header">
        <div>
          <h1>I Miei Viaggi</h1>
          <p>Gestisci i viaggi che hai pubblicato</p>
        </div>
        <Link to="/trips/create" className="btn btn-primary">+ Nuovo Viaggio</Link>
      </div>

      {/* Stato vuoto: mostrato quando l'autista non ha ancora pubblicato viaggi */}
      {myTrips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Nessun viaggio pubblicato</h3>
          <p>Crea il tuo primo viaggio e inizia a condividere</p>
          <Link to="/trips/create" className="btn btn-primary">Crea Viaggio</Link>
        </div>
      ) : (
        // Tabella dei viaggi pubblicati
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Percorso</th>
                <th>Data</th>
                <th>Prezzo</th>
                <th>Posti</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {myTrips.map((t) => {
                // Numero di prenotazioni accettate per questo viaggio (posti occupati)
                const booked = t._count?.prenotazioni || 0;
                return (
                  <tr key={t.idViaggio}>
                    {/* Colonna percorso: mostra partenza → destinazione */}
                    <td>
                      <strong>{t.cittaP}</strong> → <strong>{t.cittaD}</strong>
                    </td>
                    <td>{formatDate(t.dataOra)}</td>
                    <td>€{t.costo}</td>
                    {/* Colonna posti: mostra prenotazioni accettate su totale posti */}
                    <td>{booked}/{t.nPosti}</td>
                    <td>
                      {/* Badge stato del viaggio: verde se attivo, rosso se chiuso */}
                      <span className={`status ${t.chiuso ? "status-rejected" : "status-accepted"}`}>
                        {t.chiuso ? "Chiuso" : "Attivo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {/* Link ai dettagli del viaggio */}
                        <Link to={`/trips/${t.idViaggio}`} className="btn btn-sm btn-ghost">Dettagli</Link>
                        {/* Link alla pagina di modifica del viaggio */}
                        <Link to={`/trips/${t.idViaggio}/edit`} className="btn btn-sm btn-outline">Modifica</Link>
                        {/* Bottone toggle per aprire/chiudere il viaggio alle prenotazioni */}
                        {t.chiuso ? (
                          <button onClick={() => handleOpen(t.idViaggio)} className="btn btn-sm btn-outline">
                            Apri
                          </button>
                        ) : (
                          <button onClick={() => handleClose(t.idViaggio)} className="btn btn-sm btn-outline">
                            Chiudi
                          </button>
                        )}
                        {/* Bottone eliminazione con stile rosso per segnalare l'azione distruttiva */}
                        <button onClick={() => handleDelete(t.idViaggio)} className="btn btn-sm btn-danger">
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
