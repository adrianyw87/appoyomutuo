import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { areaMeta, statusMeta } from "@/lib/appData";

function makeIcon(color) {
  const html = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0.75C7.58 0.75 0.75 7.58 0.75 16c0 10.4 15.25 22.6 15.25 22.6S31.25 26.4 31.25 16C31.25 7.58 24.42 0.75 16 0.75z" fill="${color}" stroke="#1C2859" stroke-width="2.2"/>
      <circle cx="16" cy="16" r="5.6" fill="#ffffff"/>
    </svg>`;
  return L.divIcon({
    html,
    className: "am-pin",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

export default function MapView({ projects }) {
  const mapped = useMemo(
    () => projects.filter((p) => p.lat != null && p.lng != null && isFinite(p.lat) && isFinite(p.lng)),
    [projects]
  );
  const points = useMemo(() => mapped.map((p) => [p.lat, p.lng]), [mapped]);

  return (
    <div className="h-[60vh] sm:h-[68vh] rounded-lg overflow-hidden border border-border piece-cut">
      <MapContainer
        center={[40.42, -3.7]}
        zoom={11}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: "hsl(var(--background))" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <FitBounds points={points} />
        {mapped.map((p) => {
          const area = areaMeta(p.area);
          const meta = statusMeta(p.status);
          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={makeIcon(area.color)}>
              <Popup>
                <div className="space-y-1" style={{ minWidth: 180 }}>
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide" style={{ color: area.color }}>
                    {meta.label}
                  </p>
                  <p className="font-semibold text-sm" style={{ color: "#1C2859" }}>{p.title}</p>
                  {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                  <Link
                    to={`/proyectos/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium pt-1"
                    style={{ color: "#1C2859" }}
                  >
                    Ver proyecto →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}