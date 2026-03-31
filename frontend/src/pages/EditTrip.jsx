import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trips, cars as carsApi } from "../services/api";

/**
 * Componente EditTrip - Pagina di modifica di un viaggio esistente.
 *
 * Carica i dati del viaggio tramite l'ID nell'URL e precompila il form.
 * Permette all'autista di modificare tutti i campi del viaggio:
 *   - Auto da utilizzare
 *   - Città di partenza e destinazione
 *   - Data e ora di partenza
 *   - Prezzo, durata stimata e posti disponibili
 *   - Preferenze: bagagli e animali ammessi
 *   - Tappe intermedie (aggiungibili e rimovibili)
 *
 * In caso di successo, l'utente viene reindirizzato alla pagina di dettaglio del viaggio.
 *
 * Accessibile solo agli autisti (protezione garantita da ProtectedRoute in App.jsx).
 * Route: /trips/:id/edit
 */
export default function EditTrip() {
  // ID del viaggio da modificare, estratto dall'URL
  const { id } = useParams();
  const navigate = useNavigate();

  // Dati del form (null finché il viaggio non è stato caricato dal backend)
  const [form, setForm] = useState(null);
  // Lista delle auto dell'autista per il selettore
  const [myCars, setMyCars] = useState([]);
  // Messaggio di errore dal backend
  const [error, setError] = useState("");
  // Stato di caricamento durante l'invio del form
  const [loading, setLoading] = useState(false);

  // Carica i dati del viaggio e le auto dell'autista all'avvio del componente
  useEffect(() => {
    trips.getById(id).then((trip) => {
      // Precompila il form con i dati esistenti del viaggio
      setForm({
        cittaP: trip.cittaP || "",
        cittaD: trip.cittaD || "",
        // Converte la data ISO in formato compatibile con input datetime-local
        dataOra: trip.dataOra ? new Date(trip.dataOra).toISOString().slice(0, 16) : "",
        costo: String(trip.costo || ""),
        tempo: String(trip.tempo || ""),
        nPosti: String(trip.nPosti || ""),
        bagagli: trip.bagagli ?? false,
        animali: trip.animali ?? false,
        tappe: trip.tappe || [],
        targa: trip.targa || "",
        chiuso: trip.chiuso ?? false,
      });
    }).catch(console.error);
    // Carica le auto per popolare il selettore
    carsApi.getMine().then(setMyCars).catch(console.error);
  }, [id]);

  /**
   * Helper per aggiornare un singolo campo del form.
   * Gestisce sia input testuali che checkbox.
   *
   * @param {string} key - Nome del campo da aggiornare
   * @returns {Function} Handler per l'evento onChange dell'input
   */
  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: val });
  };

  /**
   * Invia le modifiche al backend e reindirizza al dettaglio del viaggio.
   * Converte i campi numerici da stringa a intero prima dell'invio.
   *
   * @param {React.FormEvent} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await trips.update(id, {
        ...form,
        costo: parseInt(form.costo),
        tempo: parseInt(form.tempo),
        nPosti: parseInt(form.nPosti),
      });
      navigate(`/trips/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mostra il loader finché i dati del viaggio non sono stati caricati
  if (!form) return <div className="page-loader">Caricamento...</div>;

  return (
    <div className="page">
      <div className="form-page">
        <div className="form-page-header">
          <h1>Modifica Viaggio</h1>
          <p>Aggiorna i dettagli del viaggio</p>
        </div>

        {/* Messaggio di errore dal backend */}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-card">
          {/* Selezione dell'auto */}
          <div className="form-group">
            <label>Auto utilizzata</label>
            <select value={form.targa} onChange={set("targa")}>
              <option value="">Nessuna auto selezionata</option>
              {myCars.map((car) => (
                <option key={car.targa} value={car.targa}>
                  {car.marca.toUpperCase()} {car.modello.toUpperCase()} — {car.targa} ({car.nPosti} posti)
                </option>
              ))}
            </select>
          </div>

          {/* Città di partenza e destinazione */}
          <div className="form-row">
            <div className="form-group">
              <label>Città di Partenza</label>
              <input value={form.cittaP} onChange={set("cittaP")} required />
            </div>
            <div className="form-group">
              <label>Città di Destinazione</label>
              <input value={form.cittaD} onChange={set("cittaD")} required />
            </div>
          </div>

          {/* Data e ora di partenza */}
          <div className="form-group">
            <label>Data e Ora di Partenza</label>
            <input type="datetime-local" value={form.dataOra} onChange={set("dataOra")} required />
          </div>

          {/* Prezzo, durata e posti disponibili */}
          <div className="form-row form-row-3">
            <div className="form-group">
              <label>Prezzo (€)</label>
              <input type="number" value={form.costo} onChange={set("costo")} min="1" required />
            </div>
            <div className="form-group">
              <label>Durata (min)</label>
              <input type="number" value={form.tempo} onChange={set("tempo")} min="1" required />
            </div>
            <div className="form-group">
              <label>Posti Disponibili</label>
              <input type="number" value={form.nPosti} onChange={set("nPosti")} min="1" max="8" required />
            </div>
          </div>

          {/* Preferenze: bagagli e animali ammessi */}
          <div className="form-row-checks">
            <label className="check-label">
              <input type="checkbox" checked={form.bagagli} onChange={set("bagagli")} />
              <span>Bagagli ammessi</span>
            </label>
            <label className="check-label">
              <input type="checkbox" checked={form.animali} onChange={set("animali")} />
              <span>Animali ammessi</span>
            </label>
          </div>

          {/* Tappe intermedie: aggiunte con Invio o bottone, rimovibili con × */}
          <div className="form-group">
            <label>Tappe intermedie (opzionale)</label>
            {/* Lista delle tappe esistenti con bottone per rimuoverle */}
            {form.tappe.length > 0 && (
              <div className="tappe-list">
                {form.tappe.map((t, i) => (
                  <div key={i} className="tappa-item">
                    <span>{t}</span>
                    <button type="button" onClick={() => setForm({ ...form, tappe: form.tappe.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
              </div>
            )}
            {/* Input per aggiungere una nuova tappa */}
            <div className="tappa-add">
              <input
                id="tappa-edit-input"
                placeholder="es. Firenze"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.target.value.trim();
                    if (val) { setForm({ ...form, tappe: [...form.tappe, val] }); e.target.value = ""; }
                  }
                }}
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => {
                const input = document.getElementById("tappa-edit-input");
                const val = input.value.trim();
                if (val) { setForm({ ...form, tappe: [...form.tappe, val] }); input.value = ""; }
              }}>Aggiungi</button>
            </div>
          </div>

          {/* Bottone disabilitato durante il caricamento per evitare submit multipli */}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Salvataggio..." : "Salva Modifiche"}
          </button>
        </form>
      </div>
    </div>
  );
}
