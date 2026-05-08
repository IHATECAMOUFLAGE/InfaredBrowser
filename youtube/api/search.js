export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    res.status(400).json({ results: [] });
    return;
  }

  try {
    const results = [];
    const seen = new Set();

    const searchUrl =
      "https://ytapi.apps.mattw.io/v3/search?" +
      new URLSearchParams({
        part: "snippet",
        q: query,
        type: "video",
        maxResults: "30",
        key: "foo1"
      });

    const searchResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    });

    if (!searchResponse.ok) {
      res.status(200).json({ results: [] });
      return;
    }

    const searchData = await searchResponse.json();

    const ids = [];

    for (const item of searchData.items || []) {
      const id = item.id?.videoId;

      if (!id || seen.has(id)) continue;

      seen.add(id);
      ids.push(id);
    }

    if (ids.length === 0) {
      res.status(200).json({ results: [] });
      return;
    }

    const videosUrl =
      "https://ytapi.apps.mattw.io/v3/videos?" +
      new URLSearchParams({
        part: "snippet,contentDetails,statistics",
        id: ids.join(","),
        key: "foo1"
      });

    const videosResponse = await fetch(videosUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    });

    if (!videosResponse.ok) {
      res.status(200).json({ results: [] });
      return;
    }

    const videosData = await videosResponse.json();

    for (const item of videosData.items || []) {
      results.push({
        id: item.id,
        title: item.snippet?.title || "",
        thumbnail:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
        duration: item.contentDetails?.duration || "unknown",
        views: item.statistics?.viewCount || "unknown",
        channel: item.snippet?.channelTitle || "YouTube"
      });
    }

    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ results: [] });
  }
}