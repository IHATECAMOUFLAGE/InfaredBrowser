function addTab(url) {
    const tabcontainer = document.querySelector('.tab-container');
    const tabs = tabcontainer.querySelectorAll('[data-url]');
    if (tabs.length >= 10) {
        alert("You can only have 10 tabs open");
        return;
    }

    const element = document.createElement('span');
    const closebutton = document.createElement('span');
    closebutton.classList.add('tab-close');
    closebutton.innerHTML = '<i class="fa-solid fa-x"></i>';

    const title = url === 'chrome://newtab' ? 'New Tab' : url;
    element.appendChild(document.createTextNode(title));
    element.appendChild(closebutton);

    element.setAttribute('data-url', url);
    tabcontainer.insertBefore(element, tabcontainer.lastElementChild);

    const iframe = document.createElement('iframe');
    iframe.classList.add('tab-frame');
    iframe.style.display = 'none';
    iframe.src = url.startsWith('chrome://') ? 'https://example.com' : url;
    document.querySelector('.window').appendChild(iframe);
    element._iframe = iframe;

    closebutton.addEventListener('click', e => {
        e.stopPropagation();
        const tabs = tabcontainer.querySelectorAll('[data-url]');
        if (tabs.length > 1) {
            if (element._iframe) element._iframe.remove();
            const wasActive = element.classList.contains('active-tab');
            element.remove();
            updateAllTabs();
            const remaining = tabcontainer.querySelectorAll('[data-url]');
            if (wasActive && remaining.length > 0) {
                setActiveTab(remaining[remaining.length - 1]);
            }
        }
    });

    element.addEventListener('click', () => {
        setActiveTab(element);
        const input = document.querySelector('.input input');
        input.value = element.getAttribute('data-url') || '';
    });

    updateAllTabs();
    setActiveTab(element);
}

function updateAllTabs() {
    const tabs = document.querySelectorAll('.tab-container [data-url]');
    if (tabs.length === 1) {
        tabs[0].lastChild.classList.add('onlytab');
    } else {
        tabs.forEach(t => t.lastChild.classList.remove('onlytab'));
    }
}

function showNotification(text) {
    const box = document.getElementById('notification');
    const textSpan = document.getElementById('notification-text');
    const closeBtn = document.getElementById('notification-close');
    textSpan.textContent = text;
    box.classList.add('show');
    closeBtn.onclick = () => box.classList.remove('show');
}

alert = text => showNotification(text);

function loadPage(url) {
    const active = getActiveTab();
    if (!active) return;

    const iframe = active._iframe;
    iframe.src = url.startsWith('chrome://') ? 'https://example.com' : url;

    const input = document.querySelector('.input input');
    input.value = url;

    active.setAttribute('data-url', url);
    const short = url.length > 15 ? url.slice(0, 15) + "..." : url;
    active.firstChild.nodeValue = short;
}

function setupInput() {
    const input = document.querySelector('.input input');
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            let url = input.value.trim();
            if (!url.startsWith('http') && !url.startsWith('chrome://')) {
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1&source=hp`;
            } else if (url.startsWith('chrome://')) {
                url = `chrome://${url.split('chrome://')[1]}`;
            }
            loadPage(url);
        }
    });
}

function setActiveTab(tab) {
    const tabs = document.querySelectorAll('.tab-container [data-url]');
    tabs.forEach(t => {
        t.classList.remove('active-tab');
        if (t._iframe) t._iframe.style.display = 'none';
    });

    tab.classList.add('active-tab');
    if (tab._iframe) tab._iframe.style.display = 'block';

    const input = document.querySelector('.input input');
    input.value = tab.getAttribute('data-url') || '';
}

function getActiveTab() {
    return document.querySelector('.active-tab');
}

function initialLoad() {
    addTab('chrome://newtab');
    setupInput();
}

window.addEventListener('offline', () => alert('Please connect to WIFI to continue using this page'));

document.addEventListener('DOMContentLoaded', () => initialLoad());

