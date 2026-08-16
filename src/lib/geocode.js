/**
 * Geocoding con Nominatim (OpenStreetMap). Sin API key.
 * Usado como fallback cuando la Edge Function no está desplegada.
 */
export async function geocodeLocation({ neighborhood, address } = {}) {
  const barrio = String(neighborhood || "").trim();
  const dir = String(address || "").trim();
  if (!barrio && !dir) return { lat: null, lng: null };

  const baseContext = ", Madrid, Comunidad de Madrid, España";
  const query = dir
    ? `${dir}, ${barrio}${barrio.toLowerCase().includes("madrid") ? "" : baseContext}`
    : `${barrio}${baseContext}`;

  const url =
    "https://nominatim.openstreetmap.org/search?q=" +
    encodeURIComponent(query) +
    "&format=jsonv2&limit=1&addressdetails=0&countrycodes=es";

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "es",
    },
  });
  if (!res.ok) return { lat: null, lng: null };

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    // Reintento solo con barrio + Madrid
    if (dir && barrio) {
      return geocodeLocation({ neighborhood: barrio, address: "" });
    }
    return { lat: null, lng: null };
  }

  const hit = data[0];
  const clat = parseFloat(hit.lat);
  const clng = parseFloat(hit.lon);
  if (!Number.isFinite(clat) || !Number.isFinite(clng)) {
    return { lat: null, lng: null };
  }

  if (dir) {
    return { lat: clat, lng: clng };
  }

  // Solo barrio: pequeña variación para no apilar pines
  return {
    lat: clat + (Math.random() - 0.5) * 0.008,
    lng: clng + (Math.random() - 0.5) * 0.008,
  };
}

/** Intenta Edge Function y, si falla, Nominatim en el navegador. */
export async function resolveProjectCoords(invokeFn, { neighborhood, address }) {
  try {
    if (typeof invokeFn === "function") {
      const geoRes = await invokeFn("geocodeLocation", { neighborhood, address });
      const d = geoRes?.data;
      if (d && d.lat != null && d.lng != null && Number.isFinite(Number(d.lat))) {
        return { lat: Number(d.lat), lng: Number(d.lng) };
      }
    }
  } catch {
    /* fallback below */
  }
  try {
    return await geocodeLocation({ neighborhood, address });
  } catch {
    return { lat: null, lng: null };
  }
}
