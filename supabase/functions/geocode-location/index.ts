// Geocoding con Nominatim (OpenStreetMap). Sin API key.
// Deploy: supabase functions deploy geocode-location

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const neighborhood = String(body?.neighborhood || "").trim();
    const address = String(body?.address || "").trim();
    if (!neighborhood) {
      return Response.json({ error: "Falta el barrio" }, { status: 400, headers: corsHeaders });
    }

    const baseContext = address ? "" : ", Madrid, Comunidad de Madrid, España";
    const query = [address, neighborhood].filter(Boolean).join(", ") + baseContext;
    const url =
      "https://nominatim.openstreetmap.org/search?q=" +
      encodeURIComponent(query) +
      "&format=jsonv2&limit=1&addressdetails=0";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AppoyoMutuo/1.0 (geocoding de proyectos colectivos)",
        "Accept-Language": "es",
      },
    });

    if (!res.ok) {
      return Response.json({ lat: null, lng: null }, { headers: corsHeaders });
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return Response.json({ lat: null, lng: null }, { headers: corsHeaders });
    }

    const hit = data[0];
    if (address) {
      return Response.json(
        { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) },
        { headers: corsHeaders }
      );
    }

    const clat = parseFloat(hit.lat);
    const clng = parseFloat(hit.lon);
    if (Number.isFinite(clat) && Number.isFinite(clng)) {
      return Response.json(
        {
          lat: clat + (Math.random() - 0.5) * 0.008,
          lng: clng + (Math.random() - 0.5) * 0.008,
        },
        { headers: corsHeaders }
      );
    }

    return Response.json({ lat: clat, lng: clng }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error?.message || "geocode failed" },
      { status: 500, headers: corsHeaders }
    );
  }
});
