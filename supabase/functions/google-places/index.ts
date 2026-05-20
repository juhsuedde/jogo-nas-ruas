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
    const body = await req.json();
    const { action, query, placeId, lat, lng, radius = 5000, locationBias } = body;

    // SEARCH ACTION
    if (action === "search") {
      if (!query) {
        return new Response(JSON.stringify({ error: "Query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const searchBody: Record<string, unknown> = {
        textQuery: query,
        includedType: "bar",
        pageSize: 5,
        languageCode: "pt-BR",
        regionCode: "BR",
        rankPreference: "DISTANCE",
      };

      const effectiveRadius = locationBias?.circle?.radius || radius || 5000;

      if (locationBias) {
        searchBody.locationBias = locationBias;
      } else if (lat && lng) {
        searchBody.locationBias = {
          circle: {
            center: {
              latitude: Number(lat),
              longitude: Number(lng),
            },
            radius: Number(effectiveRadius),
          },
        };
      }

      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY || "",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types",
        },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Places API error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch from Google Places", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();

      const places =
        data.places?.map(
          (place: {
            id: string;
            displayName?: { text: string };
            formattedAddress?: string;
            location?: { latitude: number; longitude: number };
            types?: string[];
          }) => ({
            place_id: place.id,
            name: place.displayName?.text || "",
            formatted_address: place.formattedAddress || "",
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0,
            types: place.types || [],
          }),
        ) || [];

      return new Response(JSON.stringify({ places }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DETAILS ACTION
    if (action === "details") {
      if (!placeId) {
        return new Response(JSON.stringify({ error: "placeId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fieldMask = [
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "rating",
        "photos",
        "websiteUri",
        "types",
      ].join(",");

      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          "X-Goog-Api-Key": GOOGLE_API_KEY || "",
          "X-Goog-FieldMask": fieldMask,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Places Details API error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch place details", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const result = await response.json();

      let photoUrl: string | undefined;
      if (result.photos && result.photos.length > 0) {
        photoUrl = `https://places.googleapis.com/v1/${result.photos[0].name}/media?maxWidth=400&key=${GOOGLE_API_KEY}`;
      }

      const place = {
        place_id: result.id,
        name: result.displayName?.text || "",
        formatted_address: result.formattedAddress || "",
        lat: result.location?.latitude || 0,
        lng: result.location?.longitude || 0,
        website: result.websiteUri || "",
        rating: result.rating,
        photoUrl,
        types: result.types || [],
      };

      return new Response(JSON.stringify({ place }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'search' or 'details'." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
