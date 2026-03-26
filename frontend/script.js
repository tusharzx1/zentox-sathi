/**
 * ZENTOX-SATHI - Delhi NCR Safety & Navigation
 * 4-Section Architecture: News, Navigation, History, Safety
 */

// ============================================
// GLOBAL STATE
// ============================================
let map;
let routeLayer;
let trafficLayer;
let constructionLayer;
let userLocation = [28.3639, 77.5376]; // Default Galgotias University
let locationWatchId = null;
let userMarker = null;
let isTrackingLocation = false;
let accuracyCircle = null;

// Live Location Tracking State
let locationHistory = [];
let isEmergencySharing = false;
let liveTrackingWatchId = null;
let emergencySharingInterval = null;
let batteryMode = 'balanced'; // high, balanced, saver
const BATTERY_INTERVALS = { high: 5000, balanced: 15000, saver: 60000 };

// Analysis Section State
let analysisFilters = { type: 'all', severity: 'all', timeRange: 'all' };
let analysisSortOrder = 'time-desc';
let currentPage = 1;
const ITEMS_PER_PAGE = 8;
let aiCountdown = 45;
let aiCountdownInterval = null;
let autoRefreshEnabled = true;
let tableRefreshInterval = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    initTabNavigation();
    initHomePage(); // Initialize Home Page
    initDelhiMap(); // Initialize Leaflet/OpenStreetMap
    fetchSafetyNews(); // ACTIVATE LIVE NEWS SECTION
    loadHistory();
    loadContacts();
    loadAnalysis();
    setupEventListeners();
    initLiveTracking(); // Initialize Live Location Tracking
});

// ============================================
// USER SESSION
// ============================================
function checkUserSession() {
    const user = localStorage.getItem('safeRouteUser') || sessionStorage.getItem('safeRouteUser');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userData = JSON.parse(user);
    document.getElementById('user-name').textContent = userData.name || userData.email.split('@')[0];
}

// ============================================
// TAB NAVIGATION
// ============================================
function initTabNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    const views = document.querySelectorAll('.view');
    const viewTitle = document.getElementById('view-title');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetViewId = link.getAttribute('data-view');

            // Update Active Link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update Active View
            views.forEach(v => v.classList.remove('active'));
            const targetView = document.getElementById(targetViewId);
            targetView.classList.add('active');

            // Update Title
            viewTitle.textContent = link.querySelector('span').textContent;

            // Trigger animations
            gsap.from(targetView, { duration: 0.4, opacity: 0, y: 10, ease: 'power2.out' });

            // Invalidate map size if switching to map view
            if (targetViewId === 'map-view' && map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('safeRouteUser');
        sessionStorage.removeItem('safeRouteUser');
        window.location.href = 'login.html';
    });
}

// ============================================
// HOME PAGE INITIALIZATION
// ============================================
function initHomePage() {
    updateGreeting();
    updateHomeTime();
    updateHomeSafetyScore();
    updateHomeStats();
    initHomeQuickActions();
    updateHomeAlertsTicker();
    initHomeSparkline();

    // Update time every second
    setInterval(updateHomeTime, 1000);

    // Update stats periodically
    setInterval(() => {
        updateHomeSafetyScore();
        updateHomeStats();
    }, 30000);
}

function updateGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = 'Good Evening';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }

    const user = localStorage.getItem('safeRouteUser') || sessionStorage.getItem('safeRouteUser');
    if (user) {
        const userData = JSON.parse(user);
        const name = userData.name || userData.email.split('@')[0];
        greeting += `, ${name}`;
    }

    greetingEl.textContent = greeting;
}

function updateHomeTime() {
    const timeEl = document.getElementById('home-time');
    if (!timeEl) return;

    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function updateHomeSafetyScore() {
    if (typeof CRIME_DATA === 'undefined') return;

    const totalCrimes = CRIME_DATA.crimes.length;
    const highSeverity = CRIME_DATA.crimes.filter(c => c.severity >= 4).length;

    // Calculate safety score (inverse of risk)
    const riskRatio = totalCrimes > 0 ? (highSeverity / totalCrimes) : 0;
    const safetyScore = Math.round(100 - (riskRatio * 40) - (totalCrimes * 0.5));
    const clampedScore = Math.max(50, Math.min(100, safetyScore));

    // Update UI
    const scoreEl = document.getElementById('home-safe-score');
    const gaugeText = document.getElementById('gauge-percentage');
    const gaugeFill = document.getElementById('safety-gauge-fill');
    const gaugeLabel = document.querySelector('.gauge-label');
    const gaugeBadge = document.querySelector('.gauge-badge');

    if (scoreEl) scoreEl.textContent = `${clampedScore}%`;
    if (gaugeText) gaugeText.textContent = `${clampedScore}%`;

    // Update gauge fill (stroke-dashoffset: 502 = 0%, 0 = 100%)
    if (gaugeFill) {
        const offset = 502 - (502 * clampedScore / 100);
        gaugeFill.style.strokeDashoffset = offset;

        // Color based on score
        if (clampedScore >= 80) {
            gaugeFill.style.stroke = '#10b981';
            if (gaugeLabel) gaugeLabel.textContent = 'SAFE';
            if (gaugeBadge) gaugeBadge.innerHTML = '<i class="fas fa-check-circle"></i>';
        } else if (clampedScore >= 60) {
            gaugeFill.style.stroke = '#f59e0b';
            if (gaugeLabel) gaugeLabel.textContent = 'MODERATE';
            if (gaugeBadge) gaugeBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        } else {
            gaugeFill.style.stroke = '#ef4444';
            if (gaugeLabel) gaugeLabel.textContent = 'CAUTION';
            if (gaugeBadge) gaugeBadge.innerHTML = '<i class="fas fa-times-circle"></i>';
        }
    }

    // Update alerts count
    const alertsEl = document.getElementById('home-alerts-count');
    if (alertsEl) alertsEl.textContent = highSeverity;
}

function updateHomeStats() {
    if (typeof CRIME_DATA === 'undefined') return;

    const now = new Date();
    const last24h = CRIME_DATA.crimes.filter(c => (now - new Date(c.time)) < 24 * 60 * 60 * 1000);
    const resolved = Math.floor(last24h.length * 0.6); // Simulated
    const pending = last24h.length - resolved;

    const incidentsEl = document.getElementById('home-incidents');
    const resolvedEl = document.getElementById('home-resolved');
    const pendingEl = document.getElementById('home-pending');

    if (incidentsEl) incidentsEl.textContent = last24h.length;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (pendingEl) pendingEl.textContent = pending;
}

function initHomeQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action-card');

    quickActions.forEach(card => {
        card.addEventListener('click', () => {
            const action = card.dataset.action;

            switch (action) {
                case 'sos':
                    document.querySelector('[data-view="help-view"]').click();
                    setTimeout(() => {
                        const sosBtn = document.getElementById('sos-btn');
                        if (sosBtn) sosBtn.click();
                    }, 300);
                    break;
                case 'navigate':
                    document.querySelector('[data-view="map-view"]').click();
                    break;
                case 'share-location':
                    document.querySelector('[data-view="help-view"]').click();
                    setTimeout(() => {
                        const shareBtn = document.getElementById('emergency-share-btn');
                        if (shareBtn) shareBtn.click();
                    }, 300);
                    break;
                case 'call-police':
                    simulateCall('100');
                    break;
            }
        });
    });
}

