import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

async function geocode(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&accept-language=it`;
  const res = await fetch(url, { headers: { "User-Agent": "UrbanPool/1.0" } });
  const data = await res.json();
  if (!data.length) throw new Error(`Città non trovata: "${city}"`);
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function getRoute(waypoints) {
  const coords = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) throw new Error("Percorso non trovato");
  const route = data.routes[0];
  return {
    coordinates: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm:  (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
  };
}

/**
 * TripMap — mappa Leaflet con routing reale e supporto tappe intermedie.
 *
 * Ritorna null quando le città non sono ancora inserite, così il div
 * esiste nel DOM solo quando serve e Leaflet non riceve un container a 0px.
 *
 * Props:
 *   from   {string}    Città di partenza
 *   to     {string}    Città di destinazione
 *   tappe  {string[]}  Tappe intermedie (opzionale)
 *   onInfo {Function}  Callback: riceve { distanceKm, durationMin }
 */
export default function TripMap({ from, to, tappe = [], onInfo }) {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);
  const [info,   setInfo]   = useState(null);
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");

  const hasCities =
    (from?.trim()?.length ?? 0) >= 2 &&
    (to?.trim()?.length  ?? 0) >= 2;

  // Effect unico: init Leaflet → geocoding → routing, tutto in sequenza.
  // Si ri-esegue quando cambiano from, to o tappe.
  // Il componente esiste nel DOM solo quando hasCities è true (return null sotto),
  // quindi il div è sempre disponibile e ha dimensioni reali quando l'effect gira.
  useEffect(() => {
    if (!hasCities) return;

    let cancelled = false;
    setStatus("loading");
    setErrMsg("");
    setInfo(null);

    (async () => {
      try {
        /* ── 1. Carica Leaflet ── */
        const L = (await import("leaflet")).default;
        if (cancelled) return;

        /* ── 2. Inizializza la mappa (solo se non già fatto) ── */
        if (!mapRef.current && mapDivRef.current) {
          const map = L.map(mapDivRef.current, {
            center: [41.9, 12.5],
            zoom: 6,
            zoomControl: true,
            attributionControl: false,
          });
          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            { maxZoom: 19 }
          ).addTo(map);
          mapRef.current = map;
        }
        if (cancelled || !mapRef.current) return;

        /* ── 3. Geocodifica tutti i punti ── */
        const validTappe = tappe.filter(s => s?.trim().length > 0);
        const allCities  = [from.trim(), ...validTappe, to.trim()];
        const coords     = await Promise.all(allCities.map(geocode));
        if (cancelled) return;

        /* ── 4. Calcola percorso stradale ── */
        const { coordinates, distanceKm, durationMin } = await getRoute(coords);
        if (cancelled) return;

        /* ── 5. Aggiorna la mappa ── */
        const map = mapRef.current;
        map.eachLayer(layer => { if (layer._tripRoute) map.removeLayer(layer); });

        const makeDot = (color, size = 13) => L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const poly = L.polyline(coordinates, { color: "#3d8bfd", weight: 4, opacity: 0.9 }).addTo(map);
        poly._tripRoute = true;

        // Marker partenza (verde) e destinazione (rosso)
        [
          L.marker(coords[0],                { icon: makeDot("#34d399", 14) }),
          L.marker(coords[coords.length - 1], { icon: makeDot("#f87171", 14) }),
        ].forEach(m => { m._tripRoute = true; m.addTo(map); });

        // Marker tappe intermedie (gialli, più piccoli)
        coords.slice(1, -1).forEach(c => {
          const m = L.marker(c, { icon: makeDot("#fbbf24", 10) }).addTo(map);
          m._tripRoute = true;
        });

        map.invalidateSize();
        map.fitBounds(poly.getBounds(), { padding: [40, 40], animate: true });

        setInfo({ distanceKm, durationMin });
        setStatus("ok");
        onInfo?.({ distanceKm, durationMin });

      } catch (err) {
        if (!cancelled) { setStatus("error"); setErrMsg(err.message); }
      }
    })();

    return () => { cancelled = true; };
  }, [from, to, JSON.stringify(tappe)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup: rimuove la mappa quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Niente da mostrare finché le città non sono inserite
  if (!hasCities) return null;

  return (
    <div className="trip-map-wrap">
      {/* Barra info */}
      <div className="trip-map-info">
        <span className="trip-map-stat">
          <span className="trip-map-dot" style={{ background: "#34d399" }} />
          {from}
        </span>

        {tappe.filter(s => s?.trim()).map((tappa, i) => (
          <span key={i} className="trip-map-stat">
            <span className="trip-map-arrow">→</span>
            <span className="trip-map-dot" style={{ background: "#fbbf24" }} />
            {tappa}
          </span>
        ))}

        <span className="trip-map-arrow">→</span>
        <span className="trip-map-stat">
          <span className="trip-map-dot" style={{ background: "#f87171" }} />
          {to}
        </span>

        <div className="trip-map-numbers">
          {status === "loading" && <span style={{ color: "var(--text-dim)" }}>Calcolo percorso...</span>}
          {status === "error"   && <span style={{ color: "var(--danger)" }}>{errMsg}</span>}
          {status === "ok" && info && (
            <><span>📍 {info.distanceKm} km</span><span>⏱ {info.durationMin} min</span></>
          )}
        </div>
      </div>

      {/* Contenitore mappa */}
      <div ref={mapDivRef} className="trip-map" />
    </div>
  );
}
