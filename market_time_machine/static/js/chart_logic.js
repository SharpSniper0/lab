let chart;
let simulationData = null;
let currentStep = 0;
let portfolioClean = 10000;
let allocation = {};
let interval;

function filterTickers() {
    const query = document.getElementById('ticker-search').value.toUpperCase();
    const rows = document.querySelectorAll('.asset-row');
    rows.forEach(row => {
        const ticker = row.querySelector('.mono').innerText;
        if (ticker.includes(query)) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
}

async function init() {
    // 1. Fetch Data
    const response = await fetch(`/api/data/${ERA_ID}`);
    simulationData = await response.json();

    // 2. Setup Chart
    const ctx = document.getElementById('marketChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Time
            datasets: [
                {
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: '#00ff9d',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: '#1f222a' } },
                y: { grid: { color: '#1f222a' } }
            },
            plugins: { legend: { display: false } }, // Minimal look
            animation: false // Performance
        }
    });
}

function updateAllocation() {
    let totalUsed = 0;
    let totalLong = 0;
    let totalShort = 0;

    const sliders = document.querySelectorAll('.allocation-slider');

    sliders.forEach(slider => {
        let val = parseInt(slider.value);
        let ticker = slider.dataset.ticker;

        let label = slider.nextElementSibling;
        label.innerText = val + "%";

        // Color Cues
        if (val < 0) {
            label.style.color = '#ff3b30'; // Red for Short
            totalShort += Math.abs(val);
        } else if (val > 0) {
            label.style.color = '#30d158'; // Green for Long
            totalLong += Math.abs(val);
        } else {
            label.style.color = '#666';
        }

        allocation[ticker] = val / 100;
        totalUsed += Math.abs(val); // Capital used is absolute
    });

    document.getElementById('total-alloc').innerText = totalUsed;

    // --- Update Visualization Cockpit ---

    // 1. Leverage Meter
    const leverageBar = document.getElementById('leverage-bar');
    const leverageVal = document.getElementById('leverage-val');

    // Scale: 0 to 200% map to 0-100% width
    // Actually, let's max out at 200% visually
    let visualWidth = Math.min((totalUsed / 200) * 100, 100);

    leverageBar.style.width = visualWidth + "%";
    leverageVal.innerText = totalUsed + "%";

    // Dynamic Color for Leverage
    if (totalUsed > 100) {
        leverageBar.style.background = '#ff3b30'; // Danger Red
        leverageVal.style.color = '#ff3b30';
    } else if (totalUsed > 80) {
        leverageBar.style.background = '#ff9f0a'; // Warning Orange
        leverageVal.style.color = '#ff9f0a';
    } else {
        leverageBar.style.background = '#30d158'; // Safe Green
        leverageVal.style.color = '#30d158';
    }

    // 2. Composition Bar
    const compLong = document.getElementById('comp-long');
    const compCash = document.getElementById('comp-cash');
    const compShort = document.getElementById('comp-short');

    // Visual Model: [ Long ] [ Cash ] [ Short ]
    // If Used > 100%, Cash is 0 and we rescale Long/Short to fit container
    let cashWidth = Math.max(0, 100 - totalUsed);

    if (totalUsed > 100) {
        // Rescale to fit 100% visual space
        let total = totalLong + totalShort;
        compLong.style.width = (totalLong / total * 100) + "%";
        compShort.style.width = (totalShort / total * 100) + "%";
        compCash.style.width = "0%";
    } else {
        compLong.style.width = totalLong + "%";
        compShort.style.width = totalShort + "%";
        compCash.style.width = cashWidth + "%";
    }

    if (totalUsed > 100) document.getElementById('total-alloc').style.color = '#ff3b30';
    else document.getElementById('total-alloc').style.color = '#666';
}

function startSimulation() {
    if (!simulationData) return;

    // Check exposure
    // Check exposure
    let totalExposure = Object.values(allocation).reduce((a, b) => a + Math.abs(b), 0);
    if (totalExposure > 2.05) { // Allow up to 200%
        log("ERROR: Exposure > 200%");
        alert("Margin Call! You cannot exceed 200% leverage.");
        return;
    }

    // Reset
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    currentStep = 0;
    portfolioClean = 10000;
    clearInterval(interval);

    log("Started simulation...");
    interval = setInterval(step, 500);
}

function step() {
    if (currentStep >= simulationData.market_data.timestamps.length) {
        clearInterval(interval);
        log("SIMULATION COMPLETE.");
        return;
    }

    const timestamp = simulationData.market_data.timestamps[currentStep];
    const prices = simulationData.market_data.prices;

    // Calculate Portfolio Value
    let currentValue = 0;

    if (currentStep === 0) {
        currentValue = 10000; // Start
    } else {
        // Value = Cash + Positions
        let totalExposure = 0;

        Object.keys(allocation).forEach(ticker => {
            const ratio = allocation[ticker]; // e.g., -0.5 or 0.5
            totalExposure += Math.abs(ratio);

            const startPrice = prices[ticker][0];
            const currentPrice = prices[ticker][currentStep];
            const dollarsInvested = 10000 * Math.abs(ratio);

            if (ratio >= 0) {
                // LONG
                currentValue += dollarsInvested * (currentPrice / startPrice);
            } else {
                // SHORT
                // Multiplier = 2 - (Current/Start). 
                let multiplier = 2 - (currentPrice / startPrice);
                currentValue += dollarsInvested * multiplier;
            }
        });

        // Add remaining cash
        currentValue += 10000 * (1 - totalExposure);
    }

    // Update Chart
    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(currentValue);
    chart.update();

    // Update UI
    document.getElementById('current-value').innerText = "$" + Math.round(currentValue).toLocaleString();
    if (currentValue >= 10000) document.getElementById('current-value').className = "portfolio-value green";
    else document.getElementById('current-value').className = "portfolio-value red";

    // Check Events
    const events = simulationData.events;
    // Find event that matches CURRENT timestamp
    const event = events.find(e => e.date === timestamp);
    if (event) {
        log(`EVENT: [${event.title}] - ${event.description}`);
        showNews(event.title, event.description);
    }

    currentStep++;
}

function showNews(title, desc) {
    const el = document.getElementById('news-banner');
    document.getElementById('news-title').innerText = title;
    document.getElementById('news-desc').innerText = desc;

    el.classList.add('active');

    // Pause briefly
    if (interval) clearInterval(interval);

    // Hide after 4s
    setTimeout(() => {
        el.classList.remove('active');
        if (currentStep < simulationData.market_data.timestamps.length) {
            interval = setInterval(step, 500);
        }
    }, 4000);
}

function log(msg) {
    const logDiv = document.getElementById('event-log');

    // Create new entry
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    // Timestamp (Mock)
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });

    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;

    logDiv.prepend(entry);
}


// Init
init();
window.onload = updateAllocation; // Set initial 0s