function updateHomeAlertsTicker() {
    const tickerEl = document.getElementById('alerts-ticker');
    if (!tickerEl || typeof CRIME_DATA === 'undefined') return;

    const recentCrimes = [...CRIME_DATA.crimes]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

    tickerEl.innerHTML = recentCrimes.map(crime => {
        const timeStr = formatLiveTime(crime.time);
        const iconClass = crime.severity >= 4 ? 'danger' : 'warning';

        return `
            <div class="ticker-item">
                <span class="ticker-time">${timeStr}</span>
                <span class="ticker-icon ${iconClass}"><i class="fas fa-exclamation-circle"></i></span>
                <span class="ticker-text">${crime.description} - ${getAreaFromCoords(crime.lat, crime.lng)}</span>
            </div>
        `;
    }).join('');
}

function initHomeSparkline() {
    const canvas = document.getElementById('homeSparkline');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    // Generate sparkline data (simulated hourly incidents)
    const data = [3, 5, 2, 8, 4, 6, 3, 7, 4, 2, 5, 3];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => `${i}h`),
            datasets: [{
                data: data,
                borderColor: '#ff9933',
                backgroundColor: 'rgba(255, 153, 51, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

// Update home news preview when news is fetched
function updateHomeNewsPreview(newsItems) {
    const previewEl = document.getElementById('home-news-preview');
    if (!previewEl) return;

    const previewNews = newsItems.slice(0, 3);

    previewEl.innerHTML = previewNews.map(item => {
        const badge = isCrimeRelated(item.title) ? 'CRIME' : 'CITY';
        const badgeColor = badge === 'CRIME' ? 'var(--risky)' : 'var(--saffron)';

        return `
            <div class="news-preview-item" onclick="document.querySelector('[data-view=news-view]').click()">
                <div class="news-preview-badge" style="background: ${badgeColor}">${badge}</div>
                <div class="news-preview-text">${item.title}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// NEWS SECTION
// ============================================
async function fetchSafetyNews() {
    try {
        const NEWS_API_KEY = window.CONFIG.NEWS_API_KEY;
        const NEWS_API_URL = window.CONFIG.NEWS_API_URL;

        const params = new URLSearchParams({
            'apikey': NEWS_API_KEY,
            'language': 'en',
            'country': 'in',  // Include India (not exclude)
            'category': 'crime,politics,top',  // Include crime (not exclude)
            'q': 'delhi OR ncr OR "new delhi" OR noida OR gurgaon OR ghaziabad OR faridabad OR "greater noida"'  // Delhi NCR specific
        });

        const response = await fetch(`${NEWS_API_URL}?${params}`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displayNews(data.results.slice(0, 6)); // Limit to 6 articles
        } else {
            console.warn("No news found, using fallback.");
            displayFallbackNews();
        }
    } catch (error) {
        console.error('News API Error:', error);
        displayFallbackNews();
    }
}

function displayNews(newsItems) {
    const newsGrid = document.getElementById('news-grid');
    newsGrid.innerHTML = '';

    // Also update home page news preview
    updateHomeNewsPreview(newsItems);

    newsItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-image">
                <img src="${item.image_url || item.imageUrl || 'https://via.placeholder.com/400x200?text=Safety+News'}" alt="News" onerror="this.src='https://via.placeholder.com/400x200?text=News'">
                <span class="news-badge">${isCrimeRelated(item.title) ? 'CRIME' : 'CITY'}</span>
            </div>
            <div class="news-body">
                <h4 class="news-title">${item.title}</h4>
                <div class="news-meta">
                    <span><i class="fas fa-globe"></i> ${item.source_id || 'Local News'}</span>
                    <span>${formatTime(item.pubDate)}</span>
                </div>
            </div>
        `;
        card.onclick = () => window.open(item.link, '_blank');
        newsGrid.appendChild(card);
    });
}

function displayFallbackNews() {
    const fallback = [
        { title: 'Delhi Police increases night patrolling in Connaught Place', url: '#', publish_date: new Date().toISOString(), image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd81?auto=format&fit=crop&q=80&w=400' },
        { title: 'New safety cameras installed in Metro stations', url: '#', publish_date: new Date(Date.now() - 86400000).toISOString(), image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&q=80&w=400' },
        { title: 'Traffic advisory issued for Central Delhi protests', url: '#', publish_date: new Date(Date.now() - 172800000).toISOString(), image: 'https://images.unsplash.com/photo-1626156972036-7c154316d946?auto=format&fit=crop&q=80&w=400' },
        { title: 'Women Safety: "Himmat Plus" app updates released', url: '#', publish_date: new Date(Date.now() - 250000000).toISOString(), image: 'https://images.unsplash.com/photo-1577908489422-4a00508007e0?auto=format&fit=crop&q=80&w=400' }
    ];
    displayNews(fallback);
}

function isCrimeRelated(text) {
    const keywords = ['crime', 'theft', 'robbery', 'murder', 'police', 'arrest'];
    return keywords.some(k => text.toLowerCase().includes(k));
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ============================================
// LEAFLET MAP & NAVIGATION SECTION
// ============================================

function initDelhiMap() {
    // Initialize Leaflet Map
    map = L.map('map').setView(userLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Initialize Layers
    routeLayer = L.layerGroup().addTo(map);
    trafficLayer = L.layerGroup().addTo(map);
    constructionLayer = L.layerGroup().addTo(map);

    // Add UI Controls
    addGPSLocationControl();

    // Viz and Tracking
    visualizeCrimeZones();
    startLocationTracking();

    console.log('✓ Leaflet Map initialized');
    showNotification('Map loaded with OpenStreetMap', 'success');
}

function addGPSLocationControl() {
    const Control = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: function (map) {
            const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-gps-btn');
            btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            btn.style.backgroundColor = 'white';
            btn.style.width = '30px';
            btn.style.height = '30px';
            btn.style.cursor = 'pointer';
            btn.style.border = '2px solid rgba(0,0,0,0.2)';
            btn.title = "Locate Me";

            btn.onclick = function () {
                if (userLocation) {
                    map.flyTo(userLocation, 16);
                } else {
                    startLocationTracking();
                }
            };
            return btn;
        }
    });
    map.addControl(new Control());
}


function visualizeCrimeZones() {
    if (typeof CRIME_DATA === 'undefined') return;

    CRIME_DATA.crimes.forEach(crime => {
        let color = '#10b981'; // safe
        let radius = 300;

        if (crime.severity >= 5) {
            color = '#dc2626'; // Very Risky (Red)
            radius = 600;
        } else if (crime.severity >= 3) {
            color = '#f59e0b'; // Medium (Orange)
            radius = 450;
        }

        L.circle([crime.lat, crime.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: radius
        }).addTo(map).bindPopup(`
            <div style="text-align:center;">
                <strong>${crime.type.toUpperCase()}</strong><br>
                Severity: ${crime.severity}/5<br>
                ${crime.description}
            </div>
        `);
    });
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported.', 'error');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    locationWatchId = navigator.geolocation.watchPosition(
        updateUserLocation,
        handleLocationError,
        options
    );

    isTrackingLocation = true;
}

function updateUserLocation(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    userLocation = [lat, lng];

    // Update User Marker
    if (!userMarker) {
        const icon = L.divIcon({
            className: 'user-marker-pulse',
            html: '<div style="width: 12px; height: 12px; background: #4285f4; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.4);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        userMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
        userMarker.bindPopup("You are here").openPopup();

        // Center on first fix ONLY if accuracy is reasonable (under 2km)
        // Otherwise keep default (Galgotias)
        if (!window.hasInitialLocation) {
            if (accuracy < 2000) {
                map.setView([lat, lng], 15);
                window.hasInitialLocation = true;
            } else {
                console.warn("Initial GPS accuracy too low for auto-center:", accuracy);
            }
        }
    } else {
        userMarker.setLatLng([lat, lng]);
    }

    // Update Accuracy Circle
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }
    accuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#4285f4',
        weight: 1,
        fillOpacity: 0.1
    }).addTo(map);

    // Update Info
    const accuracyDisplay = document.getElementById('location-accuracy');
    if (accuracyDisplay) {
        let statusIcon = '○';
        let statusColor = 'var(--saffron)'; // Default/Wait

        if (accuracy <= 20) {
            statusIcon = '✓';
            statusColor = 'var(--safe)';
        } else if (accuracy <= 100) {
            statusIcon = '○';
            statusColor = 'var(--medium)';
        } else {
            statusIcon = '△';
            statusColor = 'var(--risky)';
        }

        accuracyDisplay.innerHTML = `<span style="color: ${statusColor}; font-weight: 700;">${statusIcon} ±${Math.round(accuracy)}m</span>`;
    }
}

function handleLocationError(error) {
    console.warn("Location Error:", error.message);
}

// ============================================
// HISTORY SECTION
// ============================================
function loadHistory() {
    const historyList = document.getElementById('history-grid') || document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('zentox_history') || '[]');

    if (history.length === 0) return;

    historyList.innerHTML = '';
    history.slice().reverse().forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-icon" style="color: var(--saffron);"><i class="fas fa-map-marker-alt"></i></div>
            <div class="history-info">
                <strong>${item.destination}</strong>
                <p>${item.date} • ${item.time}</p>
            </div>
            <div class="history-status" style="color: var(--safe);"><i class="fas fa-check-circle"></i> Safe</div>
        `;
        historyList.appendChild(div);
    });
}

function addToHistory(destination) {
    const history = JSON.parse(localStorage.getItem('zentox_history') || '[]');
    const now = new Date();
    history.push({
        destination: destination,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('zentox_history', JSON.stringify(history));
    loadHistory();
}

// ============================================
// ANALYSIS SECTION & CHARTS
// ============================================
let trendChart, distChart;
const GEMINI_API_KEY = window.CONFIG.GEMINI_API_KEY;

function loadAnalysis() {
    if (typeof CRIME_DATA === 'undefined') return;

    updateAnalysisStats();
    initAnalysisCharts();
    populateAnalysisTable();
    initLiveClock();
    initAICountdown();
    initAnalysisEventListeners();

    // Start AI Live Analysis
    if (!window.analysisInterval) {
        fetchGeminiLiveAnalysis(); // Initial fetch
        window.analysisInterval = setInterval(() => {
            fetchGeminiLiveAnalysis();
            aiCountdown = 45; // Reset countdown
        }, 45000); // Every 45s
    }

    // Auto-refresh table every 30 seconds
    if (!tableRefreshInterval) {
        tableRefreshInterval = setInterval(() => {
            if (autoRefreshEnabled) {
                populateAnalysisTable();
            }
        }, 30000);
    }
}

function initLiveClock() {
    const clockDisplay = document.getElementById('live-clock-display');
    if (!clockDisplay) return;

    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function initAICountdown() {
    const countdownEl = document.getElementById('ai-countdown');
    if (!countdownEl) return;

    if (aiCountdownInterval) clearInterval(aiCountdownInterval);
    aiCountdown = 45;

    aiCountdownInterval = setInterval(() => {
        aiCountdown--;
        if (aiCountdown <= 0) aiCountdown = 45;
        countdownEl.textContent = `${aiCountdown}s`;
    }, 1000);
}

function initAnalysisEventListeners() {
    // Filter by Type
    const filterType = document.getElementById('filter-crime-type');
    if (filterType) {
        filterType.addEventListener('change', (e) => {
            analysisFilters.type = e.target.value;
            currentPage = 1;
            populateAnalysisTable();
        });
    }

    // Filter by Severity
    const filterSeverity = document.getElementById('filter-severity');
    if (filterSeverity) {
        filterSeverity.addEventListener('change', (e) => {
            analysisFilters.severity = e.target.value;
            currentPage = 1;
            populateAnalysisTable();
        });
    }

    // Filter by Time Range
    const filterTime = document.getElementById('filter-time-range');
    if (filterTime) {
        filterTime.addEventListener('change', (e) => {
            analysisFilters.timeRange = e.target.value;
            currentPage = 1;
            populateAnalysisTable();
        });
    }

    // Sort Order
    const sortOrder = document.getElementById('sort-order');
    if (sortOrder) {
        sortOrder.addEventListener('change', (e) => {
            analysisSortOrder = e.target.value;
            populateAnalysisTable();
        });
    }

    // Export CSV Button
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Clear Filters Button
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            analysisFilters = { type: 'all', severity: 'all', timeRange: 'all' };
            analysisSortOrder = 'time-desc';
            document.getElementById('filter-crime-type').value = 'all';
            document.getElementById('filter-severity').value = 'all';
            document.getElementById('filter-time-range').value = 'all';
            document.getElementById('sort-order').value = 'time-desc';
            currentPage = 1;
            populateAnalysisTable();
            showNotification('Filters cleared', 'success');
        });
    }

    // Refresh Data Button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            fetchGeminiLiveAnalysis().then(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Now';
                aiCountdown = 45;
                showNotification('Data refreshed successfully', 'success');
            });
        });
    }

    // Auto-refresh Toggle
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', (e) => {
            autoRefreshEnabled = e.target.checked;
            showNotification(`Auto-refresh ${autoRefreshEnabled ? 'enabled' : 'disabled'}`, 'info');
        });
    }
}

function exportToCSV() {
    const crimes = getFilteredCrimes();
    if (crimes.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }

    const headers = ['Type', 'Area', 'Severity', 'Description', 'Time', 'Latitude', 'Longitude'];
    const rows = crimes.map(c => [
        c.type,
        getAreaFromCoords(c.lat, c.lng),
        c.severity,
        c.description,
        new Date(c.time).toLocaleString('en-IN'),
        c.lat,
        c.lng
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crime_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification(`Exported ${crimes.length} records to CSV`, 'success');
}

function getFilteredCrimes() {
    let crimes = [...CRIME_DATA.crimes];

    // Apply Type Filter
    if (analysisFilters.type !== 'all') {
        crimes = crimes.filter(c => c.type === analysisFilters.type);
    }

    // Apply Severity Filter
    if (analysisFilters.severity !== 'all') {
        if (analysisFilters.severity === 'high') {
            crimes = crimes.filter(c => c.severity >= 4);
        } else if (analysisFilters.severity === 'medium') {
            crimes = crimes.filter(c => c.severity === 3);
        } else if (analysisFilters.severity === 'low') {
            crimes = crimes.filter(c => c.severity <= 2);
        }
    }

    // Apply Time Range Filter
    if (analysisFilters.timeRange !== 'all') {
        const now = new Date();
        let cutoff;
        switch (analysisFilters.timeRange) {
            case '1h': cutoff = new Date(now - 1 * 60 * 60 * 1000); break;
            case '6h': cutoff = new Date(now - 6 * 60 * 60 * 1000); break;
            case '24h': cutoff = new Date(now - 24 * 60 * 60 * 1000); break;
            case '7d': cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
        }
        crimes = crimes.filter(c => new Date(c.time) >= cutoff);
    }

    // Apply Sort
    switch (analysisSortOrder) {
        case 'time-desc':
            crimes.sort((a, b) => new Date(b.time) - new Date(a.time));
            break;
        case 'time-asc':
            crimes.sort((a, b) => new Date(a.time) - new Date(b.time));
            break;
        case 'severity-desc':
            crimes.sort((a, b) => b.severity - a.severity);
            break;
        case 'severity-asc':
            crimes.sort((a, b) => a.severity - b.severity);
            break;
    }

    return crimes;
}

// Table sorting from header click
window.sortTable = function (column) {
    switch (column) {
        case 'type':
            analysisSortOrder = analysisSortOrder === 'type-asc' ? 'type-desc' : 'type-asc';
            break;
        case 'severity':
            analysisSortOrder = analysisSortOrder === 'severity-desc' ? 'severity-asc' : 'severity-desc';
            break;
        case 'time':
            analysisSortOrder = analysisSortOrder === 'time-desc' ? 'time-asc' : 'time-desc';
            break;
    }
    populateAnalysisTable();
};

function updateAnalysisStats() {
    const totalCrimes = CRIME_DATA.crimes.length;
    const highRisk = CRIME_DATA.crimes.filter(c => c.severity >= 4).length;

    // Calculate Most Frequent
    const types = {};
    CRIME_DATA.crimes.forEach(c => types[c.type] = (types[c.type] || 0) + 1);
    const mostFrequent = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b, '-');

    // Calculate Last 24 Hours
    const now = new Date();
    const last24h = CRIME_DATA.crimes.filter(c => (now - new Date(c.time)) < 24 * 60 * 60 * 1000).length;

    // Calculate Safe Zones (areas with no high-severity crimes)
    const safeZones = 4 - Math.min(highRisk, 4); // Simplified calculation

    // Calculate Average Severity
    const avgSeverity = CRIME_DATA.crimes.length > 0
        ? (CRIME_DATA.crimes.reduce((sum, c) => sum + c.severity, 0) / CRIME_DATA.crimes.length).toFixed(1)
        : 0;

    const statTotal = document.getElementById('stat-total-crimes');
    const statHigh = document.getElementById('stat-high-risk');
    const statFreq = document.getElementById('stat-most-frequent');
    const statLast24h = document.getElementById('stat-last-24h');
    const statSafeZones = document.getElementById('stat-safe-zones');
    const statAvgSeverity = document.getElementById('stat-avg-severity');

    // Animate Numbers
    if (statTotal) animateValue(statTotal, parseInt(statTotal.textContent) || 0, totalCrimes, 1000);
    if (statHigh) animateValue(statHigh, parseInt(statHigh.textContent) || 0, highRisk, 1000);
    if (statFreq) statFreq.textContent = mostFrequent.replace('_', ' ').toUpperCase();
    if (statLast24h) animateValue(statLast24h, parseInt(statLast24h.textContent) || 0, last24h, 1000);
    if (statSafeZones) animateValue(statSafeZones, parseInt(statSafeZones.textContent) || 0, safeZones, 1000);
    if (statAvgSeverity) statAvgSeverity.textContent = avgSeverity;
}

function initAnalysisCharts() {
    const ctxTrend = document.getElementById('trendChart')?.getContext('2d');
    const ctxDist = document.getElementById('distributionChart')?.getContext('2d');

    if (!ctxTrend || !ctxDist) return;

    // Prepare Data
    const dates = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-IN', { weekday: 'short' });
    });

    const categories = ['theft', 'harassment', 'robbery', 'assault', 'burglary'];
    const catCounts = categories.map(cat => CRIME_DATA.crimes.filter(c => c.type === cat).length);

    // 1. Trend Chart (Line)
    if (trendChart) trendChart.destroy();
    if (typeof Chart !== 'undefined') {
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Reported Incidents',
                    data: [12, 19, 15, 25, 22, 30, CRIME_DATA.crimes.length], // Simulated trend + current
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 2. Distribution Chart (Doughnut)
    if (distChart) distChart.destroy();
    if (typeof Chart !== 'undefined') {
        distChart = new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
                datasets: [{
                    data: catCounts,
                    backgroundColor: ['#f97316', '#eab308', '#ef4444', '#dc2626', '#a855f7'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12 } }
                }
            }
        });
    }
}

function populateAnalysisTable() {
    const tableBody = document.getElementById('analysis-table-body');
    const resultsCounter = document.getElementById('results-count');
    const paginationContainer = document.getElementById('table-pagination');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Get filtered and sorted crimes
    const filteredCrimes = getFilteredCrimes();

    // Update results counter
    if (resultsCounter) {
        resultsCounter.textContent = `Showing ${filteredCrimes.length} result${filteredCrimes.length !== 1 ? 's' : ''}`;
    }

    // Handle empty state
    if (filteredCrimes.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--gray-400);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                No incidents found matching your filters
            </td>
        `;
        tableBody.appendChild(emptyRow);
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredCrimes.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCrimes = filteredCrimes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    paginatedCrimes.forEach((crime, index) => {
        const row = document.createElement('tr');
        const timeStr = formatLiveTime(crime.time);

        let sevClass = 'severity-low';
        if (crime.severity >= 5) sevClass = 'severity-high';
        else if (crime.severity >= 3) sevClass = 'severity-medium';

        row.innerHTML = `
            <td><div style="display:flex; align-items:center; gap:8px;">
                <i class="fas ${getIconForCrime(crime.type)}" style="color:var(--gray-600)"></i> 
                <span style="text-transform: capitalize;">${crime.type.replace('_', ' ')}</span>
            </div></td>
            <td>${getAreaFromCoords(crime.lat, crime.lng)}</td>
            <td><span class="severity-pill ${sevClass}">${crime.severity}/5</span></td>
            <td style="font-size:0.85rem; color:var(--gray-500);">${timeStr}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn view-map-btn" onclick="viewOnMap(${crime.lat}, ${crime.lng})" title="View on Map" style="padding: 0.25rem 0.5rem; background: var(--saffron); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="action-btn report-btn" onclick="reportIncident(${crime.id})" title="Report Issue" style="padding: 0.25rem 0.5rem; background: var(--risky); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                        <i class="fas fa-flag"></i>
                    </button>
                    <button class="action-btn share-btn" onclick="shareIncident(${crime.id})" title="Share" style="padding: 0.25rem 0.5rem; background: var(--safe); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </td>
        `;
        // Animate row entry with stagger
        row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
        tableBody.appendChild(row);
    });

    // Render Pagination
    if (paginationContainer && totalPages > 1) {
        renderPagination(paginationContainer, totalPages);
    } else if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

function formatLiveTime(timeStr) {
    const diffMs = new Date() - new Date(timeStr);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return '🔴 Just now';
    } else if (diffMins < 60) {
        return `${diffMins} min ago`;
    } else if (diffHrs < 24) {
        return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return new Date(timeStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
}

function renderPagination(container, totalPages) {
    container.innerHTML = '';

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cssText = 'padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: white; border-radius: var(--radius-md); cursor: pointer;';
    prevBtn.onclick = () => { currentPage--; populateAnalysisTable(); };
    container.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.style.cssText = `padding: 0.5rem 0.75rem; border: 1px solid ${i === currentPage ? 'var(--saffron)' : 'var(--gray-300)'}; background: ${i === currentPage ? 'var(--saffron)' : 'white'}; color: ${i === currentPage ? 'white' : 'var(--gray-700)'}; border-radius: var(--radius-md); cursor: pointer; font-weight: ${i === currentPage ? '600' : '400'};`;
        pageBtn.onclick = () => { currentPage = i; populateAnalysisTable(); };
        container.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cssText = 'padding: 0.5rem 0.75rem; border: 1px solid var(--gray-300); background: white; border-radius: var(--radius-md); cursor: pointer;';
    nextBtn.onclick = () => { currentPage++; populateAnalysisTable(); };
    container.appendChild(nextBtn);
}

// Action Button Functions
window.viewOnMap = function (lat, lng) {
    // Switch to Map View
    document.querySelector('[data-view="map-view"]').click();
    setTimeout(() => {
        if (map) {
            map.flyTo([lat, lng], 16);
            L.popup()
                .setLatLng([lat, lng])
                .setContent('<div style="text-align:center;"><strong>📍 Incident Location</strong></div>')
                .openOn(map);
        }
    }, 300);
    showNotification('Navigating to incident location...', 'info');
};

window.reportIncident = function (crimeId) {
    const crime = CRIME_DATA.crimes.find(c => c.id === crimeId);
    if (crime) {
        showNotification(`🚩 Reported: ${crime.type} incident flagged for review`, 'warning');
    }
};

window.shareIncident = function (crimeId) {
    const crime = CRIME_DATA.crimes.find(c => c.id === crimeId);
    if (crime) {
        const shareText = `⚠️ Safety Alert: ${crime.type.toUpperCase()} reported in ${getAreaFromCoords(crime.lat, crime.lng)}. Stay safe!`;
        if (navigator.share) {
            navigator.share({ title: 'Safety Alert', text: shareText });
        } else {
            navigator.clipboard.writeText(shareText);
            showNotification('📋 Alert copied to clipboard!', 'success');
        }
    }
};


// AI LIVE ANALYSIS (Gemini Integration)
async function fetchGeminiLiveAnalysis() {
    console.log("🤖 Fetching AI Analysis from Gemini...");

    // Construct Prompt
    const prompt = `
        Generate 1 realistic recent safety/security incident report for the region around "Galgotias University, Greater Noida" or "Delhi NCR".
        Return ONLY valid JSON. schema:
        {
            "type": "theft/harassment/robbery/assault/burglary/vandalism",
            "lat": (float between 28.3 and 28.7),
            "lng": (float between 77.1 and 77.6),
            "severity": (int 2-5),
            "description": (short string, max 10 words, e.g. "Mobile snatching reported at market"),
            "time": (current ISO timestamp)
        }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;
            // Clean markdown if present
            const jsonStr = text.replace(/```json|```/g, '').trim();
            const newCrime = JSON.parse(jsonStr);

            newCrime.id = Date.now();
            if (!newCrime.time) newCrime.time = new Date().toISOString();

            // Add to Data
            CRIME_DATA.crimes.unshift(newCrime);

            // Notification
            showNotification(`🤖 AI ALERT: ${newCrime.type.toUpperCase()} near ${getAreaFromCoords(newCrime.lat, newCrime.lng)}`, 'warning');

            // Update UI
            updateAnalysisStats();
            populateAnalysisTable();

            // Add to map if exists
            if (map) {
                let color = newCrime.severity >= 5 ? '#dc2626' : '#f59e0b';
                L.circle([newCrime.lat, newCrime.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    radius: newCrime.severity * 100
                }).addTo(map).bindPopup(`<strong>NEW REPORT</strong><br>${newCrime.description}`).openPopup();
            }

            // Update Chart Data
            if (trendChart) {
                const currentData = trendChart.data.datasets[0].data;
                currentData[currentData.length - 1] = CRIME_DATA.crimes.length;
                trendChart.update();
            }

            // Update Distribution
            if (distChart) {
                const categories = ['theft', 'harassment', 'robbery', 'assault', 'burglary'];
                const catCounts = categories.map(cat => CRIME_DATA.crimes.filter(c => c.type === cat).length);
                distChart.data.datasets[0].data = catCounts;
                distChart.update();
            }

        }
    } catch (error) {
        console.error("Gemini AI Error:", error);
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function getIconForCrime(type) {
    const map = {
        'theft': 'fa-hand-holding', 'robbery': 'fa-mask', 'assault': 'fa-fist-raised',
        'harassment': 'fa-comment-slash', 'burglary': 'fa-door-open', 'vandalism': 'fa-spray-can'
    };
    return map[type] || 'fa-exclamation-triangle';
}

function getAreaFromCoords(lat, lng) {
    if (lat > 28.64) return "North Delhi";
    if (lat < 28.57) return "South Delhi";
    if (lng > 77.25) return "East Delhi";
    return "Central Delhi";
}

// ============================================
// SAFETY & HELP SECTION
// ============================================
function loadContacts() {
    const contactList = document.getElementById('contact-list');
    const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');

    if (!contactList) return;

    contactList.innerHTML = '';
    if (contacts.length === 0) {
        contactList.innerHTML = '<p style="text-align:center; color:var(--gray-500);">No contacts added yet.</p>';
        return;
    }

    contacts.forEach((nc, index) => {
        const div = document.createElement('div');
        div.className = 'contact-card';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${nc.name}</strong>
                    <p style="font-size:0.8rem; color:var(--gray-500);">${nc.phone}</p>
                </div>
                <button onclick="deleteContact(${index})" style="background:none; border:none; color:var(--risky); cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        contactList.appendChild(div);
    });
}

window.deleteContact = function (index) {
    const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');
    contacts.splice(index, 1);
    localStorage.setItem('zentox_contacts', JSON.stringify(contacts));
    loadContacts();
};

// ============================================
// REAL ROUTING & GEOCODING Helpers
// ============================================
// Geocoding cache to reduce API calls
const geocodeCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function geocodeLocation(query) {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached geocode result');
        return cached.data;
    }

    // Try Nominatim (OpenStreetMap) first
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'ZentoxSathi/1.0' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    name: data[0].display_name
                };

                // Cache the result
                geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            }
        }
    } catch (error) {
        console.warn("Nominatim geocoding failed, trying fallback:", error);
    }

    // Fallback to Photon API
    try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(photonUrl);

        if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const coords = data.features[0].geometry.coordinates;
                const props = data.features[0].properties;
                const result = {
                    lat: coords[1],
                    lng: coords[0],
                    name: props.name || props.city || query
                };

                // Cache the result
                geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            }
        }
    } catch (error) {
        console.error("Photon geocoding also failed:", error);
    }

    return null;
}

// Distance helper (Haversine)
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Safety Scorer (Client Side)
function calculateRouteRiskScore(geometry) {
    if (typeof CRIME_DATA === 'undefined') return 100;

    let penalty = 0;
    const coordinates = geometry.coordinates; // [lng, lat] array

    // Basic sampling: Check every point in the path against crime zones
    for (let i = 0; i < coordinates.length; i += 5) {
        const point = coordinates[i];
        const ptLng = point[0];
        const ptLat = point[1];

        // Check against all crimes
        for (const crime of CRIME_DATA.crimes) {
            const dist = getDistanceFromLatLonInMeters(ptLat, ptLng, crime.lat, crime.lng);

            // Risk Radii
            let riskRadius = 300;
            if (crime.severity >= 5) riskRadius = 600;
            else if (crime.severity >= 3) riskRadius = 450;

            if (dist < riskRadius) {
                penalty += (crime.severity * 2);
            }
        }
    }

    // Normalize score 0-100 (100 is Safest)
    return Math.max(10, 100 - penalty);
}

async function getSafeRoute(start, end) {
    try {
        // Request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=true`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // Find the safest route among alternatives
            const scoredRoutes = data.routes.map(route => {
                return {
                    route: route,
                    safetyScore: calculateRouteRiskScore(route.geometry),
                    duration: route.duration
                };
            });

            // Sort: High Safety Score First. If similar scores (within 5 pts), pick fastest.
            scoredRoutes.sort((a, b) => {
                if (Math.abs(a.safetyScore - b.safetyScore) > 5) {
                    return b.safetyScore - a.safetyScore; // Higher is better
                }
                return a.duration - b.duration; // Lower duration is better
            });

            const bestOption = scoredRoutes[0];

            // Return geometry and metadata
            return {
                geometry: bestOption.route.geometry,
                score: bestOption.safetyScore,
                duration: bestOption.route.duration,
                distance: bestOption.route.distance
            };
        }
        console.warn("OSRM returned no routes.");
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error("Routing request timed out");
        } else {
            console.error("Routing error:", error);
        }
    }

    // Fallback: Create a direct line if API fails
    console.warn("Using fallback route (direct line)");
    return {
        geometry: {
            type: "LineString",
            coordinates: [[start[1], start[0]], [end[1], end[0]]]
        },
        score: 85, // Assumed score for fallback
        duration: getDistanceFromLatLonInMeters(start[0], start[1], end[0], end[1]) / 11, // Rough text: 40km/h ~ 11m/s
        distance: getDistanceFromLatLonInMeters(start[0], start[1], end[0], end[1])
    };
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Find Route Interaction
    const findRouteBtn = document.getElementById('find-route');
    if (findRouteBtn) {
        findRouteBtn.addEventListener('click', async () => {
            const startInput = document.getElementById('start-location').value;
            const destInput = document.getElementById('end-location').value;

            if (!destInput) return alert('Please enter a destination');
            if (!startInput) return alert('Please enter a start location');

            const btn = document.getElementById('find-route');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing Routes...';
            btn.disabled = true;

            try {
                // Determine Start Coordinates
                let startCoords = userLocation;
                const isCurrentLoc = ['current location', 'my location'].includes(startInput.toLowerCase());

                if (!isCurrentLoc) {
                    showNotification(`Locating start point: "${startInput}"...`, 'info');
                    const geocodedStart = await geocodeLocation(startInput + " Delhi");
                    if (geocodedStart) {
                        startCoords = [geocodedStart.lat, geocodedStart.lng];
                    } else {
                        showNotification('Start location not found. Using current location.', 'warning');
                    }
                }

                showNotification(`Searching for destination: "${destInput}"...`, 'info');
                const destCoords = await geocodeLocation(destInput + " Delhi");

                if (!destCoords) {
                    showNotification('Destination not found. Please try a major landmark.', 'error');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }

                showNotification('Scanning crime data for safest path...', 'info');
                const result = await getSafeRoute(startCoords, [destCoords.lat, destCoords.lng]);

                if (result && result.geometry) {
                    if (routeLayer) routeLayer.clearLayers();

                    // Color Coding based on Safety Score
                    let routeColor = '#10b981'; // Green
                    if (result.score < 50) routeColor = '#ef4444'; // Red
                    else if (result.score < 80) routeColor = '#f59e0b'; // Orange

                    L.geoJSON(result.geometry, {
                        style: { color: routeColor, weight: 6, opacity: 0.8 }
                    }).addTo(routeLayer);

                    // Markers
                    L.marker(startCoords).addTo(routeLayer)
                        .bindPopup(isCurrentLoc ? "Start Location" : startInput);

                    L.marker([destCoords.lat, destCoords.lng]).addTo(routeLayer)
                        .bindPopup(`
                        <strong>${destCoords.name}</strong><br>
                        Safety Score: ${Math.round(result.score)}/100<br>
                        Distance: ${(result.distance / 1000).toFixed(1)} km<br>
                        Est. Time: ${Math.round(result.duration / 60)} mins
                    `).openPopup();

                    // Fit bounds - Create bounds from geometry
                    const geoJsonLayer = L.geoJSON(result.geometry);
                    map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });

                    if (result.score > 80) {
                        showNotification('Safe route found! Low crime risk detected.', 'success');
                    } else {
                        showNotification('Route found. CAUTION: Passes near reported incidents.', 'warning');
                    }

                    addToHistory(destInput);

                    const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');
                    if (contacts.length > 0) {
                        setTimeout(() => {
                            showNotification(`TRIP MONITORING ACTIVE: Shared with ${contacts[0].name}`, 'info');
                        }, 2000);
                    }
                } else {
                    showNotification('Could not calculate a suitable route.', 'warning');
                }
            } catch (error) {
                console.error(error);
                showNotification('Connection error. Please check internet.', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Locate Me Button
    const locateBtn = document.getElementById('locate-me-btn');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            startLocationTracking();
        });
    }

    // Add Contact Modal
    const modal = document.getElementById('contact-modal');
    if (modal) {
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        document.getElementById('cancel-contact').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('save-contact').addEventListener('click', () => {
            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;

            if (name && phone) {
                const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');
                contacts.push({ name, phone });
                localStorage.setItem('zentox_contacts', JSON.stringify(contacts));
                loadContacts();
                modal.style.display = 'none';
                document.getElementById('contact-name').value = '';
                document.getElementById('contact-phone').value = '';
                showNotification('Emergency contact saved.', 'success');
            }
        });
    }

    // SOS Button
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        sosBtn.addEventListener('click', () => {
            const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');
            if (contacts.length === 0) {
                alert('Please add at least one emergency contact first!');
                return;
            }

            if (!confirm("Are you sure you want to send an SOS Alert?")) return;

            sosBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING ALERTS...';
            sosBtn.disabled = true;
            sosBtn.style.backgroundColor = '#7f1d1d'; // Darker red

            // Simulate Network Delay and Sending
            setTimeout(() => {
                // Success State
                alert(`SOS SENT! \n\nLocation shared with: ${contacts.map(c => c.name).join(', ')} \nAlert sent to Police Control Room.`);

                showNotification('SOS Alert Confirmed. Help is on the way.', 'success');

                sosBtn.innerHTML = '<i class="fas fa-check"></i> ALERT SENT';

                setTimeout(() => {
                    sosBtn.innerHTML = '<i class="fas fa-bell"></i> SEND SOS ALERT';
                    sosBtn.disabled = false;
                    sosBtn.style.backgroundColor = '';
                }, 3000);
            }, 1500);
        });
    }
}

