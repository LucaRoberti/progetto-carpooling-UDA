// URL base del backend. Tutte le chiamate API vengono inoltrate a questo indirizzo
const API = "http://localhost:3000";

/**
 * Funzione helper centralizzata per tutte le chiamate HTTP al backend.
 * Gestisce automaticamente:
 *   - L'aggiunta dell'header Authorization con il token JWT (se presente nel localStorage)
 *   - La serializzazione/deserializzazione JSON
 *   - Il lancio di errori leggibili in caso di risposta non ok o parsing fallito
 *
 * @param {string} path - Percorso dell'endpoint relativo all'URL base (es. "/trips")
 * @param {Object} [options={}] - Opzioni fetch aggiuntive (method, body, headers, ecc.)
 * @returns {Promise<any>} I dati JSON restituiti dal server
 * @throws {Error} In caso di errore di rete, risposta non ok o risposta non JSON
 */
async function request(path, options = {}) {
  // Recupera il token JWT salvato nel localStorage dopo il login
  const token = localStorage.getItem("token");
  // Imposta sempre Content-Type JSON; aggiunge eventuali header extra dal chiamante
  const headers = { "Content-Type": "application/json", ...options.headers };
  // Se il token è presente, aggiunge l'header di autenticazione Bearer
  if (token) headers.Authorization = `Bearer ${token}`;

  // Esegue la chiamata HTTP al backend combinando URL base, percorso e opzioni
  const res = await fetch(`${API}${path}`, { ...options, headers });
  // Legge il corpo della risposta come testo per gestire sia JSON che errori HTML
  const text = await res.text();

  let data;
  // Prova a fare il parsing JSON; se fallisce, il backend non ha risposto correttamente
  try { data = JSON.parse(text); } catch { throw new Error(`Errore server (${res.status}). Assicurati che il backend sia avviato.`); }
  // Se la risposta HTTP indica un errore (status >= 400), lancia un errore con il messaggio del server
  if (!res.ok) throw new Error(data.error || "Errore di rete");
  return data;
}

// =====================================================
// Gruppo endpoint Autenticazione
// Gestisce registrazione, login e recupero utente corrente
// =====================================================
export const auth = {
  // Registra un nuovo utente (autista o passeggero) con i dati del form
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  // Effettua il login e ottiene il token JWT
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  // Recupera i dati dell'utente autenticato corrente tramite il token nel localStorage
  me: () => request("/users/me"),
};

// =====================================================
// Gruppo endpoint Viaggi
// Gestisce ricerca, creazione, modifica ed eliminazione dei viaggi
// =====================================================
export const trips = {
  // Cerca viaggi con filtri opzionali (cittaP, cittaD, data) passati come parametri URL
  search: (params) => {
    // Converte l'oggetto parametri in stringa query string (es. "cittaP=Roma&cittaD=Milano")
    const q = new URLSearchParams(params).toString();
    return request(`/trips?${q}`);
  },
  // Recupera i dettagli completi di un singolo viaggio tramite il suo ID
  getById: (id) => request(`/trips/${id}`),
  // Recupera tutti i viaggi pubblicati dall'autista autenticato
  getMine: () => request("/trips/mine"),
  // Crea un nuovo viaggio (solo per autisti)
  create: (body) => request("/trips", { method: "POST", body: JSON.stringify(body) }),
  // Aggiorna i dati di un viaggio esistente (solo per l'autista proprietario)
  update: (id, body) => request(`/trips/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  // Elimina un viaggio e tutti i dati correlati (solo per l'autista proprietario)
  delete: (id) => request(`/trips/${id}`, { method: "DELETE" }),
};

// =====================================================
// Gruppo endpoint Prenotazioni
// Gestisce creazione, recupero e aggiornamento stato delle prenotazioni
// =====================================================
export const bookings = {
  // Crea una nuova prenotazione per un viaggio (solo per passeggeri)
  // Il messaggio opzionale viene inviato all'autista insieme alla richiesta
  create: (idViaggio, messaggio) => request("/bookings", { method: "POST", body: JSON.stringify({ idViaggio, messaggio }) }),
  // Recupera tutte le prenotazioni dell'utente autenticato
  // Se autista: le richieste ricevute; se passeggero: le prenotazioni effettuate
  getMine: () => request("/bookings/mine"),
  // Aggiorna lo stato di una prenotazione (accepted/rejected) - solo per autisti
  updateStatus: (id, stato) =>
    request(`/bookings/${id}/status`, { method: "PUT", body: JSON.stringify({ stato }) }),
};

// =====================================================
// Gruppo endpoint Recensioni (Feedback)
// Gestisce creazione, lettura, modifica ed eliminazione dei feedback
// =====================================================
export const reviews = {
  // Crea un nuovo feedback per un viaggio completato
  create: (body) => request("/reviews", { method: "POST", body: JSON.stringify(body) }),
  // Recupera i feedback ricevuti dall'utente autenticato (da altri utenti verso di lui)
  getMine: () => request("/reviews/mine"),
  // Recupera i feedback scritti dall'utente autenticato (da lui verso altri utenti)
  getWritten: () => request("/reviews/written"),
  // Elimina un feedback specifico (solo l'autore può eliminarlo)
  delete: (id) => request(`/reviews/${id}`, { method: "DELETE" }),
  // Aggiorna voto e testo di un feedback esistente (solo l'autore può modificarlo)
  update: (id, body) => request(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

// =====================================================
// Gruppo endpoint Utenti
// Gestisce profili pubblici e aggiornamento del proprio profilo
// =====================================================
export const users = {
  // Recupera il profilo pubblico di un utente tramite codice fiscale
  // Restituisce nome, telefono, descrizione, valutazione media e recensioni
  getPublic: (cf) => request(`/users/public/${cf}`),
  // Aggiorna i dati del profilo dell'utente autenticato (descrizione, telefono, email, foto)
  updateMe: (body) => request("/users/me", { method: "PUT", body: JSON.stringify(body) }),
  // Carica una nuova foto profilo (multipart/form-data)
  uploadAvatar: (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("foto", file);
    return fetch(`${API}/users/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Errore server (${res.status})`); }
      if (!res.ok) throw new Error(data.error || "Errore di rete");
      return data;
    });
  },
  // Rimuove la foto profilo dell'utente autenticato
  removeAvatar: () => request("/users/me/avatar", { method: "DELETE" }),
};

// =====================================================
// Gruppo endpoint Macchine (Veicoli)
// Gestisce le macchine registrate dall'autista autenticato
// =====================================================
export const cars = {
  // Recupera tutte le macchine registrate dall'autista autenticato
  getMine: () => request("/cars"),
  // Aggiunge una nuova macchina al profilo dell'autista (marca, modello, targa, nPosti)
  add: (body) => request("/cars", { method: "POST", body: JSON.stringify(body) }),
  // Elimina una macchina tramite la sua targa (solo il proprietario può eliminarla)
  delete: (targa) => request(`/cars/${targa}`, { method: "DELETE" }),
};
