import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente Register - Pagina di registrazione di un nuovo account CarLink.
 *
 * Permette di creare un account come "Passeggero" o "Autista" tramite un toggle.
 * I campi del form cambiano in base al ruolo selezionato:
 *   - Passeggero: nome, cognome, CF, email, telefono, password
 *   - Autista: stessi campi + numero patente e data di scadenza patente
 *
 * In caso di successo, l'utente viene autenticato automaticamente e reindirizzato alla home.
 *
 * Accessibile da tutti (route pubblica).
 */
export default function Register() {
  // Ruolo selezionato dall'utente ("passeggero" o "autista"), default passeggero
  const [role, setRole] = useState("passeggero");

  // Campi del form di registrazione
  const [form, setForm] = useState({
    codiceFiscale: "", nome: "", cognome: "", telefono: "",
    email: "", password: "",
    numPatente: "", scadenzaPatente: "", // Solo per autisti
  });

  // Messaggio di errore da mostrare in caso di registrazione fallita
  const [error, setError] = useState("");
  // Stato di caricamento durante la chiamata API
  const [loading, setLoading] = useState(false);

  // Funzione register dal contesto globale di autenticazione
  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * Helper per aggiornare un singolo campo del form mantenendo gli altri invariati.
   *
   * @param {string} key - Nome del campo da aggiornare
   * @returns {Function} Handler per l'evento onChange dell'input
   */
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  /**
   * Gestisce l'invio del form di registrazione.
   * Costruisce il body della richiesta in base al ruolo selezionato,
   * chiama la funzione register del contesto e reindirizza alla home in caso di successo.
   *
   * @param {React.FormEvent} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Costruisce il body base comune a entrambi i ruoli
      const body = { role, codiceFiscale: form.codiceFiscale, nome: form.nome, cognome: form.cognome, telefono: form.telefono, password: form.password };
      if (role === "autista") {
        // Campi aggiuntivi solo per gli autisti
        body.emailA = form.email;
        body.numPatente = parseInt(form.numPatente);
        body.scadenzaPatente = form.scadenzaPatente;
      } else {
        body.emailP = form.email;
      }
      await register(body);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1>Crea Account</h1>
          <p>Unisciti alla community CarLink</p>
        </div>

        {/* Toggle per selezionare il ruolo: Passeggero o Autista */}
        <div className="role-toggle">
          <button
            type="button"
            className={`toggle-btn ${role === "passeggero" ? "active" : ""}`}
            onClick={() => setRole("passeggero")}
          >
            Passeggero
          </button>
          <button
            type="button"
            className={`toggle-btn ${role === "autista" ? "active" : ""}`}
            onClick={() => setRole("autista")}
          >
            Autista
          </button>
        </div>

        {/* Messaggio di errore (visibile solo in caso di registrazione fallita) */}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Riga nome e cognome */}
          <div className="form-row">
            <div className="form-group">
              <label>Nome</label>
              <input value={form.nome} onChange={set("nome")} placeholder="Mario" required />
            </div>
            <div className="form-group">
              <label>Cognome</label>
              <input value={form.cognome} onChange={set("cognome")} placeholder="Rossi" required />
            </div>
          </div>

          {/* Codice fiscale */}
          <div className="form-group">
            <label>Codice Fiscale</label>
            <input value={form.codiceFiscale} onChange={set("codiceFiscale")} placeholder="RSSMRA85M01H501Z" required />
          </div>

          {/* Riga email e telefono */}
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="nome@email.it" required />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input value={form.telefono} onChange={set("telefono")} placeholder="3331234567" required />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 caratteri" required minLength={6} />
          </div>

          {/* Campi aggiuntivi visibili solo se il ruolo selezionato è "autista" */}
          {role === "autista" && (
            <div className="form-row">
              <div className="form-group">
                <label>Numero Patente</label>
                <input type="number" value={form.numPatente} onChange={set("numPatente")} placeholder="123456789" required />
              </div>
              <div className="form-group">
                <label>Scadenza Patente</label>
                <input type="date" value={form.scadenzaPatente} onChange={set("scadenzaPatente")} required />
              </div>
            </div>
          )}

          {/* Bottone disabilitato durante il caricamento per evitare submit multipli */}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Registrazione..." : "Crea Account"}
          </button>
        </form>

        {/* Link alla pagina di login per chi ha già un account */}
        <p className="auth-footer">
          Hai già un account? <Link to="/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
