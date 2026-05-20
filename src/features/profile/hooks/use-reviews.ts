import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useVenueReviews(venueId: string) {
  return useQuery({
    queryKey: ["reviews", venueId],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useMyReviewForVenue(venueId: string) {
  return useQuery({
    queryKey: ["my-review", venueId],
    queryFn: async (): Promise<Review | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", venueId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      venueId,
      rating,
      comment,
    }: {
      venueId: string;
      rating: number;
      comment?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Faça login para avaliar");
      const { error } = await supabase.from("reviews").upsert(
        {
          venue_id: venueId,
          user_id: user.id,
          rating,
          comment: comment || null,
        },
        { onConflict: "venue_id,user_id" },
      );
      if (error) throw error;
    },
    onSuccess: (_vars, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.venueId] });
      qc.invalidateQueries({ queryKey: ["my-review", vars.venueId] });
      qc.invalidateQueries({ queryKey: ["profile-data"] });
    },
  });
}
