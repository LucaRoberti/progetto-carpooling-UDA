import { createContext, useContext, useState, useEffect } from "react";
import { auth as authApi } from "../services/api";

/**
 * Contesto globale di autenticazione.
 * Fornisce a tutti i componenti dell'applicazione lo stato dell'utente autenticato
 * e le funzioni per gestire login, logout e registrazione.
 */
const AuthContext = createContext(null);

/**
 * Provider del contesto di autenticazione.
 *
 * All'avvio verifica se esiste un token JWT salvato nel localStorage:
 *   - Se esiste, chiama /auth/me per recuperare i dati aggiornati dell'utente.
 *   - Se la chiamata fallisce (token scaduto o non valido), pulisce il localStorage.
 *
 * Espone tramite il contesto:
 *   - `user`: oggetto con i dati dell'utente autenticato (null se non loggato)
 *   - `role`: ruolo dell'utente ("autista" o "passeggero")
 *   - `loading`: true mentre si verifica il token al primo caricamento
 *   - `login(email, password)`: autentica l'utente e salva il token
 *   - `register(data)`: registra un nuovo utente e salva il token
 *   - `logout()`: rimuove il token e resetta lo stato
 *   - `updateUser(data)`: aggiorna parzialmente i dati dell'utente in memoria
 *
 * @param {React.ReactNode} children - Componenti figli che avranno accesso al contesto
 */
export function AuthProvider({ children }) {
  // Dati dell'utente autenticato (null se non loggato)
  const [user, setUser] = useState(null);
  // Ruolo dell'utente ("autista" o "passeggero")
  const [role, setRole] = useState(null);
  // True durante la verifica iniziale del token (evita redirect prematuri in ProtectedRoute)
  const [loading, setLoading] = useState(true);

  // Al primo montaggio: verifica se l'utente era già loggato tramite token salvato
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (token) {
      authApi
        .me()
        .then((data) => {
          setUser(data);
          // Usa il ruolo salvato nel localStorage (più veloce) oppure quello restituito dal server
          setRole(savedRole || data.role);
        })
        .catch(() => {
          // Token non valido o scaduto: pulisce il localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        })
        .finally(() => setLoading(false));
    } else {
      // Nessun token trovato: l'utente non è autenticato
      setLoading(false);
    }
  }, []);

  /**
   * Autentica l'utente con email e password.
   * Salva il token JWT e il ruolo nel localStorage per persistenza tra sessioni.
   * Pulisce la cache della ricerca (sessionStorage) per ripartire da zero.
   *
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @returns {object} Risposta del backend (contiene token, role, user)
   */
  const login = async (email, password) => {
    sessionStorage.removeItem("carlink_search");
    const res = await authApi.login({ email, password });
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);
    setUser(res.user);
    setRole(res.role);
    return res;
  };

  /**
   * Registra un nuovo utente e lo autentica immediatamente.
   * Salva il token JWT e il ruolo nel localStorage.
   *
   * @param {object} data - Dati di registrazione (nome, cognome, CF, email, password, ruolo, ecc.)
   * @returns {object} Risposta del backend (contiene token, role, user)
   */
  const register = async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);
    setUser(res.user);
    setRole(res.role);
    return res;
  };

  /**
   * Disconnette l'utente rimuovendo token, ruolo e cache di ricerca.
   * Resetta lo stato locale a null.
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("carlink_search");
    setUser(null);
    setRole(null);
  };

  /**
   * Aggiorna parzialmente i dati dell'utente in memoria (senza fare una nuova chiamata API).
   * Usato ad esempio dopo il salvataggio del profilo per aggiornare nome, foto, ecc.
   *
   * @param {object} data - Campi da aggiornare nell'oggetto user corrente
   */
  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizzato per accedere al contesto di autenticazione.
 * Equivale a useContext(AuthContext).
 *
 * @returns {{ user, role, loading, login, register, logout, updateUser }}
 */
export const useAuth = () => useContext(AuthContext);
