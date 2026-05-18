// supabase/functions/send-push-notification/index.ts
// Edge Function para enviar notificações push via Firebase Cloud Messaging

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
const SB_URL = Deno.env.get("SB_URL");
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY");

serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabase = createClient(SB_URL!, SB_SERVICE_ROLE_KEY!);

    // Buscar RSVPs que precisam de notificação (jogos que começam em ~1h)
    const { data: upcomingRsvps, error } = await supabase.rpc(
      "get_upcoming_rsvps_for_notification",
    );

    if (error) throw error;
    if (!upcomingRsvps || upcomingRsvps.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Nenhuma notificação para enviar",
          sent: 0,
        }),
        { headers },
      );
    }

    const results = [];

    for (const rsvp of upcomingRsvps) {
      // Enviar notificação via FCM
      const response = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: rsvp.token,
          notification: {
            title: `⚽ ${rsvp.match_name} começa em 1h!`,
            body: `Bora pro ${rsvp.venue_name}? Você confirmou presença!`,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            click_action: `/venue/${rsvp.venue_id}`,
          },
          data: {
            venue_id: rsvp.venue_id,
            match_id: rsvp.match_id,
            type: "match_reminder",
          },
        }),
      });

      const result = await response.json();

      // Marcar como notificado
      await supabase.from("notifications_sent").insert({
        rsvp_id: rsvp.rsvp_id,
        user_id: rsvp.user_id,
        type: "match_reminder",
        sent_at: new Date().toISOString(),
        fcm_response: result,
      });

      results.push({
        user: rsvp.user_id,
        venue: rsvp.venue_name,
        match: rsvp.match_name,
        success: result.success === 1,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Notificações enviadas",
        sent: results.length,
        results,
      }),
      { headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      { status: 500, headers },
    );
  }
});
