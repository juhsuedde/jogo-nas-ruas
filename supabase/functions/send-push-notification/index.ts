// supabase/functions/send-push-notification/index.ts
// Edge Function para enviar notificações push via Firebase Cloud Messaging v1 API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SB_URL = Deno.env.get("SB_URL");
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY");
const GOOGLE_SERVICE_ACCOUNT = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID");

async function getAccessToken(): Promise<string> {
  if (!GOOGLE_SERVICE_ACCOUNT) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT not configured");
  }

  const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const jwtPayload = btoa(
    JSON.stringify({
      iss: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    }),
  );

  const encoder = new TextEncoder();
  const keyData = encoder.encode(`${jwtHeader}.${jwtPayload}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, keyData);

  const jwt = `${jwtHeader}.${jwtPayload}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("Failed to get access token");
  }

  return tokenData.access_token;
}

async function sendPushNotification(
  accessToken: string,
  token: string,
  matchName: string,
  venueName: string,
  venueId: string,
) {
  const projectId = FIREBASE_PROJECT_ID || "jogo-nas-ruas";

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: `⚽ ${matchName} começa em 1h!`,
            body: `Bora pro ${venueName}? Você confirmou presença!`,
          },
          data: {
            venue_id: venueId,
            type: "match_reminder",
          },
          webpush: {
            notification: {
              icon: "/icon-192x192.png",
              badge: "/badge-72x72.png",
            },
            fcmOptions: {
              link: `/venue/${venueId}`,
            },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FCM error: ${response.status} - ${error}`);
  }

  return response.json();
}

serve(async (req) => {
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

    const { data: upcomingRsvps, error } = await supabase.rpc(
      "get_upcoming_rsvps_for_notification",
    );

    if (error) throw error;
    if (!upcomingRsvps || upcomingRsvps.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma notificação para enviar", sent: 0 }), {
        headers,
      });
    }

    const accessToken = await getAccessToken();
    const results = [];

    for (const rsvp of upcomingRsvps) {
      try {
        await sendPushNotification(
          accessToken,
          rsvp.token,
          rsvp.match_name,
          rsvp.venue_name,
          rsvp.venue_id,
        );

        await supabase.from("notifications_sent").insert({
          rsvp_id: rsvp.rsvp_id,
          user_id: rsvp.user_id,
          type: "match_reminder",
          sent_at: new Date().toISOString(),
        });

        results.push({
          user: rsvp.user_id,
          venue: rsvp.venue_name,
          match: rsvp.match_name,
          success: true,
        });
      } catch (err) {
        results.push({
          user: rsvp.user_id,
          venue: rsvp.venue_name,
          match: rsvp.match_name,
          success: false,
          error: err.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Notificações processadas",
        sent: results.filter((r) => r.success).length,
        results,
      }),
      { headers },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
