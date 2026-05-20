import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Venue } from "@/data/venues";

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
        .select("*, rsvps(count)")
        .order("created_at", { ascending: false });
      if (error) {
        throw new Error(`Falha ao carregar locais: ${error.message}`);
      }
      // ✅ FIX: retorna [] em vez de throw quando banco está vazio
      if (!data || data.length === 0) {
        return [];
      }
      return (data as (VenueRow & { rsvps: { count: number }[] })[]).map((r) =>
        rowToVenue(r, r.rsvps?.[0]?.count ?? 0),
      );
    },
    staleTime: 30_000,
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: async (): Promise<Venue> => {
      const { data, error } = await supabase
        .from("venues")
        .select("*, rsvps(count)")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw new Error(`Falha ao carregar local: ${error.message}`);
      }
      if (!data) {
        throw new Error(`Local com ID ${id} não encontrado.`);
      }
      const row = data as VenueRow & { rsvps: { count: number }[] };
      return rowToVenue(row, row.rsvps?.[0]?.count ?? 0);
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
        .select("*")
        .eq("venue_id", venueId)
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data ? { going: true, guests: (data as { guests?: number }).guests ?? 1 } : null;
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
