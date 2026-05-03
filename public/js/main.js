document.addEventListener("DOMContentLoaded", () => {
  const tabWrapper = document.querySelector(".tab-wrapper");
  const addTabBtn = document.querySelector(".addTab button");
  const addressBar = document.querySelector(".mid input");
  const frameContainer = document.querySelector(".frames-container");
  const menuBtn = document.querySelector("[data-menu]");
  const menuPopup = document.querySelector(".menu-popup");
  const fullscreenBtn = document.querySelector("[data-fullscreen]");

  fullscreenBtn.addEventListener("click", () => {
    const activeTab = document.querySelector(".tab[data-active]");
    if (!activeTab) return;

    const iframe = activeTab.iframe;

    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen();
    }
  });


  menuBtn.addEventListener("click", () => {
    menuPopup.hidden = !menuPopup.hidden;
  });

  document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !menuPopup.contains(e.target)) {
      menuPopup.hidden = true;
    }
  });

  document.querySelector("[data-goto-games]").addEventListener("click", () => {
    addressBar.value = "infared://games";
    addressBar.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    menuPopup.hidden = true;
  });

  document.querySelector("[data-goto-youtube]").addEventListener("click", () => {
    addressBar.value = "infared://youtube";
    addressBar.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    menuPopup.hidden = true;
  });

  document.querySelector("[data-enable-eruda]").addEventListener("click", () => {
    const activeTab = document.querySelector(".tab[data-active]");
    if (!activeTab) return;

    const outerFrame = activeTab.iframe;

    outerFrame.onload = () => {
      const outerDoc = outerFrame.contentDocument || outerFrame.contentWindow.document;

      const innerFrame = outerDoc.querySelector("iframe");
      if (!innerFrame) {
        console.warn("No inner iframe found (scramjet proxy not loaded yet).");
        return;
      }

      innerFrame.onload = () => {
        const innerDoc = innerFrame.contentDocument || innerFrame.contentWindow.document;

        const script = innerDoc.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/eruda";
        script.onload = () => {
          innerFrame.contentWindow.eruda.init();

          const style = innerDoc.createElement("style");
          style.textContent = `
            .eruda * {
              font-size: 10px !important;
            }
          `;
          innerDoc.head.appendChild(style);
        };

        innerDoc.body.appendChild(script);
      };
    };

    menuPopup.hidden = true;

  });

  function resolve(url) {
    if (url === "infared://newtab") return "search.html";
    if (url === "infared://games") return "games.html";
    if (url === "infared://youtube") return "youtube.html";
    
    return url;
  }

  function createTab(initialURL = "infared://newtab") {
    const tab = document.createElement("span");
    tab.classList.add("tab");
    tab.setAttribute("draggable", "true");

    const resolved = resolve(initialURL);
    tab.dataset.url = resolved;
    tab.dataset.history = JSON.stringify([resolved]);
    tab.dataset.index = "0";

    const iframe = document.createElement("iframe");
    iframe.classList.add("tab-frame");
    iframe.src = resolved === "search.html" || resolved === "games.html"
      ? resolved
      : "search.html#" + encodeURIComponent(resolved);
    iframe.style.display = "none";
    tab.iframe = iframe;
    frameContainer.appendChild(iframe);

    tab.innerHTML = `
      <div class="favicon"><img src="" alt=""></div>
      <div class="title">New Tab</div>
      <div class="closebtn">
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
    `;

    tabWrapper.appendChild(tab);
    setActiveTab(tab);
  }

  function loadFrame(tab) {
    document.querySelectorAll(".tab-frame").forEach(f => f.style.display = "none");
    tab.iframe.style.display = "block";
  }

  function setActiveTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.removeAttribute("data-active"));
    tab.setAttribute("data-active", "true");
    addressBar.value = tab.dataset.url;
    loadFrame(tab);
  }

  window.addEventListener("message", (event) => {
    if (!event.data || event.data.type !== "scramjet-url") return;
    const activeTab = document.querySelector(".tab[data-active]");
    if (!activeTab) return;

    const newURL = event.data.url;
    activeTab.dataset.url = newURL;
    addressBar.value = newURL;

    activeTab.querySelector(".title").textContent = newURL.replace(/^https?:\/\//, "");
    activeTab.querySelector(".favicon img").src =
      `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=${newURL}&size=256`;

    const history = JSON.parse(activeTab.dataset.history);
    if (history[history.length - 1] !== newURL) {
      history.push(newURL);
      activeTab.dataset.history = JSON.stringify(history);
      activeTab.dataset.index = history.length - 1;
    }
  });

  tabWrapper.addEventListener("click", e => {
    const tab = e.target.closest(".tab");
    if (!tab) return;

    if (e.target.closest(".closebtn")) {
      const active = tab.hasAttribute("data-active");
      tab.iframe.remove();
      tab.remove();
      if (active && document.querySelector(".tab")) {
        setActiveTab(document.querySelector(".tab"));
      }
      return;
    }

    setActiveTab(tab);
  });

  tabWrapper.addEventListener("auxclick", e => {
    if (e.button === 1) {
      const tab = e.target.closest(".tab");
      if (tab) {
        const active = tab.hasAttribute("data-active");
        tab.iframe.remove();
        tab.remove();
        if (active && document.querySelector(".tab")) {
          setActiveTab(document.querySelector(".tab"));
        }
      }
    }
  });

  let draggedTab = null;

  tabWrapper.addEventListener("dragstart", e => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    draggedTab = tab;
    tab.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  tabWrapper.addEventListener("dragover", e => {
    e.preventDefault();
    const over = e.target.closest(".tab");
    if (!over || over === draggedTab) return;

    const rect = over.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;

    if (before) {
      tabWrapper.insertBefore(draggedTab, over);
    } else {
      tabWrapper.insertBefore(draggedTab, over.nextSibling);
    }
  });

  tabWrapper.addEventListener("dragend", () => {
    if (draggedTab) draggedTab.classList.remove("dragging");
    draggedTab = null;
  });

  addTabBtn.addEventListener("click", () => {
    createTab("infared://newtab");
  });

  addressBar.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      let url = addressBar.value.trim();
      if (!url.startsWith("http") && !url.startsWith("infared://")) {
        url = "https://" + url;
      }

      const tab = document.querySelector(".tab[data-active]");
      if (!tab) return;

      const resolved = resolve(url);
      tab.dataset.url = resolved;
      tab.dataset.history = JSON.stringify([resolved]);
      tab.dataset.index = "0";

      tab.iframe.src = resolved === "search.html" || resolved === "games.html" || resolved === "youtube.html"
        ? resolved
        : "search.html#" + encodeURIComponent(resolved);
    }
  });

  document.querySelector("[data-back]").addEventListener("click", () => {
    const tab = document.querySelector(".tab[data-active]");
    if (!tab) return;

    let index = parseInt(tab.dataset.index, 10);
    const history = JSON.parse(tab.dataset.history);

    if (index > 0) {
      index--;
      tab.dataset.index = index;
      tab.dataset.url = history[index];
      tab.iframe.src = history[index] === "search.html" || history[index] === "games.html"
        ? history[index]
        : "search.html#" + encodeURIComponent(history[index]);
    }
  });

  document.querySelector("[data-forward]").addEventListener("click", () => {
    const tab = document.querySelector(".tab[data-active]");
    if (!tab) return;

    let index = parseInt(tab.dataset.index, 10);
    const history = JSON.parse(tab.dataset.history);

    if (index < history.length - 1) {
      index++;
      tab.dataset.index = index;
      tab.dataset.url = history[index];
      tab.iframe.src = history[index] === "search.html" || history[index] === "games.html"
        ? history[index]
        : "search.html#" + encodeURIComponent(history[index]);
    }
  });

  document.querySelector("[data-refresh]").addEventListener("click", () => {
    const tab = document.querySelector(".tab[data-active]");
    if (tab) tab.iframe.src = tab.iframe.src;
  });

  document.querySelector("[data-home]").addEventListener("click", () => {
    const tab = document.querySelector(".tab[data-active]");
    if (!tab) return;

    const home = "search.html";
    tab.dataset.url = home;
    tab.dataset.history = JSON.stringify([home]);
    tab.dataset.index = "0";
    tab.iframe.src = home;
  });

  tabWrapper.innerHTML = "";
  createTab("infared://newtab");
});