window.simulateCall = function (number) {
    const confirmed = confirm(`Dial ${number === '100' ? 'Police (100)' : 'Women Helpline (1091)'}?`);
    if (confirmed) {
        window.location.href = `tel:${number}`;
    }
};

function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.position = 'fixed';
        newContainer.style.top = '20px';
        newContainer.style.right = '20px';
        newContainer.style.zIndex = '9999';
        document.body.appendChild(newContainer);
        showNotification(message, type);
        return;
    }

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.marginBottom = '10px';
    toast.innerHTML = `
    <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
    <div class="toast-content">
        <span class="toast-message">${message}</span>
    </div>
`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// LIVE LOCATION TRACKING MODULE
// ============================================

/**
 * Initialize Live Location Tracking System
 */
function initLiveTracking() {
    // Load saved location history from localStorage
    locationHistory = JSON.parse(localStorage.getItem('zentox_location_history') || '[]');
    renderLocationTimeline();

    // Load saved battery mode
    const savedMode = localStorage.getItem('zentox_battery_mode');
    if (savedMode) {
        batteryMode = savedMode;
        const modeSelect = document.getElementById('battery-mode');
        if (modeSelect) modeSelect.value = batteryMode;
    }

    // Setup Live Tracking Event Listeners
    setupLiveTrackingListeners();

    console.log('✓ Live Location Tracking initialized');
}

