importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("message", async (event) => {
    if (event.data && event.data.type === "SAVE_OFFLINE") {
        const urls = event.data.urls;
        const cache = await caches.open("offline-cache");

        try {
            await cache.addAll(urls);
            event.ports[0].postMessage({ success: true });
        } catch (err) {
            event.ports[0].postMessage({ success: false, error: err.toString() });
        }
    }
});

async function handleRequest(event) {
    await scramjet.loadConfig();

    let response = scramjet.route(event)
        ? await scramjet.fetch(event)
        : await fetch(event.request);

    const contentType = response.headers.get("content-type") || "";

    // Inject script into HTML pages
    if (contentType.includes("text/html")) {
        let html = await response.text();

        const script = `
<script>
(function () {
    let loaded = false;

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "i") {
            if (loaded) {
                eruda.get().toggle();
                return;
            }

            loaded = true;

            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/eruda";
            s.onload = () => eruda.init();
            document.body.appendChild(s);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "s") {
            if (navigator.serviceWorker.controller) {
                const urls = [
                    location.pathname,
                    "/index.html",
                    "/search.html",
                    "/games.html"
                ];

                const channel = new MessageChannel();
                channel.port1.onmessage = (msg) => {
                    console.log("Offline save:", msg.data);
                };

                navigator.serviceWorker.controller.postMessage(
                    { type: "SAVE_OFFLINE", urls },
                    [channel.port2]
                );
            }
        }
    });

    alert = () => {};
})();
</script>`;

        if (html.toLowerCase().includes("</body>")) {
            html = html.replace(/<\/body>/i, script + "</body>");
        } else {
            html += script;
        }

        return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: { "content-type": "text/html" }
        });
    }

    return response;
}

self.addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            try {
                return await handleRequest(event);
            } catch (err) {
                const cache = await caches.open("offline-cache");
                const cached = await cache.match(event.request);
                return cached || Response.error();
            }
        })()
    );
});
