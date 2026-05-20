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
    throw new Error("Usuário não autenticado");
  }

  const now = new Date().toISOString();

  const [rsvpsResult, venuesResult] = await Promise.all([
    supabase
      .from("rsvps")
      .select(
        `
        id,
        guests,
        created_at,
        venue:venues(
          id,
          name,
          address,
          match,
          match_time,
          is_brazil_match,
          city
        )
        `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),

    // ✅ FIX: busca venues + count de rsvps em UMA query com JOIN
    supabase
      .from("venues")
      .select("id, name, address, unverified, rsvps(count)")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (rsvpsResult.error) throw rsvpsResult.error;
  if (venuesResult.error) throw venuesResult.error;

  const rsvps = rsvpsResult.data || [];
  const venuesCreated = venuesResult.data || [];

  const venueMap = new Map();
  for (const r of rsvps) {
    if (r.venue) {
      venueMap.set(r.venue.id, {
        name: r.venue.name,
        address: r.venue.address,
      });
    }
  }

  const upcoming: ProfileUpcomingMatch[] = [];
  const history: ProfileHistoryMatch[] = [];

  for (const r of rsvps) {
    if (!r.venue) continue;

    const matchTime = new Date(r.venue.match_time);
    const isPast = matchTime < new Date();
    const flag = r.venue.is_brazil_match ? "🇧🇷" : "🌎";

    if (isPast) {
      history.push({
        id: r.id,
        teams: r.venue.match,
        date: matchTime.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
        venue: r.venue.name,
        venueId: r.venue.id,
        score: "-",
      });
    } else {
      const timeStr = matchTime
        .toLocaleDateString("pt-BR", {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(".", "");

      upcoming.push({
        id: r.id,
        teams: r.venue.match,
        time: timeStr,
        venue: r.venue.name,
        venueId: r.venue.id,
        flag,
        guests: r.guests || 1,
      });
    }
  }

  upcoming.sort((a, b) => {
    const rsvpA = rsvps.find((r) => r.id === a.id);
    const rsvpB = rsvps.find((r) => r.id === b.id);
    return (
      new Date(rsvpA?.venue?.match_time ?? 0).getTime() -
      new Date(rsvpB?.venue?.match_time ?? 0).getTime()
    );
  });

  history.sort((a, b) => {
    const rsvpA = rsvps.find((r) => r.id === a.id);
    const rsvpB = rsvps.find((r) => r.id === b.id);
    return (
      new Date(rsvpB?.venue?.match_time ?? 0).getTime() -
      new Date(rsvpA?.venue?.match_time ?? 0).getTime()
    );
  });

  // ✅ FIX: rsvp count já veio no JOIN — sem loop de queries N+1
  const myVenues: ProfileVenue[] = venuesCreated.map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    verified: !v.unverified,
    rsvps: (v as any).rsvps?.[0]?.count ?? 0,
  }));

  const confirmedCount = rsvps.reduce((acc, r) => acc + (r.guests || 1), 0);
  const pastGamesCount = history.length;

  return {
    stats: {
      jogos: pastGamesCount,
      bares: venuesCreated.length,
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
