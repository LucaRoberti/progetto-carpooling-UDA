import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente ProtectedRoute - Wrapper per proteggere le route dall'accesso non autorizzato.
 *
 * Comportamento:
 *   - Se il contesto di autenticazione è ancora in fase di caricamento (es. verifica token),
 *     mostra un loader per evitare redirect prematuri.
 *   - Se l'utente non è autenticato, lo reindirizza alla pagina di login.
 *   - Se è specificato `allowedRoles` e il ruolo dell'utente non è incluso,
 *     lo reindirizza alla home page (accesso negato).
 *   - Altrimenti, renderizza il componente figlio normalmente.
 *
 * @param {React.ReactNode} children - Il componente da proteggere
 * @param {string[]} [allowedRoles] - Elenco dei ruoli autorizzati ad accedere alla route.
 *   Se omesso, qualsiasi utente autenticato può accedere.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  // Aspetta che il contesto di autenticazione sia pronto prima di decidere
  if (loading) return <div className="page-loader">Caricamento...</div>;
  // Utente non autenticato: reindirizza al login
  if (!user) return <Navigate to="/login" replace />;
  // Utente autenticato ma con ruolo non autorizzato: reindirizza alla home
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  // Accesso consentito: renderizza il contenuto protetto
  return children;
}
