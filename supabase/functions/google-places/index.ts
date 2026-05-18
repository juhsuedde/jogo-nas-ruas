// supabase/functions/google-places/index.ts
// Proxy para Google Places API (New) - evita CORS no frontend

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!GOOGLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "API key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { action, query, placeId } = await req.json();

    if (action === "search") {
      if (!query || query.length < 2) {
        return new Response(JSON.stringify({ places: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
        },
        body: JSON.stringify({
          textQuery: query,
          filter: "type:establishment",
          languageCode: "pt-BR",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return new Response(JSON.stringify({ error: errorData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();

      const places = (data.places || []).map((p: {
        id: string;
        displayName: { text: string };
        formattedAddress: string;
        location: { latitude: number; longitude: number };
        types: string[];
      }) => ({
        place_id: p.id,
        name: p.displayName?.text || "",
        formatted_address: p.formattedAddress || "",
        lat: p.location?.latitude || 0,
        lng: p.location?.longitude || 0,
        types: p.types || [],
      }));

      return new Response(JSON.stringify({ places }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details" && placeId) {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,formattedPhoneNumber,website,rating,photos&key=${GOOGLE_API_KEY}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        return new Response(JSON.stringify({ error: errorData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();

      let photoUrl: string | undefined;
      if (result.photos && result.photos.length > 0) {
        photoUrl = `https://places.googleapis.com/v1/${result.photos[0].name}/media?maxWidth=400&key=${GOOGLE_API_KEY}`;
      }

      const place = {
        place_id: result.id || placeId,
        name: result.displayName?.text || "",
        formatted_address: result.formattedAddress || "",
        lat: result.location?.latitude || 0,
        lng: result.location?.longitude || 0,
        phone: result.formattedPhoneNumber,
        website: result.website,
        rating: result.rating,
        photoUrl,
        types: result.types || [],
      };

      return new Response(JSON.stringify({ place }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});