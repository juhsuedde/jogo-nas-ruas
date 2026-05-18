// supabase/functions/google-places/index.ts
// CORRIGIDO: usa handler padrão em vez de serve()

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handler padrão do Supabase Edge Functions (novo runtime)
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, lat, lng, radius = 5000 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchBody: Record<string, unknown> = {
      textQuery: query,
      includedType: "bar",
      pageSize: 5,
      languageCode: "pt-BR",
      regionCode: "BR",
    };

    if (lat && lng) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Number(radius),
        },
      };
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY || "",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types",
        },
        body: JSON.stringify(searchBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Google Places", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    const places =
      data.places?.map((place: { id: string; displayName?: { text: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; types?: string[] }) => ({
        place_id: place.id,
        name: place.displayName?.text || "",
        formatted_address: place.formattedAddress || "",
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
        types: place.types || [],
      })) || [];

    return new Response(
      JSON.stringify({ places }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});