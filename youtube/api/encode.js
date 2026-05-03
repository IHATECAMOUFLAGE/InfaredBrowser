export default async function encodeRoutes(fastify, options) {
  fastify.get("/api/encode", async (request, reply) => {
    const raw = request.query.url;

    if (!raw) {
      return reply.code(400).send("Missing url");
    }

    const target = decodeURIComponent(raw);

    reply.header("Content-Type", "text/html");
    return reply.send(`
      <!DOCTYPE html>
      <html>
        <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;color:white;font-family:sans-serif;">
          <video controls autoplay style="width:100%;height:auto;max-height:100vh;">
            <source 
              src="${target.replace(/"/g, "&quot;")}" 
              type="video/mp4"
              onerror="document.body.innerHTML='<div style=\\'text-align:center;padding:20px;\\'>Video failed to load<br><br>Please try later as the service may be temporarily unavailable.</div>'"
            >
          </video>
        </body>
      </html>
    `);
  });
}
