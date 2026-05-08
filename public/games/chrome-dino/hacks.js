(function () {
  let menuOpen = false;
  let autoJumpInterval = null;

  const STORAGE_KEY = "dinoHackSettings_v1";

  const defaultSettings = {
    autoJump: false,
    godMode: false,
    speed: 6,
    jump: 10,
    score: 9999
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

  function startAutoJump() {
    stopAutoJump();
    autoJumpInterval = setInterval(() => {
      if (Runner.instance_.horizon.obstacles[0]?.xPos < 120) {
        document.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 32 }));
      }
    }, 20);
  }

  function stopAutoJump() {
    if (autoJumpInterval) {
      clearInterval(autoJumpInterval);
      autoJumpInterval = null;
    }
  }

  function applyGodMode() {
    if (settings.godMode) {
      Runner.prototype.gameOver = function () {};
    }
  }

  function createMenu() {
    if (document.getElementById("dinoMenu")) return;

    const menu = document.createElement("div");
    menu.id = "dinoMenu";
    menu.style.position = "fixed";
    menu.style.top = "100px";
    menu.style.left = "100px";
    menu.style.background = "#1e1e1e";
    menu.style.color = "#0f0";
    menu.style.border = "2px solid #0f0";
    menu.style.zIndex = "9999";
    menu.style.width = "260px";
    menu.style.fontFamily = "Arial";

    menu.innerHTML = `
      <div id="header" style="padding:10px; cursor:move; background:#333;">
        🦖 Dino Menu
      </div>
      <div style="padding:10px;">

        <label>
          <input type="checkbox" id="autoJump"> Auto Jump
        </label><br><br>

        <label>
          <input type="checkbox" id="godMode"> God Mode
        </label><br><br>

        <label>Speed:</label><br>
        <input type="range" id="speedSlider" min="1" max="200" value="${settings.speed}">
        <span id="speedValue">${settings.speed}</span><br><br>

        <label>Jump Power:</label><br>
        <input type="range" id="jumpSlider" min="5" max="50" value="${settings.jump}">
        <span id="jumpValue">${settings.jump}</span><br><br>

        <label>Set Score:</label><br>
        <input type="number" id="scoreInput" value="${settings.score}" style="width:100%"><br>
        <button id="applyScore">Apply</button><br><br>

        <button id="closeMenu">Close</button>
      </div>
    `;

    document.body.appendChild(menu);

    // Apply saved states
    document.getElementById("autoJump").checked = settings.autoJump;
    document.getElementById("godMode").checked = settings.godMode;

    if (settings.autoJump) startAutoJump();
    if (settings.godMode) applyGodMode();

    Runner.instance_.setSpeed(settings.speed);
    Runner.instance_.tRex.setJumpVelocity(settings.jump);

    // Dragging
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

    // Auto Jump toggle
    document.getElementById("autoJump").onchange = (e) => {
      settings.autoJump = e.target.checked;
      settings.autoJump ? startAutoJump() : stopAutoJump();
      saveSettings();
    };

    // God Mode toggle
    document.getElementById("godMode").onchange = (e) => {
      settings.godMode = e.target.checked;
      if (settings.godMode) {
        applyGodMode();
      } else {
        location.reload(); // restore normal behavior
      }
      saveSettings();
    };

    // Speed
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");

    speedSlider.oninput = () => {
      settings.speed = Number(speedSlider.value);
      speedValue.textContent = speedSlider.value;
      Runner.instance_.setSpeed(settings.speed);
      saveSettings();
    };

    // Jump
    const jumpSlider = document.getElementById("jumpSlider");
    const jumpValue = document.getElementById("jumpValue");

    jumpSlider.oninput = () => {
      settings.jump = Number(jumpSlider.value);
      jumpValue.textContent = jumpSlider.value;
      Runner.instance_.tRex.setJumpVelocity(settings.jump);
      saveSettings();
    };

    // Score
    document.getElementById("applyScore").onclick = () => {
      const val = Number(document.getElementById("scoreInput").value);
      settings.score = val;
      Runner.instance_.distanceRan = val / 0.025;
      saveSettings();
    };

    document.getElementById("closeMenu").onclick = toggleMenu;
  }

  function toggleMenu() {
    const existing = document.getElementById("dinoMenu");
    if (existing) {
      existing.remove();
      stopAutoJump();
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