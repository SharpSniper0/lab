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

// --- Parkour Bot Logic ---
const bot = document.getElementById('parkour-bot');

if (bot) {
    let scrollTimeout;
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const speed = Math.abs(currentScrollY - lastScrollY);

        // Clear previous idle timeout
        clearTimeout(scrollTimeout);

        // Determine Action
        if (speed > 40) { // Fast scroll = Jump
            bot.classList.add('jumping');
            bot.classList.remove('running');
        } else if (speed > 5) { // Slow scroll = Run
            bot.classList.remove('jumping');
            bot.classList.add('running');
        }

        // Face direction
        if (currentScrollY > lastScrollY) {
            bot.style.transform = 'scaleX(1)';
        } else {
            bot.style.transform = 'scaleX(-1)';
        }

        // Stop logic
        scrollTimeout = setTimeout(() => {
            bot.classList.remove('running', 'jumping');
        }, 100);

        lastScrollY = currentScrollY;
    });
}
