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
    let total = 0;
    const sliders = document.querySelectorAll('.allocation-slider');

    sliders.forEach(slider => {
        let val = parseInt(slider.value);
        let ticker = slider.dataset.ticker;

        // Simple clamp logic could go here to prevent > 100%

        slider.nextElementSibling.innerText = val + "%";
        allocation[ticker] = val / 100;
        total += val;
    });

    document.getElementById('total-alloc').innerText = total;
    if (total > 100) document.getElementById('total-alloc').style.color = 'red';
    else document.getElementById('total-alloc').style.color = '#666';
}

function startSimulation() {
    if (!simulationData) return;

    // Check if allocation <= 100
    let total = Object.values(allocation).reduce((a, b) => a + b, 0);
    if (total > 1.0) {
        log("ERROR: Allocation exceeds 100%");
        return;
    }

    // Reset
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    currentStep = 0;
    portfolioClean = 10000;
    clearInterval(interval);

    // Initial Investment Distro
    // We track "shares" effectively 
    // For MVP: We just track % growth of each slice

    // Run Loop
    log("Started simulation...");
    interval = setInterval(step, 500); // 500ms per month
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
        // This is a simplified calculation:
        // Value = Sum (Initial Allocation $ * (CurrentPrice / StartPrice))
        // Assumes "Buy and Hold" at Step 0

        Object.keys(allocation).forEach(ticker => {
            const startPrice = prices[ticker][0];
            const currentPrice = prices[ticker][currentStep];
            const allocatedCash = 10000 * allocation[ticker];

            const positionValue = allocatedCash * (currentPrice / startPrice);
            currentValue += positionValue;
        });

        // Add unallocated cash (assumed 0% growth)
        let allocatedPercent = Object.values(allocation).reduce((a, b) => a + b, 0);
        currentValue += 10000 * (1 - allocatedPercent);
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