/**
 * Setup Event Listeners for Live Tracking Controls
 */
function setupLiveTrackingListeners() {
    // Start Tracking Button
    const startBtn = document.getElementById('start-tracking-btn');
    const stopBtn = document.getElementById('stop-tracking-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startLiveTracking();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            stopLiveTracking();
        });
    }

    // Battery Mode Selector
    const batterySelect = document.getElementById('battery-mode');
    if (batterySelect) {
        batterySelect.addEventListener('change', (e) => {
            applyBatteryOptimization(e.target.value);
        });
    }

    // Emergency Sharing Button
    const emergencyBtn = document.getElementById('emergency-share-btn');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', () => {
            toggleEmergencySharing();
        });
    }

    // Clear History Button
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearLocationHistory();
        });
    }
}

/**
 * Start Live Location Tracking
 */
function startLiveTracking() {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported by your browser.', 'error');
        return;
    }

    const options = {
        enableHighAccuracy: batteryMode === 'high',
        timeout: batteryMode === 'high' ? 5000 : 15000,
        maximumAge: batteryMode === 'saver' ? 30000 : 0
    };

    // Use watchPosition for continuous updates
    liveTrackingWatchId = navigator.geolocation.watchPosition(
        (position) => recordLocationToHistory(position),
        (error) => {
            console.warn('Live tracking error:', error.message);
            showNotification('Location access error: ' + error.message, 'warning');
        },
        options
    );

    // Update UI
    updateTrackingUI(true);
    showNotification(`Live tracking started (${batteryMode} mode)`, 'success');
    console.log('📍 Live tracking started');
}

