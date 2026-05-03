var API_BASE = "/api/search";
var state = {
  currentTab: "home",
  searchQuery: "",
  currentVideo: null,
  likedVideos: JSON.parse(localStorage.getItem("yt_liked") || "[]"),
  history: JSON.parse(localStorage.getItem("yt_history") || "[]"),
  subscriptions: ["Marques Brownlee", "Linus Tech Tips", "MrBeast", "Kurzgesagt", "Veritasium"],
  homeTopics: ["Music", "Gaming", "News", "Live", "Vlogs", "Programming", "Cooking", "Podcasts", "Tech", "Movies"],
  homeTopicIndex: 0,
  isLoadingMore: false
};
var currentResults = [];
var currentVideoIndex = -1;
var embedMode = "youtube";
var selectedIndex = -1;
var els = {
  searchInput: document.getElementById("searchInput"),
  autocomplete: document.getElementById("autocomplete"),
  backdrop: document.getElementById("backdrop"),
  searchButton: document.getElementById("searchButton"),
  mainSection: document.getElementById("mainSection"),
  shortsSection: document.getElementById("shortsSection"),
  watchLayout: document.getElementById("watchLayout"),
  resultsGrid: document.getElementById("resultsGrid"),
  shortsGrid: document.getElementById("shortsGrid"),
  mainPlayer: document.getElementById("mainPlayer"),
  pageTitle: document.getElementById("pageTitle"),
  chips: document.querySelectorAll(".chip"),
  sidebarItems: document.querySelectorAll(".sidebar-item"),
  homeLogo: document.getElementById("homeLogo"),
  toast: document.getElementById("toast"),
  likeBtn: document.getElementById("likeBtn"),
  likeText: document.getElementById("likeText"),
  mainEmpty: document.getElementById("mainEmpty"),
  watchTitle: document.getElementById("watchTitle"),
  watchChannelName: document.getElementById("watchChannelName"),
  watchViews: document.getElementById("watchViews"),
  watchDescription: document.getElementById("watchDescription"),
  relatedList: document.getElementById("relatedList"),
  embedYoutube: document.getElementById("embedYoutube"),
  embedTheta: document.getElementById("embedTheta"),
  sidebar: document.getElementById("sidebar"),
  menuToggle: document.getElementById("menuToggle"),
  notificationBtn: document.getElementById("notificationBtn"),
  accountBtn: document.getElementById("accountBtn")
};
function isMobile() {
  return window.innerWidth <= 960;
}
function applyResponsiveSidebar() {
  var body = document.body;
  if (isMobile()) {
    body.classList.remove("sidebar-full");
    body.classList.remove("sidebar-mini");
    body.classList.remove("mobile-sidebar-open");
  } else {
    body.classList.remove("mobile-sidebar-open");
    if (window.innerWidth <= 1200) {
      body.classList.remove("sidebar-full");
      body.classList.add("sidebar-mini");
    } else {
      if (!body.classList.contains("sidebar-full") && !body.classList.contains("sidebar-mini")) {
        body.classList.add("sidebar-full");
      }
    }
  }
}
applyResponsiveSidebar();
window.addEventListener("resize", applyResponsiveSidebar);
els.menuToggle.addEventListener("click", function () {
  var body = document.body;
  if (isMobile()) {
    var isOpen = body.classList.toggle("mobile-sidebar-open");
    if (!isOpen) {
      body.classList.remove("mobile-sidebar-open");
    }
    return;
  }
  if (body.classList.contains("sidebar-full")) {
    body.classList.remove("sidebar-full");
    body.classList.add("sidebar-mini");
  } else if (body.classList.contains("sidebar-mini")) {
    body.classList.remove("sidebar-mini");
    body.classList.add("sidebar-full");
  } else {
    body.classList.add("sidebar-full");
  }
});
els.backdrop.addEventListener("click", function () {
  document.body.classList.remove("mobile-sidebar-open");
});
els.sidebar.addEventListener("click", function (e) {
  if (isMobile()) {
    var item = e.target.closest(".sidebar-item");
    if (item) {
      document.body.classList.remove("mobile-sidebar-open");
    }
  }
});
function fetchSuggestions(query) {
  var url = "https://api.datamuse.com/sug?s=" + encodeURIComponent(query);
  return fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      return data.map(function (item) {
        return item.word;
      });
    })
    .catch(function () {
      return [];
    });
}
function updateAutocomplete() {
  var query = els.searchInput.value.trim();
  els.autocomplete.innerHTML = "";
  selectedIndex = -1;
  if (!query) {
    els.autocomplete.style.display = "none";
    return;
  }
  fetchSuggestions(query).then(function (suggestions) {
    if (!suggestions.length) {
      els.autocomplete.style.display = "none";
      return;
    }
    suggestions.forEach(function (text) {
      var item = document.createElement("div");
      item.className = "autocomplete-item";
      item.innerHTML = '<span class="material-symbols-rounded">search</span><span class="autocomplete-text">' + text + "</span>";
      item.addEventListener("click", function () {
        els.searchInput.value = text;
        els.autocomplete.style.display = "none";
        performSearch(text, false);
      });
      els.autocomplete.appendChild(item);
    });
    els.autocomplete.style.display = "block";
  });
}
els.searchInput.addEventListener("input", updateAutocomplete);
els.searchInput.addEventListener("keydown", function (e) {
  var items = els.autocomplete.querySelectorAll(".autocomplete-item");
  if (e.key === "Enter") {
    e.preventDefault();
    els.autocomplete.style.display = "none";
    performSearch(els.searchInput.value, false);
    return;
  }
  if (!items.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
  } else if (e.key === "Escape") {
    els.autocomplete.style.display = "none";
    return;
  } else {
    return;
  }
  items.forEach(function (item) {
    item.classList.remove("active");
  });
  if (selectedIndex >= 0 && items[selectedIndex]) {
    items[selectedIndex].classList.add("active");
  }
});
document.addEventListener("click", function (e) {
  var clickedInside = els.autocomplete.contains(e.target) || els.searchInput.contains(e.target);
  if (!clickedInside) {
    els.autocomplete.style.display = "none";
  }
});
els.searchButton.addEventListener("click", function () {
  els.autocomplete.style.display = "none";
  performSearch(els.searchInput.value, false);
});
els.homeLogo.addEventListener("click", function () {
  switchTab("home", "");
});
els.chips.forEach(function (chip) {
  chip.addEventListener("click", function () {
    els.chips.forEach(function (c) {
      c.classList.remove("active");
    });
    chip.classList.add("active");
    var q = chip.getAttribute("data-query") || "";
    state.homeTopicIndex = 0;
    state.searchQuery = q;
    switchTab("home", q);
  });
});
els.sidebarItems.forEach(function (item) {
  item.addEventListener("click", function () {
    var page = item.getAttribute("data-page");
    switchTab(page, "");
  });
});
els.notificationBtn.addEventListener("click", function () {
  showToast("You can deploy this site yourself: https://github.com/IHATECAMOUFLAGE/Youtube\n\nJoin https://discord.gg/ujGFjYcuWn for more links and websites like this!");
});
els.accountBtn.addEventListener("click", function () {
  showToast("Account options will be available soon.");
});
function channelAvatarUrl(name) {
  var base = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=";
  return base + encodeURIComponent(name || "YouTube");
}
function truncateTitle(title, max) {
  if (!title) return "";
  if (title.length <= max) return title;
  return title.slice(0, max - 1) + "…";
}
function renderGrid(list, append) {
  if (!append) {
    els.resultsGrid.innerHTML = "";
  }
  if (!list.length && !append) {
    els.mainEmpty.style.display = "block";
    return;
  }
  els.mainEmpty.style.display = "none";
  list.forEach(function (video, index) {
    var card = document.createElement("article");
    card.className = "video-card";
    var thumbUrl = video.thumbnail || "";
    var titleFull = video.title || "";
    var title = truncateTitle(titleFull, 70);
    var channel = video.channel || "";
    var views = video.views || "";
    var duration = video.duration || "";
    card.innerHTML =
      '<div class="thumbnail">' +
      '<img src="' +
      thumbUrl +
      '" onerror="this.src=\'https://via.placeholder.com/320x180\'">' +
      (duration ? '<div class="duration-badge">' + duration + "</div>" : "") +
      "</div>" +
      '<div class="video-info">' +
      '<img class="video-avatar" src="' +
      channelAvatarUrl(channel) +
      '" alt="">' +
      '<div class="video-meta">' +
      '<h3 class="video-title" title="' +
      titleFull.replace(/"/g, "&quot;") +
      '">' +
      title +
      "</h3>" +
      '<p class="video-channel">' +
      channel +
      "</p>" +
      '<p class="video-stats">' +
      views +
      (duration ? " • " + duration : "") +
      "</p>" +
      "</div>" +
      "</div>";
    card.addEventListener("click", function () {
      currentResults = append ? currentResults : list;
      var idx = append ? Array.prototype.indexOf.call(els.resultsGrid.children, card) : index;
      openWatch(idx);
    });
    els.resultsGrid.appendChild(card);
  });
}
function renderStorageGrid(videos) {
  els.resultsGrid.innerHTML = "";
  if (!videos.length) {
    els.mainEmpty.style.display = "block";
    return;
  }
  els.mainEmpty.style.display = "none";
  videos.forEach(function (video, index) {
    var card = document.createElement("article");
    card.className = "video-card";
    var thumbUrl = video.thumbnail || "";
    var titleFull = video.title || "";
    var title = truncateTitle(titleFull, 70);
    var channel = video.channel || "";
    var views = video.views || "";
    var duration = video.duration || "";
    card.innerHTML =
      '<div class="thumbnail">' +
      '<img src="' +
      thumbUrl +
      '" onerror="this.src=\'https://via.placeholder.com/320x180\'">' +
      (duration ? '<div class="duration-badge">' + duration + "</div>" : "") +
      "</div>" +
      '<div class="video-info">' +
      '<img class="video-avatar" src="' +
      channelAvatarUrl(channel) +
      '" alt="">' +
      '<div class="video-meta">' +
      '<h3 class="video-title" title="' +
      titleFull.replace(/"/g, "&quot;") +
      '">' +
      title +
      "</h3>" +
      '<p class="video-channel">' +
      channel +
      "</p>" +
      '<p class="video-stats">' +
      views +
      (duration ? " • " + duration : "") +
      "</p>" +
      "</div>" +
      "</div>";
    card.addEventListener("click", function () {
      currentResults = videos.slice();
      openWatch(index);
    });
    els.resultsGrid.appendChild(card);
  });
}
function performSearch(query, append) {
  if (!query) query = "";
  state.searchQuery = query;
  els.searchInput.value = query;
  if (!append) {
    els.mainEmpty.style.display = "none";
    els.resultsGrid.innerHTML = '<div class="loader"></div>';
  }
  return fetch(API_BASE + "?query=" + encodeURIComponent(query))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var results = data.results || [];
      if (!append) {
        currentResults = results;
        state.currentTab = "search";
        els.mainSection.classList.remove("hidden");
        els.shortsSection.classList.add("hidden");
        els.watchLayout.classList.add("hidden");
        els.watchLayout.classList.remove("active");
        els.pageTitle.style.display = "none";
        renderGrid(currentResults, false);
      } else {
        currentResults = currentResults.concat(results);
        renderGrid(results, true);
      }
      return results;
    })
    .catch(function () {
      if (!append) {
        els.resultsGrid.innerHTML =
          '<div class="empty-state"><span class="material-symbols-rounded">error</span><p>Error loading results.</p></div>';
      }
      return [];
    });
}
function openWatch(index) {
  if (!currentResults.length || !currentResults[index]) return;
  currentVideoIndex = index;
  var video = currentResults[index];
  var id = video.id;
  var title = video.title || "";
  var channel = video.channel || "YouTube";
  var views = video.views || "";
  state.currentVideo = video;
  saveToHistory(video);
  els.watchTitle.textContent = title;
  els.watchChannelName.textContent = channel;
  els.watchViews.textContent = views;
  els.watchDescription.textContent = "Playing: " + title + " • Channel: " + channel;
  setEmbedMode(embedMode, id);
  renderRelated(index);
  els.mainSection.classList.add("hidden");
  els.shortsSection.classList.add("hidden");
  els.watchLayout.classList.remove("hidden");
  els.watchLayout.classList.add("active");
  updateLikeButtonState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderRelated(activeIndex) {
  els.relatedList.innerHTML = "";
  currentResults.forEach(function (video, index) {
    if (index === activeIndex) return;
    var item = document.createElement("div");
    item.className = "related-item";
    var thumbUrl = video.thumbnail || "";
    var titleFull = video.title || "";
    var title = truncateTitle(titleFull, 70);
    var channel = video.channel || "";
    var views = video.views || "";
    var duration = video.duration || "";
    item.innerHTML =
      '<div class="related-thumb">' +
      '<img src="' +
      thumbUrl +
      '" onerror="this.src=\'https://via.placeholder.com/168x94\'">' +
      "</div>" +
      '<div class="related-info">' +
      '<div class="related-title" title="' +
      titleFull.replace(/"/g, "&quot;") +
      '">' +
      title +
      "</div>" +
      '<div class="related-channel">' +
      channel +
      "</div>" +
      '<div class="related-stats">' +
      views +
      (duration ? " • " + duration : "") +
      "</div>" +
      "</div>";
    item.addEventListener("click", function () {
      openWatch(index);
    });
    els.relatedList.appendChild(item);
  });
}
function setEmbedMode(mode, id) {
  embedMode = mode;
  els.embedYoutube.classList.remove("active");
  els.embedTheta.classList.remove("active");

  if (mode === "youtube") {
    els.embedYoutube.classList.add("active");
    els.mainPlayer.src =
      "https://www.youtube.com/embed/" +
      encodeURIComponent(id) +
      "?autoplay=1&rel=0&modestbranding=1";
  } else {
  els.embedTheta.classList.add("active");
  fetch(
      "/api/fetch?url=" +
        encodeURIComponent("https://www.youtube.com/watch?v=" + id)
    )
      .then(r => r.json())
      .then(data => {
        const media = data.medias && data.medias[0];
        if (!media || !media.url) {
          els.mainPlayer.src = "";
          return;
        }

        const encoded = encodeURIComponent(media.url);
        els.mainPlayer.src = "/api/encode?url=" + encoded;
      });
}   
    }
els.embedYoutube.addEventListener("click", function () {
  if (currentVideoIndex < 0 || !currentResults[currentVideoIndex]) return;
  setEmbedMode("youtube", currentResults[currentVideoIndex].id);
});
els.embedTheta.addEventListener("click", function () {
  if (currentVideoIndex < 0 || !currentResults[currentVideoIndex]) return;
  setEmbedMode("thetacloud", currentResults[currentVideoIndex].id);
});
function saveToHistory(video) {
  state.history = state.history.filter(function (v) {
    return v.id !== video.id;
  });
  state.history.unshift(video);
  if (state.history.length > 50) state.history.pop();
  localStorage.setItem("yt_history", JSON.stringify(state.history));
}
function toggleLike(video) {
  var index = state.likedVideos.findIndex(function (v) {
    return v.id === video.id;
  });
  if (index === -1) {
    state.likedVideos.unshift(video);
    showToast("Added to Liked videos");
  } else {
    state.likedVideos.splice(index, 1);
    showToast("Removed from Liked videos");
  }
  localStorage.setItem("yt_liked", JSON.stringify(state.likedVideos));
  updateLikeButtonState();
}
function isLiked(videoId) {
  return state.likedVideos.some(function (v) {
    return v.id === videoId;
  });
}
function updateLikeButtonState() {
  if (!state.currentVideo) return;
  var liked = isLiked(state.currentVideo.id);
  if (liked) {
    els.likeBtn.classList.add("liked");
    els.likeText.textContent = "Liked";
  } else {
    els.likeBtn.classList.remove("liked");
    els.likeText.textContent = "Like";
  }
}
els.likeBtn.addEventListener("click", function () {
  if (!state.currentVideo) return;
  toggleLike(state.currentVideo);
});
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(function () {
    els.toast.classList.remove("show");
  }, 3000);
}
function loadShortsFeed() {
  els.shortsGrid.innerHTML = "";
  var baseQuery = state.searchQuery || "YouTube";
  if (!/shorts/i.test(baseQuery)) {
    baseQuery = baseQuery + " shorts";
  }
  performSearch(baseQuery, false).then(function (results) {
    els.shortsGrid.innerHTML = "";
    if (!results.length) {
      els.shortsGrid.innerHTML =
        '<div class="empty-state"><span class="material-symbols-rounded">movie</span><p>No shorts available.</p></div>';
      return;
    }
    results.slice(0, 20).forEach(function (video, index) {
      var card = document.createElement("div");
      card.className = "shorts-card";
      var thumbUrl = video.thumbnail || "";
      var titleFull = video.title || "";
      var title = truncateTitle(titleFull, 60);
      card.innerHTML =
        '<div class="thumbnail">' +
        '<img src="' +
        thumbUrl +
        '" onerror="this.src=\'https://via.placeholder.com/200x356\'">' +
        "</div>" +
        '<h3 class="video-title" title="' +
        titleFull.replace(/"/g, "&quot;") +
        '">' +
        title +
        "</h3>";
      card.addEventListener("click", function () {
        currentResults = results;
        openWatch(index);
      });
      els.shortsGrid.appendChild(card);
    });
  });
}
function loadHomeFeed(initial) {
  if (state.isLoadingMore) return;
  state.isLoadingMore = true;
  var topicsToLoad = initial ? 3 : 1;
  var promises = [];
  for (var i = 0; i < topicsToLoad; i++) {
    var topic = state.searchQuery;
    if (!topic) {
      if (state.homeTopics.length === 0) break;
      topic = state.homeTopics[state.homeTopicIndex % state.homeTopics.length];
      state.homeTopicIndex++;
    }
    promises.push(
      fetch(API_BASE + "?query=" + encodeURIComponent(topic))
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          return data.results || [];
        })
        .catch(function () {
          return [];
        })
    );
  }
  Promise.all(promises).then(function (allResults) {
    var flat = [];
    allResults.forEach(function (arr) {
      flat = flat.concat(arr);
    });
    if (initial) {
      currentResults = flat;
      renderGrid(currentResults, false);
    } else {
      currentResults = currentResults.concat(flat);
      renderGrid(flat, true);
    }
    state.isLoadingMore = false;
  });
}
window.addEventListener("scroll", function () {
  if (state.currentTab !== "home") return;
  var scrollPos = window.innerHeight + window.scrollY;
  var threshold = document.body.offsetHeight - 600;
  if (scrollPos >= threshold) {
    loadHomeFeed(false);
  }
});
function loadSubscriptionsFeed() {
  els.resultsGrid.innerHTML = '<div class="loader"></div>';
  var promises = state.subscriptions.map(function (name) {
    return fetch(API_BASE + "?query=" + encodeURIComponent(name))
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        return data.results || [];
      })
      .catch(function () {
        return [];
      });
  });
  Promise.all(promises).then(function (lists) {
    var combined = [];
    lists.forEach(function (arr) {
      combined = combined.concat(arr);
    });
    currentResults = combined;
    renderGrid(currentResults, false);
  });
}
function switchTab(tabName, query) {
  state.currentTab = tabName;
  els.mainSection.classList.add("hidden");
  els.shortsSection.classList.add("hidden");
  els.watchLayout.classList.add("hidden");
  els.watchLayout.classList.remove("active");
  els.sidebarItems.forEach(function (item) {
    if (item.dataset.page === tabName) item.classList.add("active");
    else item.classList.remove("active");
  });
  if (tabName === "home") {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "none";
    if (query) {
      state.searchQuery = query;
      performSearch(query, false);
    } else {
      state.searchQuery = "";
      state.homeTopicIndex = 0;
      loadHomeFeed(true);
    }
  } else if (tabName === "shorts") {
    els.shortsSection.classList.remove("hidden");
    loadShortsFeed();
  } else if (tabName === "history") {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "block";
    els.pageTitle.textContent = "Watch History";
    renderStorageGrid(state.history);
  } else if (tabName === "liked") {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "block";
    els.pageTitle.textContent = "Liked Videos";
    renderStorageGrid(state.likedVideos);
  } else if (tabName === "library") {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "block";
    els.pageTitle.textContent = "Library";
    var librarySet = new Set(
      []
        .concat(state.history, state.likedVideos)
        .map(function (v) {
          return JSON.stringify(v);
        })
    );
    var libraryList = Array.from(librarySet).map(function (s) {
      return JSON.parse(s);
    });
    renderStorageGrid(libraryList);
  } else if (tabName === "subscriptions") {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "block";
    els.pageTitle.textContent = "Latest from Subscriptions";
    loadSubscriptionsFeed();
  } else {
    els.mainSection.classList.remove("hidden");
    els.pageTitle.style.display = "none";
    performSearch(query, false);
  }
}
switchTab("home", "");
