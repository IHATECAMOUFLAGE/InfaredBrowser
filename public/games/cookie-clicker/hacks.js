(function () {
  let menuOpen = false;
  let autoClickerInterval = null;

  const STORAGE_KEY = "cheatMenuSettings_v2";

  const defaultSettings = {
    cookies: 1000000,
    autoCookies: 1000,
    fps: 30,
    autoClickerOn: false,
    mode: "earn" // add | set | earn | click
  };

  let settings = loadSettings();

  function loadSettings() {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function startAutoClicker() {
    stopAutoClicker();

    autoClickerInterval = setInterval(() => {
      switch (settings.mode) {
        case "add":
          Game.cookies += settings.autoCookies;
          Game.cookiesEarned += settings.autoCookies;
          break;
        case "set":
          Game.cookies = settings.autoCookies;
          Game.cookiesEarned = settings.autoCookies;
          break;
        case "earn":
          Game.Earn(settings.autoCookies);
          break;
        case "click":
          Game.ClickCookie();
          break;
      }
    }, 100);
  }

  function stopAutoClicker() {
    if (autoClickerInterval) {
      clearInterval(autoClickerInterval);
      autoClickerInterval = null;
    }
  }

  function createMenu() {
    if (document.getElementById("cheatMenu")) return;

    const menu = document.createElement("div");
    menu.id = "cheatMenu";
    menu.style.position = "fixed";
    menu.style.top = "100px";
    menu.style.left = "100px";
    menu.style.background = "#1e1e1e";
    menu.style.color = "#fff";
    menu.style.border = "2px solid #555";
    menu.style.zIndex = "9999";
    menu.style.width = "280px";
    menu.style.fontFamily = "Arial";

    menu.innerHTML = `
      <div id="header" style="padding:10px; cursor:move; background:#333;">
        Cheat Menu
      </div>
      <div style="padding:10px;">

        <div>Cookies: <span id="liveCookies">0</span></div><br>

        <label>Set Cookies:</label><br>
        <input type="number" id="cookieInput" value="${settings.cookies}" style="width:100%"><br>
        <button id="applyCookies">Apply</button><br><br>

        <label>Auto Amount:</label><br>
        <input type="range" id="autoSlider" min="1" max="100000" value="${settings.autoCookies}">
        <span id="autoValue">${settings.autoCookies}</span><br><br>

        <label>Mode:</label><br>
        <select id="modeSelect" style="width:100%">
          <option value="add">Add (+=)</option>
          <option value="set">Set (=)</option>
          <option value="earn">Game.Earn()</option>
          <option value="click">Click Cookie</option>
        </select><br><br>

        <button id="toggleAuto">Toggle Auto Clicker</button><br><br>

        <label>FPS:</label><br>
        <input type="range" id="fpsSlider" min="1" max="120" value="${settings.fps}">
        <span id="fpsValue">${settings.fps}</span><br>
        <button id="applyFPS">Apply FPS</button><br><br>

        <button id="closeMenu">Close</button>
      </div>
    `;

    document.body.appendChild(menu);

    // Restore mode
    document.getElementById("modeSelect").value = settings.mode;

    // Dragging (header only)
    const header = document.getElementById("header");
    let isDragging = false, offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - menu.offsetLeft;
      offsetY = e.clientY - menu.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        menu.style.left = (e.clientX - offsetX) + "px";
        menu.style.top = (e.clientY - offsetY) + "px";
      }
    });

    document.addEventListener("mouseup", () => isDragging = false);

    // Live cookies display
    setInterval(() => {
      if (window.Game) {
        document.getElementById("liveCookies").textContent =
          Math.floor(Game.cookies).toLocaleString();
      }
    }, 200);

    // Set cookies
    document.getElementById("applyCookies").onclick = () => {
      const val = Number(document.getElementById("cookieInput").value);
      settings.cookies = val;
      Game.cookies = val;
      Game.cookiesEarned = val;
      saveSettings();
    };

    // Slider
    const autoSlider = document.getElementById("autoSlider");
    const autoValue = document.getElementById("autoValue");

    autoSlider.oninput = () => {
      settings.autoCookies = Number(autoSlider.value);
      autoValue.textContent = autoSlider.value;
      saveSettings();
    };

    // Mode select
    document.getElementById("modeSelect").onchange = (e) => {
      settings.mode = e.target.value;
      saveSettings();
    };

    // Toggle auto clicker
    document.getElementById("toggleAuto").onclick = () => {
      settings.autoClickerOn = !settings.autoClickerOn;

      if (settings.autoClickerOn) {
        startAutoClicker();
      } else {
        stopAutoClicker();
      }

      saveSettings();
    };

    // FPS
    const fpsSlider = document.getElementById("fpsSlider");
    const fpsValue = document.getElementById("fpsValue");

    fpsSlider.oninput = () => {
      settings.fps = Number(fpsSlider.value);
      fpsValue.textContent = fpsSlider.value;
      saveSettings();
    };

    document.getElementById("applyFPS").onclick = () => {
      Game.fps = settings.fps;
    };

    // Close
    document.getElementById("closeMenu").onclick = toggleMenu;

    // Restore auto clicker
    if (settings.autoClickerOn) {
      startAutoClicker();
    }
  }

  function toggleMenu() {
    const existing = document.getElementById("cheatMenu");
    if (existing) {
      existing.remove();
      stopAutoClicker();
      menuOpen = false;
    } else {
      createMenu();
      menuOpen = true;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
      toggleMenu();
    }
  });
})();