/**
 * Stop Live Location Tracking
 */
function stopLiveTracking() {
    if (liveTrackingWatchId !== null) {
        navigator.geolocation.clearWatch(liveTrackingWatchId);
        liveTrackingWatchId = null;
    }

    // Also stop emergency sharing if active
    if (isEmergencySharing) {
        stopEmergencySharing();
    }

    // Update UI
    updateTrackingUI(false);
    showNotification('Live tracking stopped', 'info');
    console.log('⏹️ Live tracking stopped');
}

/**
 * Update Tracking UI State
 */
function updateTrackingUI(isActive) {
    const statusDot = document.querySelector('#tracking-status .status-dot');
    const statusText = document.querySelector('#tracking-status .status-text');
    const startBtn = document.getElementById('start-tracking-btn');
    const stopBtn = document.getElementById('stop-tracking-btn');

    if (statusDot) {
        statusDot.className = 'status-dot ' + (isActive ? (isEmergencySharing ? 'emergency' : 'active') : 'inactive');
    }

    if (statusText) {
        if (isEmergencySharing) {
            statusText.textContent = 'EMERGENCY SHARING ACTIVE';
        } else if (isActive) {
            statusText.textContent = 'Tracking Active';
        } else {
            statusText.textContent = 'Tracking Inactive';
        }
    }

    if (startBtn) startBtn.disabled = isActive;
    if (stopBtn) stopBtn.disabled = !isActive;
}

