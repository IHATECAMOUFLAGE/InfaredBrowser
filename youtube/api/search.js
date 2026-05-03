export default async function searchRoutes(fastify, options) {
  fastify.get("/api/search", async (request, reply) => {
    const { query } = request.query;
    
    if (!query) {
      return reply.code(400).send({ results: [] });
    }

    const q = encodeURIComponent(query + " youtube");
    const url = "https://video.search.yahoo.com/search/video?p=" + q;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html"
        }
      });

      const html = await response.text();
      const results = [];

      const jsonMatch = html.match(/YUI\.Env\.SrpResults\s*=\s*(\{[\s\S]*?\});/);

      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.content && Array.isArray(data.content)) {
            for (const item of data.content) {
              const target = item.rurl || item.url || "";
              const idMatch = target.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
              if (!idMatch) continue;

              const id = idMatch[1];
              const title = (item.tit || item.title || "").replace(/\\u003C\/?b\\u003E/g, "").trim();

              results.push({
                id,
                title,
                thumbnail: "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg",
                duration: item.l || "",
                views: item.viewsShortFormat || "",
                channel: item.channel || "YouTube"
              });
            }
          }
        } catch (e) {}
      }

      if (results.length === 0) {
        const regex = /<a[^>]+href="([^"]+youtube\.com\/watch\?v=[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const seen = new Set();
        let m;
        while ((m = regex.exec(html)) !== null) {
          const url = m[1];
          const idMatch = url.match(/v=([a-zA-Z0-9_-]{11})/);
          if (!idMatch) continue;
          const id = idMatch[1];
          if (seen.has(id)) continue;
          seen.add(id);
          const title = m[2].replace(/<[^>]+>/g, " ").trim();
          results.push({
            id,
            title,
            thumbnail: "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg",
            duration: "",
            views: "",
            channel: "YouTube"
          });
          if (results.length >= 30) break;
        }
      }

      return reply.send({ results });
    } catch (e) {
      return reply.code(500).send({ results: [] });
    }
  });
}