import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente Login - Pagina di accesso all'account CarLink.
 *
 * Mostra un form con i campi email e password.
 * In caso di successo, l'utente viene reindirizzato alla home page.
 * In caso di errore (credenziali errate, utente non trovato), viene mostrato un alert.
 *
 * Accessibile da tutti (route pubblica).
 */
export default function Login() {
  // Valore del campo email
  const [email, setEmail] = useState("");
  // Valore del campo password
  const [password, setPassword] = useState("");
  // Messaggio di errore da mostrare in caso di login fallito
  const [error, setError] = useState("");
  // Stato di caricamento durante la chiamata API
  const [loading, setLoading] = useState(false);

  // Funzione login dal contesto globale di autenticazione
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Gestisce l'invio del form di login.
   * Chiama la funzione login del contesto e reindirizza alla home in caso di successo.
   *
   * @param {React.FormEvent} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Bentornato</h1>
          <p>Accedi al tuo account CarLink</p>
        </div>

        {/* Messaggio di errore (visibile solo in caso di login fallito) */}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.it"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              required
            />
          </div>
          {/* Bottone disabilitato durante il caricamento per evitare submit multipli */}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        {/* Link alla pagina di registrazione per chi non ha ancora un account */}
        <p className="auth-footer">
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
