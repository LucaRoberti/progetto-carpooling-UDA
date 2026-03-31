// Importa il sistema di routing di React Router DOM
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Importa il provider del contesto di autenticazione globale
import { AuthProvider } from "./context/AuthContext";
// Importa i componenti comuni presenti in tutte le pagine
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
// Importa tutte le pagine dell'applicazione
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchTrips from "./pages/SearchTrips";
import TripDetails from "./pages/TripDetails";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import EditTrip from "./pages/EditTrip";
import MyBookings from "./pages/MyBookings";
import MyCars from "./pages/MyCars";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

/**
 * Componente radice dell'applicazione.
 * Configura il sistema di routing e avvolge tutta l'app con:
 *   - BrowserRouter: gestione della navigazione tramite URL del browser
 *   - AuthProvider: fornisce a tutti i componenti lo stato di autenticazione
 *     (utente loggato, ruolo, funzioni login/logout/register)
 *
 * Le route sono divise in:
 *   - Pubbliche: accessibili da tutti (home, login, registrazione, ricerca)
 *   - Protette generiche: richiedono solo il login (prenotazioni, profilo)
 *   - Protette per ruolo: richiedono login + ruolo specifico (es. solo autisti)
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider rende disponibile il contesto di autenticazione a tutta l'app */}
      <AuthProvider>
        {/* Navbar è sempre visibile in cima a tutte le pagine */}
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Route pubblica: pagina principale */}
            <Route path="/" element={<Home />} />

            {/* Route pubblica: form di login */}
            <Route path="/login" element={<Login />} />

            {/* Route pubblica: form di registrazione (autista o passeggero) */}
            <Route path="/register" element={<Register />} />

            {/* Route pubblica: ricerca viaggi con filtri */}
            <Route path="/search" element={<SearchTrips />} />

            {/* Route protetta solo per autisti: creazione di un nuovo viaggio */}
            <Route
              path="/trips/create"
              element={
                <ProtectedRoute allowedRoles={["autista"]}>
                  <CreateTrip />
                </ProtectedRoute>
              }
            />

            {/* Route protetta solo per autisti: lista dei propri viaggi pubblicati */}
            <Route
              path="/trips/mine"
              element={
                <ProtectedRoute allowedRoles={["autista"]}>
                  <MyTrips />
                </ProtectedRoute>
              }
            />

            {/* Route protetta solo per autisti: modifica di un viaggio esistente */}
            <Route
              path="/trips/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["autista"]}>
                  <EditTrip />
                </ProtectedRoute>
              }
            />

            {/* Route pubblica: dettaglio di un singolo viaggio (visibile a tutti) */}
            <Route path="/trips/:id" element={<TripDetails />} />

            {/* Route protetta (qualsiasi ruolo): profilo pubblico di un utente tramite CF */}
            <Route
              path="/users/:cf"
              element={
                <ProtectedRoute>
                  <PublicProfile />
                </ProtectedRoute>
              }
            />

            {/* Route protetta (qualsiasi ruolo): lista prenotazioni dell'utente */}
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            {/* Route protetta solo per autisti: gestione delle proprie macchine */}
            <Route
              path="/cars"
              element={
                <ProtectedRoute allowedRoles={["autista"]}>
                  <MyCars />
                </ProtectedRoute>
              }
            />

            {/* Route protetta (qualsiasi ruolo): profilo privato dell'utente loggato */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
