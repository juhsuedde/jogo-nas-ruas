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

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY || "",
          "X-Goog-FieldMask": "places.formattedAddress,places.addressComponents",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 100,
            },
          },
          maxResultCount: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Places API", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const place = data.places?.[0];

    if (!place) {
      return new Response(
        JSON.stringify({ city: "Localização desconhecida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cityComponent = place.addressComponents?.find(
      (c: any) =>
        c.types?.includes("locality") ||
        c.types?.includes("administrative_area_level_2")
    );

    const stateComponent = place.addressComponents?.find(
      (c: any) => c.types?.includes("administrative_area_level_1")
    );

    let city = cityComponent?.longText || cityComponent?.shortText || "";
    const state = stateComponent?.longText || stateComponent?.shortText || "";

    // Se não achou cidade, tenta extrair do formattedAddress
    if (!city && place.formattedAddress) {
      const parts = place.formattedAddress.split(",");
      city = parts[parts.length - 1]?.trim() || "Cidade desconhecida";
    }

    // Mostra só a cidade (mais limpo para UI)
    const cityDisplay = city || "Cidade desconhecida";

    return new Response(
      JSON.stringify({ city: cityDisplay }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});