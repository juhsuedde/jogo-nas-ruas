const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "lat and lng are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=pt-BR`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") {
      return new Response(
        JSON.stringify({ error: "Geocoding failed", details: data.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const components = data.results?.[0]?.address_components || [];

    const city = components.find(
      (c: { types: string[] }) => c.types.includes("administrative_area_level_2") || c.types.includes("locality")
    )?.long_name || "";

    const state = components.find(
      (c: { types: string[] }) => c.types.includes("administrative_area_level_1")
    )?.long_name || "";

    const region = components.find(
      (c: { types: string[] }) => c.types.includes("subadministrative_area")
    )?.long_name || "";

    return new Response(
      JSON.stringify({ city, state, region }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});