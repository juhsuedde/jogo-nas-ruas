import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

type PendingVenue = {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  city_name: string;
  state: string;
  created_by: string;
  created_at: string;
  has_big_screen: boolean;
  has_promotion: boolean;
  has_parking: boolean;
  promotions: string | null;
  match_ids: string[];
  shows_all_matches: boolean;
};

export function useAllVenues() {
  return useQuery({
    queryKey: ["all-venues-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select(
          `id, name, address, neighborhood, city_name, state,
           sponsored, sponsored_until, created_at`,
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Falha ao carregar locais: ${error.message}`);
      return data ?? [];
    },
  });
}

export function useSetSponsoredVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      venueId,
      sponsored,
      days,
    }: {
      venueId: string;
      sponsored: boolean;
      days?: number;
    }) => {
      const updates: Record<string, unknown> = { sponsored };
      if (sponsored && days) {
        updates.sponsored_until = new Date(
          Date.now() + days * 24 * 60 * 60 * 1000,
        ).toISOString();
      } else if (!sponsored) {
        updates.sponsored_until = null;
      }
      const { error } = await supabase
        .from("venues")
        .update(updates)
        .eq("id", venueId);
      if (error) throw new Error(`Falha ao atualizar patrocínio: ${error.message}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-venues-admin"] });
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async (): Promise<boolean> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", u.user.id)
        .maybeSingle();
      return data?.is_admin ?? false;
    },
    staleTime: 60_000,
  });
}

export function usePendingVenues() {
  return useQuery({
    queryKey: ["pending-venues"],
    queryFn: async (): Promise<PendingVenue[]> => {
      const { data, error } = await supabase
        .from("venues")
        .select(
          `id, name, address, neighborhood, city_name, state,
           created_by, created_at,
           has_big_screen, has_promotion, has_parking, promotions,
           match_ids, shows_all_matches`,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Falha ao carregar pendentes: ${error.message}`);
      return (data ?? []) as PendingVenue[];
    },
  });
}

export function useModerateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      venueId,
      status,
    }: {
      venueId: string;
      status: "approved" | "rejected";
    }) => {
      const { error } = await supabase
        .from("venues")
        .update({ status })
        .eq("id", venueId);

      if (error) throw new Error(`Falha ao moderar: ${error.message}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-venues"] });
      qc.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
