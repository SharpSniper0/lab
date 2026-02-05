// Editor Logic
async function saveContent() {
    // 1. Gather Data (Simplified for Demo: Reads just the inputs we showed)
    // In a full app, we'd reconstruct the JSON object carefully.
    // For this prototype, we'll just alert success to show functionality.

    const intro = document.querySelector('input[name="home.headline"]').value;
    const body = document.querySelector('textarea[name="home.intro"]').value;

    // Construct partial object
    const payload = {
        home: {
            headline: intro,
            intro: body,
            subheadline: "Driving value through judgment." // Hardcoded for demo safety
        },
        cases: [
            {
                title: document.querySelector('input[name="cases[0].title"]').value,
                context: document.querySelector('textarea[name="cases[0].context"]').value,
                decision: document.querySelector('textarea[name="cases[0].decision"]').value,
                outcome: document.querySelector('textarea[name="cases[0].outcome"]').value
            }
        ],
        memos: []
    };

    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) alert("Saved successfully!");
    } catch (e) {
        alert("Error saving: " + e);
    }
}

async function refineText(elementId) {
    const el = document.getElementById(elementId);
    const originalText = el.value;
    const btn = el.nextElementSibling;

    btn.innerText = "✨ Refining...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: originalText })
        });

        const data = await response.json();
        if (data.suggestion) {
            el.value = data.suggestion;
        }
    } catch (e) {
        alert("AI Error: " + e);
    } finally {
        btn.innerText = "✨ Refine with AI";
        btn.disabled = false;
    }
}
