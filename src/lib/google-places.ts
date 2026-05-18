import { supabase } from "@/lib/supabase";

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

export async function searchPlaces(query: string): Promise<GooglePlace[]> {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase.functions.invoke("google-places", {
      body: { action: "search", query },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return [];
    }

    if (!data?.places) {
      return [];
    }

    return data.places;
  } catch (error) {
    console.error("Google Places search error:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  try {
    const { data, error } = await supabase.functions.invoke("google-places", {
      body: { action: "details", placeId },
    });

    if (error) {
      console.error("Supabase function error:", error);
      return null;
    }

    if (!data?.place) {
      return null;
    }

    return data.place;
  } catch (error) {
    console.error("Google Places details error:", error);
    return null;
  }
}