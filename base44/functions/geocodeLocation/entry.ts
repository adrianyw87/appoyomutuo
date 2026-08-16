import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Geocoding libre con Nominatim (OpenStreetMap). Sin API key.
// - Si llega "address" (dirección exacta), devuelve el centro devuelto por Nominatim.
// - Si solo llega "neighborhood" (ciudad/barrio), coloca un pin pegado al
//   centro devuelto por Nominatim con una pequeña variación aleatoria,
//   para que no todos los proyectos sin dirección queden apilados.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const neighborhood = (body?.neighborhood || '').trim();
    const address = (body?.address || '').trim();
    if (!neighborhood) {
      return Response.json({ error: 'Falta el barrio' }, { status: 400 });
    }

    // Se sesga la búsqueda hacia Madrid/España cuando no hay dirección exacta,
    // para que barrios genéricos ("Centro", "Barrio Sur") no resuelvan a puntos
    // aleatorios del mundo. Con dirección exacta se busca tal cual.
    const baseContext = address ? '' : ', Madrid, Comunidad de Madrid, España';
    const parts = [address, neighborhood].filter(Boolean);
    const query = parts.join(', ') + baseContext;
    const url =
      'https://nominatim.openstreetmap.org/search?q=' +
      encodeURIComponent(query) +
      '&format=jsonv2&limit=1&addressdetails=0';

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AppoyoMutuo/1.0 (geocoding de proyectos colectivos)',
        'Accept-Language': 'es',
      },
    });

    if (!res.ok) {
      return Response.json({ lat: null, lng: null });
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return Response.json({ lat: null, lng: null });
    }

    const hit = data[0];

    // Dirección exacta → usar el centro devuelto.
    if (address) {
      return Response.json({ lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) });
    }

    // Solo ciudad/barrio → pin pegado al centro con pequeña variación aleatoria
    // (~±0.004°, unos 400 m) para evitar apilamientos exactos.
    const clat = parseFloat(hit.lat);
    const clng = parseFloat(hit.lon);
    if (isFinite(clat) && isFinite(clng)) {
      const lat = clat + (Math.random() - 0.5) * 0.008;
      const lng = clng + (Math.random() - 0.5) * 0.008;
      return Response.json({ lat, lng });
    }

    return Response.json({ lat: clat, lng: clng });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}