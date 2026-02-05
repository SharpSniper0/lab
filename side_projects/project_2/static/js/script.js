function openTab(tabName) {
    // Hide all contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show specific content
    document.getElementById(tabName).classList.add('active');

    // Activate specific button (finding by text content or adding IDs to buttons would be better, 
    // but for now contextually logic inside the onclick works if we pass 'event' or query selector)

    // Simple way: iterate buttons and checking onclick attribute or just use event.currentTarget
    // Re-implementing with event handling is cleaner.
}

// Attach event listeners for cleaner handling if desired, 
// but inline onclick is fine for this scale.

// Update button state helper
const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(tab => {
    tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});

// Smooth Scroll for local links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
