const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const functionBase = `${url.origin}/functions/v1/google-places`;

  // GET — serve photo or static map for <img> tags
  if (req.method === "GET") {
    const placeId = url.searchParams.get("placeId");
    const type = url.searchParams.get("type") || "photo";
    if (!placeId) {
      return new Response("Missing placeId", { status: 400, headers: corsHeaders });
    }

    const fieldMask = ["id", "photos", "location"].join(",");
    const resp = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY || "",
        "X-Goog-FieldMask": fieldMask,
      },
    });

    if (!resp.ok) {
      return new Response("Failed to get place details", { status: 500, headers: corsHeaders });
    }

    const result = await resp.json();

    // type=map or no photos → serve static map
    if (type === "map" || !result.photos || result.photos.length === 0) {
      const lat = result.location?.latitude;
      const lng = result.location?.longitude;
      if (!lat || !lng) {
        return new Response("No location data", { status: 404, headers: corsHeaders });
      }
      const mapUrl =
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&scale=2&markers=color:0x2E7D32%7C${lat},${lng}&key=${GOOGLE_API_KEY}&maptype=roadmap`;
      const mapResp = await fetch(mapUrl);
      if (!mapResp.ok) {
        return new Response("Failed to fetch static map", { status: 500, headers: corsHeaders });
      }
      const contentType = mapResp.headers.get("content-type") || "image/png";
      const blob = await mapResp.arrayBuffer();
      return new Response(blob, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // type=photo → serve photo
    const photoResp = await fetch(
      `https://places.googleapis.com/v1/${result.photos[0].name}/media?maxWidthPx=400`,
      {
        headers: { "X-Goog-Api-Key": GOOGLE_API_KEY || "" },
      },
    );

    if (!photoResp.ok) {
      return new Response("Failed to fetch photo", { status: 500, headers: corsHeaders });
    }

    const contentType = photoResp.headers.get("content-type") || "image/jpeg";
    const blob = await photoResp.arrayBuffer();

    return new Response(blob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // POST — search / details
  try {
    const body = await req.json();
    const { action, query, placeId, lat, lng, radius = 5000, locationBias } = body;

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
            center: { latitude: Number(lat), longitude: Number(lng) },
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
      const places = (data.places || []).map(
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
      );

      return new Response(JSON.stringify({ places }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

      // Build photo URL (photo or static map proxy)
      let photoUrl: string | undefined;
      if (result.photos && result.photos.length > 0) {
        photoUrl = `${functionBase}?placeId=${placeId}&type=photo`;
      } else if (result.location?.latitude && result.location?.longitude) {
        photoUrl = `${functionBase}?placeId=${placeId}&type=map`;
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
