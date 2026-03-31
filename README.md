# UrbanPool — Carpooling Urbano

Applicazione web full-stack per il carpooling urbano. Connette autisti e passeggeri per condividere viaggi in modo intelligente, economico e sostenibile.

## 🏗️ Tech Stack

| Layer    | Tecnologia                  |
|----------|-----------------------------|
| Frontend | React 18 + Vite             |
| Backend  | Node.js + Express           |
| Database | PostgreSQL                  |
| ORM      | Prisma                      |
| Auth     | JWT + bcrypt                |

---

## 📁 Struttura Progetto

```
carpooling/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schema database
│   │   └── seed.js            # Dati di test
│   ├── src/
│   │   ├── controllers/       # Gestione richieste HTTP
│   │   ├── routes/            # Definizione endpoint API
│   │   ├── services/          # Logica business
│   │   ├── middlewares/       # Auth JWT, autorizzazione ruoli
│   │   ├── utils/             # Prisma client singleton
│   │   └── server.js          # Entry point Express
│   ├── .env                   # Variabili d'ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, ProtectedRoute
│   │   ├── context/           # AuthContext (stato globale)
│   │   ├── pages/             # Pagine dell'app
│   │   ├── services/          # Chiamate API (api.js)
│   │   ├── App.jsx            # Router principale
│   │   ├── main.jsx           # Entry point React
│   │   └── index.css          # Stili globali
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Setup Rapido

### Prerequisiti
- Node.js >= 18
- PostgreSQL in esecuzione
- Un database creato (es. `carpooling`)

### 1. Backend

```bash
cd backend

# Installa dipendenze
npm install

# Configura il database in .env
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/carpooling"

# Genera Prisma Client e applica le migrazioni
npx prisma migrate dev --name init

# (Opzionale) Popola con dati di test
node prisma/seed.js

# Avvia il server
npm run dev
```

Il backend sarà disponibile su **http://localhost:3000**

### 2. Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia il dev server
npm run dev
```

Il frontend sarà disponibile su **http://localhost:5173**

---

## 🔌 API Endpoints

### Auth
| Metodo | Endpoint         | Descrizione          |
|--------|------------------|----------------------|
| POST   | /auth/register   | Registrazione utente |
| POST   | /auth/login      | Login (ritorna JWT)  |

### Utenti
| Metodo | Endpoint   | Auth | Descrizione       |
|--------|------------|------|-------------------|
| GET    | /users/me  | ✅   | Profilo utente    |

### Viaggi
| Metodo | Endpoint      | Auth     | Descrizione               |
|--------|---------------|----------|---------------------------|
| GET    | /trips        | ❌       | Cerca viaggi (query params)|
| GET    | /trips/:id    | ❌       | Dettaglio viaggio          |
| GET    | /trips/mine   | Autista  | I miei viaggi              |
| POST   | /trips        | Autista  | Crea viaggio               |
| PUT    | /trips/:id    | Autista  | Modifica viaggio           |
| DELETE | /trips/:id    | Autista  | Elimina viaggio            |

### Prenotazioni
| Metodo | Endpoint              | Auth       | Descrizione            |
|--------|-----------------------|------------|------------------------|
| GET    | /bookings/mine        | ✅         | Le mie prenotazioni    |
| POST   | /bookings             | Passeggero | Crea prenotazione      |
| PUT    | /bookings/:id/status  | Autista    | Accetta/rifiuta        |

### Feedback
| Metodo | Endpoint      | Auth | Descrizione        |
|--------|---------------|------|--------------------|
| POST   | /reviews      | ✅   | Lascia feedback    |
| GET    | /reviews/mine | ✅   | I miei feedback    |

### Auto
| Metodo | Endpoint       | Auth    | Descrizione    |
|--------|----------------|---------|----------------|
| GET    | /cars          | Autista | Le mie auto    |
| POST   | /cars          | Autista | Aggiungi auto  |
| DELETE | /cars/:targa   | Autista | Elimina auto   |

---

## 🧪 Account di Test (dopo seed)

| Ruolo      | Email                  | Password    |
|------------|------------------------|-------------|
| Autista    | mario.rossi@email.it   | password123 |
| Passeggero | luigi.verdi@email.it   | password123 |

---

## 🔄 Flusso End-to-End

1. **Registrazione** → L'utente sceglie ruolo (autista/passeggero) e si registra
2. **Login** → Accede con email e password, riceve JWT
3. **Crea Viaggio** → L'autista pubblica un viaggio con dettagli
4. **Cerca Viaggio** → Il passeggero cerca per città/data
5. **Prenota** → Il passeggero richiede prenotazione
6. **Accetta/Rifiuta** → L'autista gestisce le prenotazioni
7. **Feedback** → Dopo il viaggio (chiuso), entrambi lasciano una recensione
