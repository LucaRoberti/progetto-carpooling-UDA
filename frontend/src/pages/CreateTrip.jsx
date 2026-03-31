import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { trips, cars as carsApi } from "../services/api";
import TripMap from "../components/TripMap";

/**
 * Componente CreateTrip - Pagina di creazione di un nuovo viaggio.
 *
 * Permette all'autista di pubblicare un nuovo viaggio specificando:
 *   - Auto da utilizzare (selezionata tra quelle registrate)
 *   - Città di partenza e destinazione
 *   - Data e ora di partenza
 *   - Prezzo, durata stimata e posti disponibili
 *   - Preferenze: bagagli e animali ammessi
 *   - Tappe intermedie opzionali (aggiunte con Invio o bottone)
 *
 * Se l'autista non ha auto registrate, viene mostrato un avviso con link alla pagina auto.
 * In caso di successo, l'utente viene reindirizzato alla pagina di dettaglio del viaggio creato.
 *
 * Accessibile solo agli autisti (protezione garantita da ProtectedRoute in App.jsx).
 */
export default function CreateTrip() {
  const navigate = useNavigate();

  // Campi del form di creazione viaggio
  const [form, setForm] = useState({
    cittaP: "", cittaD: "", dataOra: "", costo: "",
    tempo: "", nPosti: "", bagagli: false, animali: false,
    tappe: [], targa: "",
  });

  // Lista delle auto dell'autista (per il selettore)
  const [myCars, setMyCars] = useState([]);
  // Messaggio di errore dal backend
  const [error, setError] = useState("");
  // Stato di caricamento durante l'invio del form
  const [loading, setLoading] = useState(false);
  // Dati debounced per la mappa (città + tappe)
  const [mapData, setMapData] = useState({ from: "", to: "", tappe: [] });
  const debounceRef = useRef(null);

  // Carica le auto dell'autista all'avvio per popolare il selettore
  useEffect(() => { carsApi.getMine().then(setMyCars).catch(console.error); }, []);

  // Aggiorna la mappa 700ms dopo che l'utente smette di digitare
  // Dipende anche da tappe: aggiorna subito quando si aggiunge/rimuove una tappa
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setMapData({ from: form.cittaP, to: form.cittaD, tappe: form.tappe });
    }, 700);
    return () => clearTimeout(debounceRef.current);
  }, [form.cittaP, form.cittaD, form.tappe]);

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
   * Invia il form di creazione del viaggio al backend.
   * Converte i campi numerici da stringa a intero prima dell'invio.
   * Reindirizza alla pagina di dettaglio in caso di successo.
   *
   * @param {React.FormEvent} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        ...form,
        costo: parseInt(form.costo),
        tempo: parseInt(form.tempo),
        nPosti: parseInt(form.nPosti),
      };
      const created = await trips.create(body);
      navigate(`/trips/${created.idViaggio}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="form-page">
        <div className="form-page-header">
          <h1>Nuovo Viaggio</h1>
          <p>Offri un passaggio e condividi le spese</p>
        </div>

        {/* Messaggio di errore dal backend */}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-card">
          {/* Selezione dell'auto: avviso se nessuna auto è registrata */}
          <div className="form-group">
            <label>Auto utilizzata *</label>
            {myCars.length === 0 ? (
              <div className="alert alert-warn">
                Nessuna auto registrata. <a href="/cars">Aggiungi un'auto</a> prima di creare un viaggio.
              </div>
            ) : (
              <select value={form.targa} onChange={set("targa")} required>
                <option value="">Seleziona un'auto</option>
                {myCars.map((car) => (
                  <option key={car.targa} value={car.targa}>
                    {car.marca.toUpperCase()} {car.modello.toUpperCase()} — {car.targa} ({car.nPosti} posti)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Città di partenza e destinazione */}
          <div className="form-row">
            <div className="form-group">
              <label>Città di Partenza</label>
              <input value={form.cittaP} onChange={set("cittaP")} placeholder="es. Milano" required />
            </div>
            <div className="form-group">
              <label>Città di Destinazione</label>
              <input value={form.cittaD} onChange={set("cittaD")} placeholder="es. Roma" required />
            </div>
          </div>

          {/* Mappa interattiva: aggiorna quando cambiano città o tappe */}
          <TripMap
            from={mapData.from}
            to={mapData.to}
            tappe={mapData.tappe}
            onInfo={({ durationMin }) => {
              setForm(f => ({ ...f, tempo: String(durationMin) }));
            }}
          />

          {/* Data e ora di partenza */}
          <div className="form-group">
            <label>Data e Ora di Partenza</label>
            <input type="datetime-local" value={form.dataOra} onChange={set("dataOra")} required />
          </div>

          {/* Prezzo e posti disponibili */}
          <div className="form-row">
            <div className="form-group">
              <label>Prezzo (€)</label>
              <input type="number" value={form.costo} onChange={set("costo")} placeholder="25" min="1" required />
            </div>
            <div className="form-group">
              <label>Posti Disponibili</label>
              <input type="number" value={form.nPosti} onChange={set("nPosti")} placeholder="3" min="1" max="8" required />
            </div>
          </div>

          {/* Durata calcolata automaticamente dalla mappa */}
          {form.tempo ? (
            <div className="form-group">
              <label>Durata stimata</label>
              <div className="tempo-calcolato">
                ⏱ {form.tempo} minuti — calcolata dal percorso
              </div>
            </div>
          ) : (mapData.from && mapData.to) ? (
            <div className="alert alert-info" style={{ fontSize: "0.85rem" }}>
              Calcolo della durata in corso...
            </div>
          ) : null}

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
            {/* Lista delle tappe già aggiunte con bottone per rimuoverle */}
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
                id="tappa-input"
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
                const input = document.getElementById("tappa-input");
                const val = input.value.trim();
                if (val) { setForm({ ...form, tappe: [...form.tappe, val] }); input.value = ""; }
              }}>Aggiungi</button>
            </div>
            <small style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Premi Invio o il pulsante per aggiungere una tappa</small>
          </div>

          {/* Bottone: disabilitato se manca la durata o durante il salvataggio */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !form.tempo}
            title={!form.tempo ? "Inserisci le città per calcolare il percorso" : ""}
          >
            {loading ? "Creazione..." : "Pubblica Viaggio"}
          </button>
          {!form.tempo && mapData.from && mapData.to && (
            <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
              Attendi il calcolo del percorso per pubblicare
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
