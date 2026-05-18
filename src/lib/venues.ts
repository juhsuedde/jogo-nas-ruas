import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Venue } from "@/data/venues";
import { VENUES as MOCK_VENUES } from "@/data/venues";

type VenueRow = {
  id: string;
  name: string;
  type: "bar" | "restaurante" | "praça";
  address: string;
  lat: number;
  lng: number;
  match: string;
  match_time: string;
  is_brazil_match: boolean;
  big_screen: boolean;
  promo: string | null;
  unverified: boolean | null;
  city: string;
  phone: string | null;
};

function rowToVenue(r: VenueRow, rsvpCount: number): Venue {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    match: r.match,
    matchTime: r.match_time,
    isBrazilMatch: r.is_brazil_match,
    bigScreen: r.big_screen,
    promo: r.promo ?? undefined,
    unverified: r.unverified ?? false,
    city: r.city,
    phone: r.phone ?? undefined,
    rsvps: rsvpCount,
  };
}

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: async (): Promise<Venue[]> => {
      const { data, error } = await supabase
        .from("venues")
        .select("*, rsvps(guests)")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[venues] falling back to mocks:", error.message);
        return MOCK_VENUES;
      }
      if (!data || data.length === 0) return MOCK_VENUES;
      return (data as (VenueRow & { rsvps: { guests: number }[] })[]).map((r) =>
        rowToVenue(r, r.rsvps?.reduce((a, b) => a + (b.guests ?? 1), 0) ?? 0),
      );
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
        .select("*, rsvps(guests)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        return MOCK_VENUES.find((v) => v.id === id) ?? null;
      }
      const row = data as VenueRow & { rsvps: { guests: number }[] };
      return rowToVenue(row, row.rsvps?.reduce((a, b) => a + (b.guests ?? 1), 0) ?? 0);
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
        .select("guests")
        .eq("venue_id", venueId)
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data ?? null;
    },
  });
}

export function useToggleRsvp(venueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ going, guests }: { going: boolean; guests: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login para confirmar presença.");
      if (going) {
        const { error } = await supabase
          .from("rsvps")
          .upsert(
            { venue_id: venueId, user_id: u.user.id, guests },
            { onConflict: "venue_id,user_id" },
          );
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
    onSuccess: () => {
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
      phone?: string;
      lat: number;
      lng: number;
      city: string;
      match: string;
      matchTime: string;
      isBrazilMatch: boolean;
      bigScreen: boolean;
      promo?: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Faça login para cadastrar um local.");
      const { error } = await supabase.from("venues").insert({
        name: input.name,
        type: "bar",
        address: input.address,
        phone: input.phone,
        lat: input.lat,
        lng: input.lng,
        city: input.city,
        match: input.match,
        match_time: input.matchTime,
        is_brazil_match: input.isBrazilMatch,
        big_screen: input.bigScreen,
        promo: input.promo,
        unverified: true,
        created_by: u.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["venues"] }),
  });
}
