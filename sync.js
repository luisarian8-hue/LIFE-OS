// netlify/functions/sync.js
// Speichert/liest den kompletten LIFE OS State als einen JSON-Blob.
// Schutz: ein PIN, der als Umgebungsvariable SYNC_PIN in den Netlify-Site-Settings
// gesetzt wird (Site settings -> Environment variables). Ohne korrekten Header
// X-Sync-Pin gibt die Function 401 zurueck.

import { getStore } from "@netlify/blobs";

export default async (req) => {
  const pin = req.headers.get("x-sync-pin");

  if (!process.env.SYNC_PIN) {
    return new Response(
      JSON.stringify({ error: "SYNC_PIN ist nicht in den Netlify-Umgebungsvariablen gesetzt" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  if (pin !== process.env.SYNC_PIN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const store = getStore("lifeos");

  if (req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return new Response(JSON.stringify(data || null), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }
    await store.setJSON("state", body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
