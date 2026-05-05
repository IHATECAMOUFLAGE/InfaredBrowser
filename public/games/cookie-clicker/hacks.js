(function () {
  let menuOpen = false;
  let autoClickerInterval = null;

  const STORAGE_KEY = "cheatMenuSettings";

  const defaultSettings = {
    cookies: 1000000,
    autoCookies: 1000,
    fps: 30,
    autoClickerOn: false
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

  function createMenu() {
    if (document.getElementById("cheatMenu")) return;

    const menu = document.createElement("div");
    menu.id = "cheatMenu";
    menu.style.position = "fixed";
    menu.style.top = "100px";
    menu.style.left = "100px";
    menu.style.background = "#1e1e1e";
    menu.style.color = "#fff";
    menu.style.padding = "15px";
    menu.style.border = "2px solid #555";
    menu.style.zIndex = "9999";
    menu.style.width = "260px";
    menu.style.fontFamily = "Arial";
    menu.style.cursor = "move";

    menu.innerHTML = `
      <h3 style="margin-top:0;">Cheat Menu</h3>

      <label>Set Cookies:</label><br>
      <input type="number" id="cookieInput" value="${settings.cookies}" style="width:100%"><br><br>
      <button id="applyCookies">Apply</button><br><br>

      <label>Auto Cookies per Tick:</label><br>
      <input type="range" id="autoSlider" min="1" max="100000" value="${settings.autoCookies}">
      <span id="autoValue">${settings.autoCookies}</span><br>
      <button id="toggleAuto">Toggle Auto Clicker</button><br><br>

      <label>FPS:</label><br>
      <input type="range" id="fpsSlider" min="1" max="120" value="${settings.fps}">
      <span id="fpsValue">${settings.fps}</span><br>
      <button id="applyFPS">Apply FPS</button><br><br>

      <button id="closeMenu">Close</button>
    `;

    document.body.appendChild(menu);

    let isDragging = false, offsetX, offsetY;

    menu.addEventListener("mousedown", (e) => {
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

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    document.getElementById("applyCookies").onclick = () => {
      const val = Number(document.getElementById("cookieInput").value);
      settings.cookies = val;
      Game.cookiesEarned = val;
      Game.cookies = val;
      saveSettings();
    };

    const autoSlider = document.getElementById("autoSlider");
    const autoValue = document.getElementById("autoValue");

    autoSlider.oninput = () => {
      settings.autoCookies = Number(autoSlider.value);
      autoValue.textContent = autoSlider.value;
      saveSettings();
    };

    document.getElementById("toggleAuto").onclick = () => {
      settings.autoClickerOn = !settings.autoClickerOn;

      if (settings.autoClickerOn) {
        autoClickerInterval = setInterval(() => {
          Game.cookiesEarned = settings.autoCookies;
          Game.cookies = settings.autoCookies;
        }, 100);
      } else {
        clearInterval(autoClickerInterval);
        autoClickerInterval = null;
      }

      saveSettings();
    };

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

    document.getElementById("closeMenu").onclick = toggleMenu;

    if (settings.autoClickerOn) {
      autoClickerInterval = setInterval(() => {
        Game.cookiesEarned += settings.autoCookies;
        Game.cookies += settings.autoCookies;
      }, 100);
    }
  }

  function toggleMenu() {
    const existing = document.getElementById("cheatMenu");
    if (existing) {
      existing.remove();
      menuOpen = false;
    } else {
      createMenu();
      menuOpen = true;
    }
  }

  // Keybind
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
      toggleMenu();
    }
  });
})();