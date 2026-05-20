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

    if (lat === undefined || lng === undefined) {
      return new Response(JSON.stringify({ error: "lat and lng are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usar a Geocoding API para reverse geocoding
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR&key=${GOOGLE_API_KEY}`;

    const response = await fetch(geocodeUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Geocoding API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Geocoding API", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
      return new Response(JSON.stringify({ city: "Localização desconhecida" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = data.results[0];
    const components = result.address_components;

    // Encontrar cidade (locality) ou sub-região (administrative_area_level_2)
    const cityComponent = components?.find(
      (c: any) => c.types?.includes("locality") || c.types?.includes("administrative_area_level_2"),
    );

    // Encontrar estado (administrative_area_level_1)
    const stateComponent = components?.find((c: any) =>
      c.types?.includes("administrative_area_level_1"),
    );

    // Encontrar país
    const countryComponent = components?.find((c: any) => c.types?.includes("country"));

    let city = cityComponent?.long_name || "";
    const state = stateComponent?.short_name || "";
    const country = countryComponent?.long_name || "";

    // Se não achou cidade, tentar usar sublocality
    if (!city) {
      const subLocality = components?.find((c: any) => c.types?.includes("sublocality"));
      city = subLocality?.long_name || "";
    }

    // Se ainda não achou, usar o primeiro resultado do formatted address
    if (!city && result.formatted_address) {
      const parts = result.formatted_address.split(",");
      city = parts[0]?.trim() || "Cidade desconhecida";
    }

    // Retornar cidade e estado
    const cityDisplay = city || "Cidade desconhecida";

    return new Response(
      JSON.stringify({
        city: cityDisplay,
        state,
        country,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
