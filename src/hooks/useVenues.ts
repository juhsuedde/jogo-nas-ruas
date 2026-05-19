import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  bigScreen: boolean;
  hasPromotion: boolean;
  hasParking: boolean;
  isBrazilMatch: boolean;
  match?: string;
  googlePlaceId?: string;
  created_at?: string;
  created_by?: string;
}

const VENUES_KEY = "venues";

async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createVenue(venue: Omit<Venue, "id" | "created_at">): Promise<Venue> {
  const { data, error } = await supabase
    .from("venues")
    .insert(venue)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useVenues() {
  return useQuery({
    queryKey: [VENUES_KEY],
    queryFn: fetchVenues,
    staleTime: 30 * 1000,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUES_KEY] });
    },
  });
}