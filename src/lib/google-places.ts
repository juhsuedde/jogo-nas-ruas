export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  photoUrl?: string;
  types: string[];
}

const API_KEY = "AIzaSyD8B54EB1MHrHB_fb8HfDznGjwE89B_6B8";

export async function searchPlaces(query: string): Promise<GooglePlace[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query,
      )}&types=establishment&components=country:br&key=${API_KEY}`,
    );

    if (!response.ok) {
      throw new Error("API error");
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status);
      return [];
    }

    return data.predictions.map(
      (p: {
        place_id: string;
        description: string;
        structured_formatting: { main_text: string; secondary_text: string };
        types: string[];
      }) => ({
        place_id: p.place_id,
        name: p.structured_formatting.main_text,
        formatted_address: p.description,
        lat: 0,
        lng: 0,
        types: p.types || [],
      }),
    );
  } catch (error) {
    console.error("Google Places search error:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,website,rating,photos&key=${API_KEY}`,
    );

    if (!response.ok) {
      throw new Error("API error");
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.result) {
      console.error("Google Places details error:", data.status);
      return null;
    }

    const result = data.result;
    const lat = result.geometry?.location?.lat || 0;
    const lng = result.geometry?.location?.lng || 0;

    let photoUrl: string | undefined;
    if (result.photos && result.photos.length > 0) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${result.photos[0].photo_reference}&key=${API_KEY}`;
    }

    return {
      place_id: placeId,
      name: result.name || "",
      formatted_address: result.formatted_address || "",
      lat,
      lng,
      phone: result.formatted_phone_number,
      website: result.website,
      rating: result.rating,
      photoUrl,
      types: result.types || [],
    };
  } catch (error) {
    console.error("Google Places details error:", error);
    return null;
  }
}
