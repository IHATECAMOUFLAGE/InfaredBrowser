export default async function (fastify) {
  fastify.get("/api/search", async (req, reply) => {
    const query = req.query?.query;

    if (!query) {
      return reply.status(400).send({ results: [] });
    }

    try {
      const results = [];
      const seen = new Set();

      const searchUrl =
        "https://video.search.yahoo.com/search/video?" +
        new URLSearchParams({
          p: query + " youtube",
          fr: "sfp"
        });

      const searchResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html"
        }
      });

      if (!searchResponse.ok) {
        return reply.send({ results: [] });
      }

      const html = await searchResponse.text();

      const cards = html.split('<li class="tile').slice(1);

      const ids = [];

      // First pass: collect unique video IDs
      for (const card of cards) {
        const refMatch = card.match(/data-referenceurl="([^"]+)"/);
        const hrefMatch = card.match(/href="([^"]+)"/);

        const url = refMatch?.[1] || hrefMatch?.[1];
        if (!url) continue;

        const idMatch = url.match(/v=([^&]+)/);
        if (!idMatch) continue;

        const id = idMatch[1];
        if (!id || seen.has(id)) continue;

        seen.add(id);
        ids.push(id);
      }

      if (ids.length === 0) {
        return reply.send({ results: [] });
      }

      // Second pass: extract metadata for each ID
      for (const card of cards) {
        const refMatch = card.match(/data-referenceurl="([^"]+)"/);
        const hrefMatch = card.match(/href="([^"]+)"/);
        const url = refMatch?.[1] || hrefMatch?.[1];
        if (!url) continue;

        const idMatch = url.match(/v=([^&]+)/);
        if (!idMatch) continue;

        const id = idMatch[1];
        if (!ids.includes(id)) continue;

        const titleMatch = card.match(/tile-title[^>]*>(.*?)<\/p>/s);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";

        const thumbMatch = card.match(/<img[^>]+src="([^"]+)"/);
        const thumbnail =
          thumbMatch?.[1] ||
          `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

        const durationMatch = card.match(/class="[^"]*time[^"]*"[^>]*>(.*?)<\/p>/);
        const duration = durationMatch?.[1]?.trim() || "unknown";

        const viewsMatch = card.match(/(\d[\d.,]*[MK]?) views/i);
        const views = viewsMatch?.[1] || "unknown";

        const channelMatch = card.match(/tile-domain[^>]*>(.*?)<\/p>/);
        const channel = channelMatch
          ? channelMatch[1].replace(/<[^>]+>/g, "").trim()
          : "YouTube";

        results.push({
          id,
          title,
          thumbnail,
          duration,
          views,
          channel
        });
      }

      return reply.send({ results });
    } catch (e) {
      return reply.status(500).send({ results: [] });
    }
  });
}
