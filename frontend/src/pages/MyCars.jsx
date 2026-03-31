import { useState, useEffect } from "react";
import { cars } from "../services/api";

/**
 * Componente MyCars - Pagina di gestione dei veicoli dell'autista.
 *
 * Permette all'autista autenticato di:
 *   - Vedere la lista delle proprie auto registrate
 *   - Aggiungere una nuova auto tramite form inline (targa, marca, modello, posti)
 *   - Eliminare un'auto (con conferma)
 *
 * Le auto registrate possono essere selezionate al momento della creazione di un viaggio.
 *
 * Accessibile solo agli autisti (protezione garantita da ProtectedRoute in App.jsx).
 */
export default function MyCars() {
  // Lista delle auto dell'autista, inizialmente vuota
  const [myCars, setMyCars] = useState([]);
  // Stato di caricamento durante il recupero iniziale dei dati
  const [loading, setLoading] = useState(true);
  // Controlla la visibilità del form di aggiunta auto
  const [showForm, setShowForm] = useState(false);
  // Campi del form per aggiungere una nuova auto
  const [form, setForm] = useState({ targa: "", marca: "", modello: "", nPosti: "" });
  // Messaggio di errore dal backend (es. targa già esistente)
  const [error, setError] = useState("");

  // Carica le auto dell'autista all'avvio del componente
  useEffect(() => {
    cars.getMine().then(setMyCars).catch(console.error).finally(() => setLoading(false));
  }, []);

  /**
   * Helper per aggiornare un singolo campo del form mantenendo gli altri invariati.
   *
   * @param {string} key - Nome del campo da aggiornare
   * @returns {Function} Handler per l'evento onChange dell'input
   */
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  /**
   * Aggiunge una nuova auto tramite l'API e la inserisce in cima alla lista locale.
   * Resetta il form e chiude il pannello dopo il successo.
   *
   * @param {React.FormEvent} e - Evento di submit del form
   */
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await cars.add({ ...form, nPosti: parseInt(form.nPosti) });
      // Aggiunge la nuova auto alla lista locale senza ricaricare dal backend
      setMyCars([...myCars, created]);
      setForm({ targa: "", marca: "", modello: "", nPosti: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Elimina un'auto dopo conferma dell'utente.
   * Rimuove l'auto dalla lista locale in caso di successo.
   *
   * @param {string} targa - Targa dell'auto da eliminare
   */
  const handleDelete = async (targa) => {
    if (!confirm("Eliminare questa auto?")) return;
    try {
      await cars.delete(targa);
      // Aggiorna la lista locale rimuovendo l'auto eliminata
      setMyCars(myCars.filter((c) => c.targa !== targa));
    } catch (err) {
      alert(err.message);
    }
  };

  // Mostra il loader mentre i dati vengono caricati dal backend
  if (loading) return <div className="page-loader">Caricamento...</div>;

  return (
    <div className="page">
      {/* Intestazione con titolo e bottone per aprire/chiudere il form */}
      <div className="page-header">
        <div>
          <h1>Le Mie Auto</h1>
          <p>Gestisci i tuoi veicoli</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? "Annulla" : "+ Aggiungi Auto"}
        </button>
      </div>

      {/* Form inline per aggiungere una nuova auto (visibile solo quando showForm è true) */}
      {showForm && (
        <form onSubmit={handleAdd} className="form-card form-card-inline">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Targa</label>
              <input value={form.targa} onChange={set("targa")} placeholder="AB123CD" required />
            </div>
            <div className="form-group">
              <label>Marca</label>
              <input value={form.marca} onChange={set("marca")} placeholder="Fiat" required />
            </div>
            <div className="form-group">
              <label>Modello</label>
              <input value={form.modello} onChange={set("modello")} placeholder="Panda" required />
            </div>
            <div className="form-group">
              <label>Posti</label>
              <input type="number" value={form.nPosti} onChange={set("nPosti")} placeholder="4" min="1" max="9" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Salva</button>
        </form>
      )}

      {/* Stato vuoto: mostrato quando non ci sono auto registrate e il form è chiuso */}
      {myCars.length === 0 && !showForm ? (
        <div className="empty-state">
          <h3>Nessuna auto registrata</h3>
          <p>Aggiungi la tua prima auto per iniziare</p>
        </div>
      ) : (
        // Griglia delle auto registrate con info e bottone elimina
        <div className="cars-grid">
          {myCars.map((car) => (
            <div className="car-card" key={car.targa}>
              <div className="car-info">
                {/* Marca e modello in maiuscolo, targa e numero posti */}
                <h3>{car.marca.toUpperCase()} {car.modello.toUpperCase()}</h3>
                <span className="car-plate">{car.targa}</span>
                <span className="car-seats">{car.nPosti} posti</span>
              </div>
              {/* Bottone elimina con stile rosso per segnalare l'azione distruttiva */}
              <button onClick={() => handleDelete(car.targa)} className="btn btn-sm btn-danger">
                Elimina
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