/**
 * Record Location Entry to History
 */
function recordLocationToHistory(position) {
    const entry = {
        id: Date.now(),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
        timestamp: new Date().toISOString(),
        altitude: position.coords.altitude || null,
        speed: position.coords.speed || null
    };

    // Add to beginning of array (most recent first)
    locationHistory.unshift(entry);

    // Limit history to 100 entries to save storage
    if (locationHistory.length > 100) {
        locationHistory = locationHistory.slice(0, 100);
    }

    // Persist to localStorage
    localStorage.setItem('zentox_location_history', JSON.stringify(locationHistory));

    // Update timeline UI
    renderLocationTimeline();

    // If emergency sharing is active, broadcast location
    if (isEmergencySharing) {
        broadcastEmergencyLocation(entry);
    }

    console.log(`📍 Location recorded: ${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)} (±${entry.accuracy}m)`);
}

/**
 * Render Location History Timeline
 */
function renderLocationTimeline() {
    const timeline = document.getElementById('location-timeline');
    if (!timeline) return;

    if (locationHistory.length === 0) {
        timeline.innerHTML = `
            <div class="timeline-empty" style="text-align: center; padding: 1.5rem; color: var(--gray-400);">
                <i class="fas fa-map-marker-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <p>No location history yet</p>
                <p style="font-size: 0.75rem;">Start tracking to record locations</p>
            </div>
        `;
        return;
    }

    // Render last 20 entries
    const entries = locationHistory.slice(0, 20);
    timeline.innerHTML = entries.map((entry, index) => {
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        return `
            <div class="timeline-item">
                <div class="timeline-icon">
                    <i class="fas fa-map-pin"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-coords">${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}</div>
                    <div class="timeline-time">${timeStr} • ${dateStr}</div>
                    <div class="timeline-accuracy">Accuracy: ±${entry.accuracy}m</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Clear Location History
 */
function clearLocationHistory() {
    if (!confirm('Clear all location history? This cannot be undone.')) return;

    locationHistory = [];
    localStorage.removeItem('zentox_location_history');
    renderLocationTimeline();
    showNotification('Location history cleared', 'info');
}

/**
 * Apply Battery Optimization Mode
 */
function applyBatteryOptimization(mode) {
    batteryMode = mode;
    localStorage.setItem('zentox_battery_mode', mode);

    // If tracking is active, restart with new settings
    if (liveTrackingWatchId !== null) {
        stopLiveTracking();
        startLiveTracking();
    }

    const modeLabels = {
        high: 'High Accuracy (updates every 5s)',
        balanced: 'Balanced (updates every 15s)',
        saver: 'Battery Saver (updates every 60s)'
    };

    showNotification(`Battery mode: ${modeLabels[mode]}`, 'info');
    console.log(`🔋 Battery mode changed to: ${mode}`);
}

/**
 * Toggle Emergency Sharing
 */
function toggleEmergencySharing() {
    if (isEmergencySharing) {
        stopEmergencySharing();
    } else {
        startEmergencySharing();
    }
}

/**
 * Start Emergency Location Sharing
 */
function startEmergencySharing() {
    const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');

    if (contacts.length === 0) {
        showNotification('Please add emergency contacts first!', 'warning');
        return;
    }

    isEmergencySharing = true;

    // Auto-start tracking if not already active
    if (liveTrackingWatchId === null) {
        // Force high accuracy for emergencies
        const savedMode = batteryMode;
        batteryMode = 'high';
        startLiveTracking();
        batteryMode = savedMode;
    }

    // Update UI
    updateEmergencySharingUI(true, contacts.length);
    updateTrackingUI(true);

    // Simulate sending initial notification to contacts
    showNotification(`🚨 Emergency sharing started! Location shared with ${contacts.length} contact(s)`, 'warning');

    console.log('🚨 Emergency sharing activated');
}

/**
 * Stop Emergency Location Sharing
 */
function stopEmergencySharing() {
    isEmergencySharing = false;

    if (emergencySharingInterval) {
        clearInterval(emergencySharingInterval);
        emergencySharingInterval = null;
    }

    // Update UI
    updateEmergencySharingUI(false, 0);
    if (liveTrackingWatchId !== null) {
        updateTrackingUI(true); // Still tracking but not emergency
    }

    showNotification('Emergency sharing stopped', 'info');
    console.log('⏹️ Emergency sharing deactivated');
}

/**
 * Update Emergency Sharing UI
 */
function updateEmergencySharingUI(isActive, contactCount) {
    const sharingStatus = document.getElementById('sharing-status');
    const emergencyBtn = document.getElementById('emergency-share-btn');
    const contactCountEl = document.getElementById('sharing-contacts-count');
    const lastShareTimeEl = document.getElementById('last-share-time');

    if (sharingStatus) {
        sharingStatus.style.display = isActive ? 'block' : 'none';
    }

    if (emergencyBtn) {
        if (isActive) {
            emergencyBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
            emergencyBtn.classList.add('active');
        } else {
            emergencyBtn.innerHTML = '<i class="fas fa-share-alt"></i> Start';
            emergencyBtn.classList.remove('active');
        }
    }

    if (contactCountEl) {
        contactCountEl.textContent = contactCount;
    }

    if (lastShareTimeEl && isActive) {
        lastShareTimeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Broadcast Emergency Location to Contacts
 * In a real app, this would send SMS/push notifications
 */
function broadcastEmergencyLocation(entry) {
    const contacts = JSON.parse(localStorage.getItem('zentox_contacts') || '[]');
    const lastShareTimeEl = document.getElementById('last-share-time');

    if (lastShareTimeEl) {
        lastShareTimeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Generate Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${entry.lat},${entry.lng}`;

    // In production, this would send SMS/notifications
    // For demo, we log it and show periodic notifications
    console.log(`📢 Broadcasting location to ${contacts.length} contacts: ${mapsLink}`);

    // Show notification every 5th update to avoid spam
    if (locationHistory.length % 5 === 0) {
        showNotification(`Location shared with ${contacts.map(c => c.name).join(', ')}`, 'info');
    }
}

/**
 * Generate Shareable Location Link
 */
function generateLocationLink() {
    if (locationHistory.length === 0) {
        showNotification('No location available to share', 'warning');
        return null;
    }

    const latest = locationHistory[0];
    const link = `https://www.google.com/maps?q=${latest.lat},${latest.lng}`;

    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('Location link copied to clipboard!', 'success');
        });
    }

    return link;
}
