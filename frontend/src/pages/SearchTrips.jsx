import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { trips } from "../services/api";

/**
 * Componente SearchTrips - Pagina di ricerca dei viaggi disponibili.
 *
 * Permette di filtrare i viaggi per:
 *   - Città di partenza
 *   - Città di destinazione
 *   - Data del viaggio
 *
 * I risultati vengono mostrati come card cliccabili che portano al dettaglio del viaggio.
 * Lo stato della ricerca (filtri + risultati) viene persistito in sessionStorage per
 * mantenere la lista quando l'utente torna indietro dalla pagina di dettaglio.
 *
 * Accessibile da tutti (route pubblica).
 */
export default function SearchTrips() {
  // Filtri di ricerca
  const [cittaP, setCittaP] = useState("");
  const [cittaD, setCittaD] = useState("");
  const [data, setData] = useState("");

  // Lista dei risultati della ricerca
  const [results, setResults] = useState([]);
  // True se l'utente ha già eseguito almeno una ricerca (per mostrare "nessun risultato")
  const [searched, setSearched] = useState(false);
  // Stato di caricamento durante la chiamata API
  const [loading, setLoading] = useState(false);

  // Ripristina lo stato della ricerca dalla sessionStorage al caricamento della pagina
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("carlink_search");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cittaP !== undefined) setCittaP(parsed.cittaP);
        if (parsed.cittaD !== undefined) setCittaD(parsed.cittaD);
        if (parsed.data !== undefined) setData(parsed.data);
        if (parsed.results !== undefined) setResults(parsed.results);
        if (parsed.searched !== undefined) setSearched(parsed.searched);
      }
    } catch (_) {}
  }, []);

  /**
   * Esegue la ricerca dei viaggi tramite l'API con i filtri inseriti.
   * Salva i risultati in sessionStorage per ripristinarli in caso di navigazione.
   *
   * @param {React.FormEvent} e - Evento di submit del form di ricerca
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Costruisce i parametri di ricerca escludendo i filtri vuoti
      const params = {};
      if (cittaP) params.cittaP = cittaP;
      if (cittaD) params.cittaD = cittaD;
      if (data) params.data = data;
      const res = await trips.search(params);
      setResults(res);
      setSearched(true);
      // Persiste i risultati in sessionStorage per il ripristino alla navigazione
      sessionStorage.setItem("carlink_search", JSON.stringify({ cittaP, cittaD, data, results: res, searched: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formatta una data in formato italiano con giorno della settimana, data e ora.
   * Es: "lun 10 mar, 14:30"
   *
   * @param {string|Date} d - Data da formattare
   * @returns {string} Data formattata
   */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="page">
      {/* Intestazione della pagina */}
      <div className="page-header">
        <h1>Cerca Viaggi</h1>
        <p>Trova il tuo prossimo passaggio</p>
      </div>

      {/* Form di ricerca con filtri per partenza, destinazione e data */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Da dove?" value={cittaP} onChange={(e) => setCittaP(e.target.value)} />
        <span className="search-arrow">→</span>
        <input placeholder="Dove vai?" value={cittaD} onChange={(e) => setCittaD(e.target.value)} />
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "..." : "Cerca"}
        </button>
      </form>

      {/* Griglia dei risultati: ogni card è un link al dettaglio del viaggio */}
      <div className="trip-grid">
        {results.map((trip) => {
          // Calcola i posti rimanenti sottraendo le prenotazioni accettate dal totale
          const seatsLeft = trip.nPosti - (trip._count?.prenotazioni || 0);
          return (
            <Link to={`/trips/${trip.idViaggio}`} className="trip-card" key={trip.idViaggio}>
              {/* Percorso: partenza → destinazione con linea grafica */}
              <div className="trip-route">
                <span className="city">{trip.cittaP.toUpperCase()}</span>
                <span className="route-line">
                  <span className="dot" />
                  <span className="line" />
                  <span className="dot" />
                </span>
                <span className="city">{trip.cittaD.toUpperCase()}</span>
              </div>

              {/* Metadati del viaggio: data, durata, posti disponibili */}
              <div className="trip-meta">
                <span>{formatDate(trip.dataOra)}</span>
                <span>{trip.tempo} min</span>
                {/* Il badge posti diventa rosso quando ne rimane solo uno */}
                <span className={`seats ${seatsLeft <= 1 ? "seats-low" : ""}`}>
                  {seatsLeft} post{seatsLeft === 1 ? "o" : "i"}
                </span>
              </div>

              {/* Footer della card: nome autista e prezzo */}
              <div className="trip-footer">
                <span className="driver-name">
                  {trip.autista?.nome} {trip.autista?.cognome}
                </span>
                <span className="price">€{trip.costo}</span>
              </div>

              {/* Tag opzionali per le preferenze del viaggio */}
              <div className="trip-tags">
                {trip.bagagli && <span className="tag">Bagagli</span>}
                {trip.animali && <span className="tag">Animali</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stato vuoto: mostrato solo dopo una ricerca senza risultati */}
      {searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">&#128269;</div>
          <h3>Nessun viaggio trovato</h3>
          <p>Prova a modificare i parametri di ricerca</p>
        </div>
      )}
    </div>
  );
}
