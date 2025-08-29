// Global dataset loaded from datastore.json
let dataset = [];
let sessionTimer;
const SESSION_LENGTH = 120; // seconds

async function loadData() {
    if (dataset.length) return dataset;
    try {
        const response = await fetch('../datastore.json');
        dataset = await response.json();
    } catch (err) {
        console.error('Failed to load dataset:', err);
    }
    return dataset;
}

function initSession() {
    let start = localStorage.getItem('sessionStart');
    if (!start) {
        start = Date.now().toString();
        localStorage.setItem('sessionStart', start);
    }
    function updateCountdown() {
        const now = Date.now();
        const elapsed = Math.floor((now - parseInt(start)) / 1000);
        const remaining = SESSION_LENGTH - elapsed;
        const countdownDiv = document.getElementById('countdown');
        if (countdownDiv) {
            if (remaining > 0) {
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                countdownDiv.textContent = `${mins}:${secs.toString().padStart(2, '0')} remaining`;
            } else {
                countdownDiv.textContent = '0:00 remaining';
            }
        }
        if (remaining <= 0) {
            showLoginModal();
            clearInterval(sessionTimer);
        }
    }
    updateCountdown();
    sessionTimer = setInterval(updateCountdown, 1000);
}

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function resetSession() {
    localStorage.setItem('sessionStart', Date.now().toString());
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    initSession();
}

async function populateHome() {
    const data = await loadData();
    // coverage items
    const featuredContainer = document.getElementById('featured-cards');
    const internationalContainer = document.getElementById('international-cards');
    const statsText = document.getElementById('stat-text');
    const filmItems = data.filter(item => item.type === 'film');
    const coverageItems = data.filter(item => item.type === 'coverage');
    // Featured coverage: TIFF (local)
    const featured = coverageItems.filter(item => item.sourcePriority === 'local');
    featured.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h4>${item.title}</h4><p>${item.coverageQuote || ''}</p><p><strong>Source:</strong> ${item.sourceOutlet}</p>`;
        featuredContainer.appendChild(card);
    });
    // International spotlight: film items with non-Canadian origin
    const international = filmItems.filter(item => item.countryOfOrigin && !item.countryOfOrigin.includes('Canada'));
    international.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h4>${item.title}</h4><p>${item.synopsis}</p><p><strong>Director:</strong> ${item.subtitle}</p>`;
        internationalContainer.appendChild(card);
    });
    // Stats
    const totalFilms = filmItems.length;
    const totalSources = [...new Set(data.map(item => item.sourceOutlet))].length;
    const internationalCount = filmItems.filter(item => item.countryOfOrigin && !item.countryOfOrigin.includes('Canada')).length;
    const internationalPercentage = totalFilms ? Math.round((internationalCount / totalFilms) * 100) : 0;
    statsText.textContent = `${totalFilms} films • ${totalSources} sources • ${internationalPercentage}% international`;
}

async function populateFilms() {
    const data = await loadData();
    const filmContainer = document.getElementById('film-grid');
    const films = data.filter(item => item.type === 'film');
    films.forEach(item => {
        const card = document.createElement('div');
        card.className = 'film-card';
        const country = item.countryOfOrigin ? item.countryOfOrigin.join(', ') : '';
        card.innerHTML = `<h3>${item.title}</h3>
            <p><strong>Director:</strong> ${item.subtitle}</p>
            <p><strong>Programme:</strong> ${item.programme}</p>
            <p><strong>Premiere:</strong> ${item.premiereStatus || ''}</p>
            <p><strong>Country:</strong> ${country}</p>
            <a href="${item.url}" target="_blank">View Source</a>`;
        filmContainer.appendChild(card);
    });
}

async function populateCoverage() {
    const data = await loadData();
    const coverageContainer = document.getElementById('coverage-list');
    const coverage = data.filter(item => item.type === 'coverage');
    coverage.forEach(item => {
        const card = document.createElement('div');
        card.className = 'coverage-card';
        card.innerHTML = `<h3>${item.title}</h3>
            <p>${item.coverageQuote || ''}</p>
            <p><strong>Outlet:</strong> ${item.sourceOutlet}</p>
            <a href="${item.url}" target="_blank">Read Article</a>`;
        coverageContainer.appendChild(card);
    });
}

// Determine which page we are on and populate accordingly
window.addEventListener('DOMContentLoaded', () => {
    initSession();
    if (document.getElementById('featured-cards')) {
        populateHome();
    }
    if (document.getElementById('film-grid')) {
        populateFilms();
    }
    if (document.getElementById('coverage-list')) {
        populateCoverage();
    }
});
