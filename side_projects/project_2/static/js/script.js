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
        // Small delay to allow display:block to apply before adding class (for potential animations)
        setTimeout(() => {
            document.getElementById(tabName).classList.add("active");
        }, 10);

        // Find the button that called this and add active? 
        // We'll just loop through buttons and match text or index logic if clearer, 
        // but cleaner is to use event.currentTarget if passed.
        // For simplicity with inline onclick, we loop:
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
    // Initialize map
    var map = L.map('travel-map', {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: false, // Prevent page scroll jank
        minZoom: 2
    });

    // Base Layer Removed for Wireframe Mode (Seamless Black)

    // Fetch World GeoJSON
    // Using a reliable lightweight GeoJSON source
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        fillColor: 'transparent',
                        weight: 1,
                        opacity: 0.2,
                        color: '#ffffff', // White wireframe lines
                        fillOpacity: 0
                    };
                },
                onEachFeature: onEachFeature
            }).addTo(map);
        });
}

function onEachFeature(feature, layer) {
    // Check match (Simple name check or ID override)
    // We already defined `visitedCountries` in index.html (e.g., ["US", "JP"])

    // Mapping 2-char to 3-char manually or loosely matching name?
    // Let's use a robust mapping or specific overrides.
    // Actually, converting the GeoJSON ID to 2-char is hard without a library.
    // Changing content.json to 3-char is easier. I will update content.json in the next step to be 3-char.

    const countryId3 = feature.id; // e.g., USA

    // Quick Hack: If I use 3-char in content.json, this is easy.
    // I will assume visitedCountries has 3-char codes.

    if (visitedCountries.includes(countryId3)) {
        layer.setStyle({
            fillColor: '#2997ff', // Site Accent (Apple Blue)
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
        // Hover effect for non-visited
        layer.bindTooltip(feature.properties.name);
        layer.on('mouseover', function () {
            this.setStyle({
                fillColor: '#555'
            });
        });
        layer.on('mouseout', function () {
            this.setStyle({
                fillColor: '#333'
            });
        });
    }
}

// --- Henry Stickmin Parkour Logic ---
const bot = document.getElementById('parkour-bot');

if (bot) {
    let currentTarget = null;
    let isJumping = false;
    let walkInterval = null;

    function getTargets() {
        return Array.from(document.querySelectorAll('.video-card, .card, #travel-map, h1'));
    }

    function updatePos() {
        if (isJumping) return;

        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;
        const focusLine = scrollY + (viewportHeight * 0.3); // Look slightly up

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
            // Initial spawn case if not already handled
            jumpTo(bestTarget);
        }
    }

    function jumpTo(element) {
        isJumping = true;
        clearInterval(walkInterval); // Stop any walking

        currentTarget = element;
        bot.classList.remove('sitting', 'walking');
        bot.classList.add('jumping-arc');

        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;

        // Determine Land Spot
        const isTitle = element.tagName === 'H1';
        let endLeft;

        if (isTitle) {
            endLeft = rect.left; // Start at left of Title
        } else {
            // Sit near right edge for cards
            endLeft = (rect.left + rect.width) - 60;
        }

        // Face direction
        const startLeft = parseFloat(bot.style.left) || 0;
        bot.style.transform = endLeft < startLeft ? 'scaleX(-1)' : 'scaleX(1)';

        // Move
        bot.style.top = `${(rect.top + scrollY) - 85}px`;
        bot.style.left = `${endLeft}px`;

        // Land
        setTimeout(() => {
            bot.classList.remove('jumping-arc');
            isJumping = false;

            if (isTitle) {
                startPatrol(element);
            } else {
                bot.classList.add('sitting');
            }
        }, 600);
    }

    function startPatrol(element) {
        bot.classList.add('walking');
        let direction = 1;

        walkInterval = setInterval(() => {
            if (isJumping) return;
            const rect = element.getBoundingClientRect();
            const currentLeft = parseFloat(bot.style.left) || 0;
            const speed = 2; // px per tick

            // Bounds
            const maxLeft = rect.left + rect.width - 40;
            const minLeft = rect.left;

            let newLeft = currentLeft + (speed * direction);

            // Turn around
            if (newLeft > maxLeft) {
                direction = -1;
                bot.style.transform = 'scaleX(-1)';
            } else if (newLeft < minLeft) {
                direction = 1;
                bot.style.transform = 'scaleX(1)';
            }

            bot.style.left = `${newLeft}px`;
        }, 20);
    }

    // Run loop
    setInterval(updatePos, 300);

    // Initial spawn on H1
    const h1 = document.querySelector('h1');
    if (h1) {
        const rect = h1.getBoundingClientRect();
        bot.style.top = `${rect.top - 70}px`; // Adjusted for bot height
        bot.style.left = `${rect.left}px`;
        currentTarget = h1; // Set initial target
        startPatrol(h1); // Start walking immediately
    }
}
