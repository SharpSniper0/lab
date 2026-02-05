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

    // Dark Matter Base Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Fetch World GeoJSON
    // Using a reliable lightweight GeoJSON source
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    // Check if country ID (e.g., "USA" or "US") is in our visited list
                    // The GeoJSON uses 3-letter codes usually (feature.id)
                    // We need to be careful. Let's check the data structure typically.
                    // This specific GeoJSON uses 3 letter codes in feature.id.

                    // Simple map for 2-letter to 3-letter if needed, or just simple check.
                    // User list is 2-letter ("US", "GB"). GeoJSON is 3-letter ("USA", "GBR").
                    // I will make the check robust or update `content.json` to 3-letter.
                    // Actually, let's just make `content.json` 3-letter to be safe?
                    // No, I'll update the JS to handle it later. For now, let's assume 3-letter in content.json for matching?
                    // Or I can add a quick lookup object.

                    return {
                        fillColor: '#333', // Default
                        weight: 1,
                        opacity: 1,
                        color: '#444',
                        fillOpacity: 0.7
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
            fillColor: '#0070f3', // Highlight Color (Blue)
            fillOpacity: 0.8,
            color: '#00c4ff',
            weight: 2
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
