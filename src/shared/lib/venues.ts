import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Venue } from "@/data/venues";

type VenueRow = {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  city_name: string;
  state: string;
  lat: number;
  lng: number;
  has_big_screen: boolean;
  has_promotion: boolean;
  has_parking: boolean;
  promotions: string | null;
  match_ids: string[];
  shows_all_matches: boolean;
  verified: boolean;
  status: string;
  rsvps?: { count: number }[];
};

function rowToVenue(r: VenueRow): Venue {
  return {
    id: r.id,
    name: r.name,
    type: "bar" as const,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    match: "",
    matchTime: "",
    isBrazilMatch: false,
    bigScreen: r.has_big_screen,
    promo: r.has_promotion ? (r.promotions ?? "Tem promoção") : undefined,
    unverified: !r.verified,
    city: r.city_name,
    phone: undefined,
    rsvps: r.rsvps?.[0]?.count ?? 0,
    neighborhood: r.neighborhood ?? undefined,
    state: r.state,
    hasBigScreen: r.has_big_screen,
    hasPromotion: r.has_promotion,
    hasParking: r.has_parking,
    matchIds: r.match_ids ?? [],
    showsAllMatches: r.shows_all_matches,
    verified: r.verified,
    status: r.status,
  };
}

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: async (): Promise<Venue[]> => {
      const { data, error } = await supabase
        .from("venues")
        .select(
          `id, name, address, neighborhood, city_name, state, lat, lng,
          has_big_screen, has_promotion, has_parking, promotions,
          match_ids, shows_all_matches, verified, status,
          created_at, rsvps(count)`,
        )
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(`Falha ao carregar locais: ${error.message}`);
      }
      if (!data || data.length === 0) {
        return [];
      }
      return (data as VenueRow[]).map((r) => rowToVenue(r));
    },
    staleTime: 30_000,
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: async (): Promise<Venue | null> => {
      const { data, error } = await supabase
        .from("venues")
        .select(
          `id, name, address, neighborhood, city_name, state, lat, lng,
          has_big_screen, has_promotion, has_parking, promotions,
          match_ids, shows_all_matches, verified, status,
          created_at, rsvps(count)`,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(`Falha ao carregar local: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return rowToVenue(data as VenueRow);
    },
  });
}

export function useMyRsvp(venueId: string) {
  return useQuery({
    queryKey: ["rsvp", venueId],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("rsvps")
        .select("id, guest_count, created_at, match_id")
        .eq("venue_id", venueId)
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data
        ? {
            going: true,
            guests: (data as unknown as { guest_count: number }).guest_count ?? 1,
            matchId: (data as unknown as { match_id: string }).match_id,
          }
        : null;
    },
  });
}

export function useToggleRsvp(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      going,
      guests,
      matchId,
    }: {
      going: boolean;
      guests: number;
      matchId?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login para confirmar presença.");
      if (going) {
        const { error } = await supabase.from("rsvps").upsert({
          venue_id: venueId,
          user_id: u.user.id,
          guest_count: guests,
          match_id: matchId ?? null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("rsvps")
          .delete()
          .eq("venue_id", venueId)
          .eq("user_id", u.user.id);
        if (error) throw error;
      }
    },
    onMutate: async ({ going }) => {
      await qc.cancelQueries({ queryKey: ["venue", venueId] });
      const previous = qc.getQueryData<Venue>(["venue", venueId]);
      if (previous) {
        qc.setQueryData<Venue>(["venue", venueId], {
          ...previous,
          rsvps: Math.max(0, previous.rsvps + (going ? 1 : -1)),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["venue", venueId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["venue", venueId] });
      qc.invalidateQueries({ queryKey: ["rsvp", venueId] });
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useAddVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      address: string;
      lat: number;
      lng: number;
      city: string;
      neighborhood?: string;
      state?: string;
      hasBigScreen: boolean;
      hasPromotion: boolean;
      hasParking: boolean;
      promotions?: string;
      matchIds?: string[];
      showsAllMatches?: boolean;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login para cadastrar um local.");

      const { error } = await supabase.from("venues").insert({
        name: input.name,
        address: input.address,
        neighborhood: input.neighborhood || null,
        city_name: input.city,
        state: input.state || "SP",
        lat: input.lat,
        lng: input.lng,
        has_big_screen: input.hasBigScreen,
        has_promotion: input.hasPromotion,
        has_parking: input.hasParking,
        promotions: input.promotions || null,
        match_ids: input.matchIds || [],
        shows_all_matches: input.showsAllMatches ?? false,
        verified: false,
        status: "pending",
        created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}
