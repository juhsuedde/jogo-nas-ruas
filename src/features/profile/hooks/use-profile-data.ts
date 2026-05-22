import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";

export interface ProfileUpcomingMatch {
  id: string;
  teams: string;
  time: string;
  venue: string;
  venueId: string;
  flag: string;
  guests: number;
}

export interface ProfileHistoryMatch {
  id: string;
  teams: string;
  date: string;
  venue: string;
  venueId: string;
  score: string;
}

export interface ProfileVenue {
  id: string;
  name: string;
  address: string;
  verified: boolean;
  rsvps: number;
}

export interface ProfileStats {
  jogos: number;
  bares: number;
  confirmados: number;
}

export interface ProfileData {
  stats: ProfileStats;
  upcoming: ProfileUpcomingMatch[];
  history: ProfileHistoryMatch[];
  myVenues: ProfileVenue[];
}

async function fetchProfileData(): Promise<ProfileData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      stats: { jogos: 0, bares: 0, confirmados: 0 },
      upcoming: [],
      history: [],
      myVenues: [],
    };
  }

  const [rsvpsResult, venuesResult, matchesResult, venueCountResult] = await Promise.all([
    supabase
      .from("rsvps")
      .select(
        `id, guest_count, created_at, match_id,
        venue:venues(id, name, address, city_name, has_big_screen)`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("venues")
      .select("id, name, address, verified")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("matches")
      .select("id, home_team, away_team, match_date, match_city")
      .order("match_date", { ascending: true }),

    supabase.rpc("get_all_venue_rsvp_counts"),
  ]);

  if (rsvpsResult.error) throw rsvpsResult.error;
  if (venuesResult.error) throw venuesResult.error;
  if (matchesResult.error) throw matchesResult.error;

  const rsvps = rsvpsResult.data || [];
  const venuesCreated = venuesResult.data || [];
  const matches = matchesResult.data || [];
  const countMap = new Map(
    (venueCountResult.data ?? []).map((r: { venue_id: string; count: number }) => [r.venue_id, r.count]),
  );

  const venueList = venuesCreated.map((v) => ({
    ...v,
    rsvps: countMap.get(v.id) ?? 0,
  }));

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const upcoming: ProfileUpcomingMatch[] = [];
  const history: ProfileHistoryMatch[] = [];

  for (const r of rsvps) {
    if (!r.venue) continue;

    const match = r.match_id ? matchMap.get(r.match_id) : null;

    if (!match) continue;

    const matchTime = new Date(match.match_date);
    const isPast = matchTime < new Date();
    const flag = match.home_team === "Brasil" || match.away_team === "Brasil" ? "🇧🇷" : "🌎";
    const teams = `${match.home_team} x ${match.away_team}`;

    if (isPast) {
      history.push({
        id: r.id,
        teams,
        date: matchTime.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
        venue: r.venue.name,
        venueId: r.venue.id,
        score: "-",
      });
    } else {
      const timeStr = matchTime
        .toLocaleDateString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" })
        .replace(".", "");

      upcoming.push({
        id: r.id,
        teams,
        time: timeStr,
        venue: r.venue.name,
        venueId: r.venue.id,
        flag,
        guests: r.guest_count || 1,
      });
    }
  }

  upcoming.sort((a, b) => {
    const rsvpA = rsvps.find((r) => r.id === a.id);
    const rsvpB = rsvps.find((r) => r.id === b.id);
    const mA = rsvpA?.match_id ? matchMap.get(rsvpA.match_id) : null;
    const mB = rsvpB?.match_id ? matchMap.get(rsvpB.match_id) : null;
    return new Date(mA?.match_date ?? 0).getTime() - new Date(mB?.match_date ?? 0).getTime();
  });

  history.sort((a, b) => {
    const rsvpA = rsvps.find((r) => r.id === a.id);
    const rsvpB = rsvps.find((r) => r.id === b.id);
    const mA = rsvpA?.match_id ? matchMap.get(rsvpA.match_id) : null;
    const mB = rsvpB?.match_id ? matchMap.get(rsvpB.match_id) : null;
    return new Date(mB?.match_date ?? 0).getTime() - new Date(mA?.match_date ?? 0).getTime();
  });

  const myVenues: ProfileVenue[] = venueList.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    verified: v.verified ?? false,
    rsvps: v.rsvps,
  }));

  const confirmedCount = rsvps.reduce((acc, r) => acc + (r.guest_count || 1), 0);
  const pastGamesCount = history.length;

  return {
    stats: {
      jogos: pastGamesCount,
      bares: venueList.length,
      confirmados: confirmedCount,
    },
    upcoming,
    history,
    myVenues,
  };
}

export function useProfileData() {
  return useQuery({
    queryKey: ["profile-data"],
    queryFn: fetchProfileData,
    staleTime: 30_000,
  });
}
