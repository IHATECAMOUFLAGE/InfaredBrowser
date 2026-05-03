export default async function youtubeRoutes(fastify, options) {
  fastify.get("/api/fetch", async (request, reply) => {
    try {
      const targetUrl = request.query.url;

      if (!targetUrl) {
        return reply.code(400).send({ error: "Missing ?url=" });
      }

      const analyticsRes = await fetch("https://downr.org/.netlify/functions/analytics");
      const cookie = analyticsRes.headers.get("set-cookie");

      const nytRes = await fetch("https://downr.org/.netlify/functions/nyt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookie,
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://downr.org",
          "Referer": "https://downr.org/"
        },
        body: JSON.stringify({ url: targetUrl })
      });

      const json = await nytRes.json();

      reply.header("Content-Type", "application/json");
      return reply.code(nytRes.status).send(json);

    } catch (err) {
      return reply.code(500).send({ error: "Failed", details: err.message });
    }
  });
}
