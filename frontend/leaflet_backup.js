// Simple Leaflet map initialization with Kalman filter
function initDelhiMap() {
    map = L.map('map', {
        center: userLocation,
        zoom: 13,
        zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

    routeLayer = L.layerGroup().addTo(map);
    trafficLayer = L.layerGroup().addTo(map);
    constructionLayer = L.layerGroup().addTo(map);

    visualizeCrimeZones();
    startLocationTracking();

    console.log('✓ OpenStreetMap loaded with GPS');
    showNotification('Map loaded. Getting your location...', 'info');
}

function visualizeCrimeZones() {
    if (typeof CRIME_DATA === 'undefined') return;

    CRIME_DATA.crimes.forEach(crime => {
        let color = '#10b981';
        let radius = 300;

        if (crime.severity >= 5) {
            color = '#dc2626';
            radius = 600;
        } else if (crime.severity >= 3) {
            color = '#f59e0b';
            radius = 450;
        }

        L.circle([crime.lat, crime.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: radius
        }).addTo(map).bindPopup(`<strong>${crime.type.toUpperCase()}</strong><br>Severity: ${crime.severity}/5<br>${crime.description}`);
    });
}
