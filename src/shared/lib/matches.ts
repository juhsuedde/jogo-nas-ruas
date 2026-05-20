import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

export interface Match {
  id: string;
  match_name: string;
  match_date: string;
  match_city: string;
  is_brazil: boolean;
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, match_name, match_date, match_city, is_brazil")
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}
