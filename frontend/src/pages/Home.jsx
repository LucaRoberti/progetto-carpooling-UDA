import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente Home - Pagina principale dell'applicazione.
 *
 * Mostra:
 *   - Sezione hero con titolo, descrizione e call-to-action.
 *     Il bottone "Crea Account" è visibile solo agli utenti non autenticati.
 *   - Sezione features con tre card cliccabili che descrivono le funzionalità principali:
 *     Cerca, Prenota, Valuta.
 *
 * Accessibile da tutti (route pubblica).
 */
export default function Home() {
  // Recupera l'utente autenticato per mostrare/nascondere il bottone di registrazione
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Sezione hero: presentazione dell'app con call-to-action */}
      <section className="hero">
        <div className="hero-badge">Mobilità Sostenibile</div>
        <h1>
          Viaggia insieme,
          <br />
          <span className="accent">spendi meno.</span>
        </h1>
        <p className="hero-sub">
          CarLink connette autisti e passeggeri per condividere viaggi urbani
          in modo intelligente, economico e sostenibile.
        </p>
        <div className="hero-actions">
          <Link to="/search" className="btn btn-primary btn-lg">Cerca un Viaggio</Link>
          {/* Il bottone "Crea Account" è nascosto se l'utente è già loggato */}
          {!user && <Link to="/register" className="btn btn-outline btn-lg">Crea Account</Link>}
        </div>
      </section>

      {/* Sezione features: tre card che descrivono le funzionalità principali */}
      <section className="features">
        <Link to="/search" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="feature-icon">🔍</div>
          <h3>Cerca</h3>
          <p>Trova viaggi per la tua destinazione in pochi secondi</p>
        </Link>
        <Link to="/bookings" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="feature-icon">📅</div>
          <h3>Prenotazioni</h3>
          <p>Prenota il tuo posto con un click e viaggia comodo</p>
        </Link>
        <Link to="/profile" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="feature-icon">⭐</div>
          <h3>Valutazioni</h3>
          <p>Lascia feedback per migliorare la community</p>
        </Link>
      </section>
    </div>
  );
}
