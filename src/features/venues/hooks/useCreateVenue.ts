import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

interface VenueInput {
  name: string;
  address: {
    title: string;
    subtitle: string;
    lat: number;
    lng: number;
  };
  perks: string[];
  matches: string[];
  googlePlaceId: string;
}

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venue: VenueInput) => {
      console.log("[useCreateVenue] Starting insert for:", venue.name);

      const { data, error } = await supabase
        .from("venues")
        .insert({
          name: venue.name,
          type: "bar",
          address: venue.address.title + ", " + venue.address.subtitle,
          lat: venue.address.lat || 0,
          lng: venue.address.lng || 0,
          city: "",
          match: venue.matches[0] || "",
          match_time: "",
          is_brazil_match: venue.matches.some((m) => m.includes("bra")),
          big_screen: venue.perks.includes("big-screen"),
          promo: venue.perks.includes("promo") ? "Promoção disponível" : null,
          unverified: true,
        })
        .select()
        .single();

      if (error) {
        console.error("[useCreateVenue] Insert error:", error);
        throw error;
      }

      console.log("[useCreateVenue] Insert success:", data);
      return data;
    },
    onSuccess: () => {
      console.log("[useCreateVenue] Invalidating venues cache");
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}