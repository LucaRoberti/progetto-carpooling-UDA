import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente Navbar - Barra di navigazione principale dell'applicazione.
 *
 * Mostra:
 *   - Logo CarLink (sempre visibile, link alla home)
 *   - Link "Cerca Viaggi" (sempre visibile)
 *   - Link contestuali per gli autisti: Nuovo Viaggio, I Miei Viaggi, Le Mie Auto
 *   - Link "Prenotazioni" per gli utenti autenticati
 *   - Avatar con dropdown profilo (se autenticato)
 *   - Bottoni Accedi / Registrati (se non autenticato)
 *
 * Il dropdown si chiude automaticamente cliccando fuori tramite un listener globale sul documento.
 */
export default function Navbar() {
  // Dati dell'utente autenticato, ruolo e funzione di logout dal contesto globale
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Stato aperto/chiuso del dropdown del profilo
  const [open, setOpen] = useState(false);
  // Riferimento al contenitore del dropdown per rilevare click esterni
  const ref = useRef(null);

  // Aggiunge un listener globale per chiudere il dropdown quando si clicca fuori
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    // Rimuove il listener quando il componente viene smontato
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Esegue il logout dell'utente, lo reindirizza al login e chiude il dropdown.
   */
  const handleLogout = () => { logout(); navigate("/login"); setOpen(false); };

  // Calcola le iniziali dell'utente per l'avatar (es. "MR" per Mario Rossi)
  const initials = user ? `${user.nome?.[0] || ""}${user.cognome?.[0] || ""}`.toUpperCase() : "";

  return (
    <nav className="navbar">
      {/* Logo con icona SVG e nome dell'app */}
      <Link to="/" className="nav-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
          <circle cx="6" cy="12" r="3.5"/>
          <circle cx="18" cy="12" r="3.5"/>
          <line x1="9.5" y1="12" x2="14.5" y2="12"/>
        </svg>
        <span><span className="logo-car">Car</span><span className="logo-link">Link</span></span>
      </Link>

      <div className="nav-links">
        {/* Link sempre visibile per la ricerca dei viaggi */}
        <Link to="/search">Cerca Viaggi</Link>

        {user ? (
          <>
            {/* Link visibili solo agli autisti */}
            {role === "autista" && (
              <>
                <Link to="/trips/create">Nuovo Viaggio</Link>
                <Link to="/trips/mine">I Miei Viaggi</Link>
                <Link to="/cars">Le Mie Auto</Link>
              </>
            )}

            {/* Link alle prenotazioni (visibile a tutti gli utenti autenticati) */}
            <Link to="/bookings">Prenotazioni</Link>

            {/* Avatar con dropdown per accedere al profilo e al logout */}
            <div className="nav-profile" ref={ref}>
              <button className="nav-avatar-btn" onClick={() => setOpen(!open)} aria-label="Profilo" style={{ padding: 0, overflow: "hidden" }}>
                {/* Mostra la foto profilo se disponibile, altrimenti le iniziali */}
                {user?.fotoUrl
                  ? <img src={user.fotoUrl} className="nav-avatar-img" alt="avatar" style={{ width: "100%", height: "100%" }} />
                  : initials
                }
              </button>

              {/* Dropdown con nome utente, link al profilo e bottone di logout */}
              {open && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-user">
                    <strong>{user.nome} {user.cognome}</strong>
                    <span>{role === "autista" ? "Autista" : "Passeggero"}</span>
                  </div>
                  <Link to="/profile" className="nav-dropdown-item" onClick={() => setOpen(false)}>Il mio profilo</Link>
                  <button onClick={handleLogout} className="nav-dropdown-item danger">Esci</button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Bottoni di accesso e registrazione per gli utenti non autenticati */
          <>
            <Link to="/login" className="btn btn-ghost">Accedi</Link>
            <Link to="/register" className="btn btn-primary">Registrati</Link>
          </>
        )}
      </div>
    </nav>
  );
}
