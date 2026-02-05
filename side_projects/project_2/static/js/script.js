document.addEventListener('DOMContentLoaded', () => {
    // --- Tabs Logic ---
    window.openTab = function (tabName) {
        var i, tabContent, tabBtn;

        tabContent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabContent.length; i++) {
            tabContent[i].classList.remove("active");
            tabContent[i].style.display = "none"; // Ensure hidden
        }

        tabBtn = document.getElementsByClassName("tab-btn");
        for (i = 0; i < tabBtn.length; i++) {
            tabBtn[i].classList.remove("active");
        }

        document.getElementById(tabName).style.display = "block";
        setTimeout(() => {
            document.getElementById(tabName).classList.add("active");
        }, 10);

        // Highlight Active Button
        for (i = 0; i < tabBtn.length; i++) {
            if (tabBtn[i].getAttribute('onclick').includes(tabName)) {
                tabBtn[i].classList.add('active');
            }
        }
    }

    // Initialize first tab
    openTab('history');

    // --- Header Scrolled State ---
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- Leaflet Map Logic ---
    if (document.getElementById('travel-map')) {
        initMap();
    }
});

function initMap() {
    var map = L.map('travel-map', {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: false,
        minZoom: 2
    });

    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        fillColor: 'transparent',
                        weight: 1,
                        opacity: 0.2,
                        color: '#ffffff',
                        fillOpacity: 0
                    };
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        });
}

function onEachFeature(feature, layer) {
    const countryId3 = feature.id;
    if (typeof visitedCountries !== 'undefined' && visitedCountries.includes(countryId3)) {
        layer.setStyle({
            fillColor: '#2997ff',
            fillOpacity: 0.6,
            color: '#2997ff',
            weight: 1.5,
            opacity: 1
        });
        layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Visited ✅`);
        layer.on('mouseover', function () {
            this.openPopup();
            this.setStyle({ fillOpacity: 1 });
        });
        layer.on('mouseout', function () {
            this.closePopup();
            this.setStyle({ fillOpacity: 0.8 });
        });
    } else {
        layer.bindTooltip(feature.properties.name);
        layer.on('mouseover', function () {
            this.setStyle({ fillColor: '#555' });
        });
        layer.on('mouseout', function () {
            this.setStyle({ fillColor: '#333' });
        });
    }
}

// --- Henry Stickmin Parkour Logic ---
const bot = document.getElementById('parkour-bot');

if (bot) {
    // 1. Mobile & Persistence Check
    // Hide if screen is too narrow (< 900px) OR if user dismissed him
    if (window.innerWidth < 900 || localStorage.getItem('bot_dismissed') === 'true') {
        bot.remove();
    } else {
        initBot();
    }
}

function initBot() {
    let currentTarget = null;
    let isJumping = false;
    let idleInterval = null;

    // 2. Inject Dismiss Button
    const btn = document.createElement('div');
    btn.className = 'bot-dismiss';
    btn.innerHTML = '×';
    btn.title = 'Dismiss Bot';
    btn.onclick = (e) => {
        e.stopPropagation();
        bot.style.transition = 'all 0.4s ease-in';
        bot.style.transform = 'scale(0) rotate(180deg)';
        bot.style.opacity = '0';
        setTimeout(() => bot.remove(), 400);
        localStorage.setItem('bot_dismissed', 'true');
    };
    bot.appendChild(btn);

    // 3. User Interaction: Click to Wave
    bot.addEventListener('click', () => {
        if (isJumping) return;
        bot.classList.remove('sitting', 'idle-foot-tap', 'idle-adjust-glasses', 'action-clean-window', 'action-balance');
        bot.classList.add('interactive-wave');
        setTimeout(() => {
            bot.classList.remove('interactive-wave');
            bot.classList.add('sitting');
        }, 1200);
    });

    // 4. Idle System
    function startIdleLoop() {
        if (idleInterval) clearInterval(idleInterval);
        idleInterval = setInterval(() => {
            if (isJumping || document.hidden || !bot.classList.contains('sitting')) return;

            const roll = Math.random();
            if (roll < 0.3) {
                bot.classList.add('idle-foot-tap');
                setTimeout(() => bot.classList.remove('idle-foot-tap'), 2000);
            } else if (roll < 0.5) {
                bot.classList.add('idle-adjust-glasses');
                setTimeout(() => bot.classList.remove('idle-adjust-glasses'), 2500);
            }
        }, 8000);
    }
    startIdleLoop();

    // 5. Movement Logic
    function getTargets() {
        return Array.from(document.querySelectorAll('.video-card, .card, #travel-map, h1'));
    }

    function updatePos() {
        if (isJumping) return;

        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const focusLine = scrollY + (viewportHeight * 0.3);

        const targets = getTargets();
        let bestTarget = null;
        let minDistance = Infinity;

        targets.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elTopAbs = rect.top + scrollY;

            if (rect.bottom > 0 && rect.top < viewportHeight) {
                const dist = Math.abs(elTopAbs - focusLine);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestTarget = el;
                }
            }
        });

        if (bestTarget && bestTarget !== currentTarget) {
            jumpTo(bestTarget);
        } else if (!currentTarget && bestTarget) {
            jumpTo(bestTarget);
        }
    }

    function jumpTo(element) {
        if (isJumping) return;
        isJumping = true;

        bot.className = '';
        currentTarget = element;

        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;

        let endLeft;
        const isTitle = element.tagName === 'H1';
        if (isTitle) {
            endLeft = rect.left + 20;
        } else {
            endLeft = (rect.left + rect.width) - 60;
        }

        const startLeft = parseFloat(bot.style.left) || 0;
        const startTop = parseFloat(bot.style.top) || 0;

        // HEIGHT FIX: -35px to sit flush
        const endTop = (rect.top + scrollY) - 35;

        bot.style.transform = endLeft < startLeft ? 'scaleX(-1)' : 'scaleX(1)';

        const isFalling = endTop > (startTop + 100);
        if (isFalling) bot.classList.add('falling');
        else bot.classList.add('jumping-arc');

        bot.style.top = `${endTop}px`;
        bot.style.left = `${endLeft}px`;

        const duration = isFalling ? 800 : 700;

        setTimeout(() => {
            bot.className = '';
            bot.classList.add('sitting');
            isJumping = false;

            // QUIRKS
            if (element.classList.contains('video-card') || element.classList.contains('card')) {
                if (Math.random() < 0.4) {
                    bot.classList.remove('sitting');
                    bot.classList.add('action-clean-window');
                    setTimeout(() => {
                        bot.classList.remove('action-clean-window');
                        bot.classList.add('sitting');
                    }, 2500);
                }
            } else if (element.id === 'travel-map') {
                if (Math.random() < 0.5) {
                    bot.classList.remove('sitting');
                    bot.classList.add('action-balance');
                    setTimeout(() => {
                        bot.classList.remove('action-balance');
                        bot.classList.add('sitting');
                    }, 2000);
                }
            }
        }, duration);
    }

    setInterval(updatePos, 300);

    const h1 = document.querySelector('h1');
    if (h1) {
        const rect = h1.getBoundingClientRect();
        bot.style.top = `${rect.top - 35}px`;
        bot.style.left = `${rect.left + 20}px`;
        currentTarget = h1;
        bot.classList.add('sitting');
    }
}
