import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  match_city: string;
  stage: string;
  group_name: string;
  stadium: string;
  match_name: string;
  isBrazilMatch: boolean;
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, home_team, away_team, match_date, match_city, stage, group_name, stadium")
        .order("match_date", { ascending: true });
      if (error) throw error;

      return (data || []).map((m) => ({
        ...m,
        match_name: `${m.home_team} x ${m.away_team}`,
        isBrazilMatch:
          m.home_team.toLowerCase().includes("brasil") ||
          m.away_team.toLowerCase().includes("brasil"),
      }));
    },
    staleTime: 60_000,
  });
}
