

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/") {
      return new Response(JSON.stringify({
        app: "Zirve90",
        status: "API calisiyor",
        keyConfigured: Boolean(env.HIGHLIGHTLY_API_KEY)
      }), { headers });
    }

    if (url.pathname === "/matches") {
      if (!env.HIGHLIGHTLY_API_KEY) {
        return new Response(JSON.stringify({
          error: "API anahtari eksik"
        }), { status: 500, headers });
      }

      try {
        const date = url.searchParams.get("date") ||
          new Date().toISOString().slice(0, 10);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return new Response(JSON.stringify({
            error: "Tarih YYYY-MM-DD olmali"
          }), { status: 400, headers });
        }

        const apiUrl =
          "https://soccer.highlightly.net/matches?date=" +
          encodeURIComponent(date);

        const response = await fetch(apiUrl, {
          headers: {
            "x-rapidapi-key": env.HIGHLIGHTLY_API_KEY,
            "x-rapidapi-host": "soccer.highlightly.net"
          }
        });

        const body = await response.text();

        return new Response(body, {
          status: response.status,
          headers: {
            ...headers,
            "Cache-Control": "public, max-age=30"
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Mac verileri alinamadi"
        }), { status: 502, headers });
      }
    }

    return new Response(JSON.stringify({
      error: "Sayfa bulunamadi"
    }), { status: 404, headers });
  }
};
