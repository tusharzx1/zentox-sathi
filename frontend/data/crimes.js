// ZENTOX-SATHI - Crime Data
// Sample crime dataset for Delhi NCR, India

// Helper function to generate dynamic timestamps relative to current time
function getRelativeTime(hoursAgo) {
    const now = new Date();
    now.setHours(now.getHours() - hoursAgo);
    return now.toISOString();
}

const CRIME_DATA = {
    city: "Delhi",
    state: "Delhi NCR",
    country: "India",
    lastUpdated: new Date().toISOString().split('T')[0],
    crimes: [
        // Connaught Place (Central Delhi)
        { id: 1, type: "theft", category: "property", lat: 28.6315, lng: 77.2167, time: getRelativeTime(2), severity: 3, description: "Pickpocketing in Inner Circle" },
        { id: 2, type: "harassment", category: "quality_of_life", lat: 28.6328, lng: 77.2197, time: getRelativeTime(5), severity: 2, description: "Harassment reported near Metro Exit" },

        // Chandni Chowk (Old Delhi - Congested)
        { id: 3, type: "theft", category: "property", lat: 28.6506, lng: 77.2303, time: getRelativeTime(8), severity: 4, description: "Bag snatching in market" },
        { id: 4, type: "robbery", category: "violent", lat: 28.6562, lng: 77.2410, time: getRelativeTime(12), severity: 5, description: "Armed robbery in alley" },

        // Karol Bagh (West Delhi)
        { id: 5, type: "vehicle_theft", category: "property", lat: 28.6520, lng: 77.1915, time: getRelativeTime(24), severity: 4, description: "Car stolen from parking" },
        { id: 6, type: "assault", category: "violent", lat: 28.6548, lng: 77.1925, time: getRelativeTime(36), severity: 5, description: "Street fight" },

        // Hauz Khas (South Delhi - Nightlife)
        { id: 7, type: "harassment", category: "quality_of_life", lat: 28.5494, lng: 77.2001, time: getRelativeTime(1), severity: 3, description: "Drunk misconduct near club" },
        { id: 8, type: "theft", category: "property", lat: 28.5470, lng: 77.1960, time: getRelativeTime(4), severity: 3, description: "Phone theft" },

        // Seelampur (North East Delhi - High Crime)
        { id: 9, type: "assault", category: "violent", lat: 28.6640, lng: 77.2710, time: getRelativeTime(0.5), severity: 5, description: "Violent clash" },
        { id: 10, type: "robbery", category: "violent", lat: 28.6695, lng: 77.2750, time: getRelativeTime(6), severity: 5, description: "Mugging at gunpoint" },
        { id: 11, type: "burglary", category: "property", lat: 28.6650, lng: 77.2780, time: getRelativeTime(48), severity: 4, description: "Shop break-in" },

        // Noida Sector 18 (NCR)
        { id: 12, type: "theft", category: "property", lat: 28.5700, lng: 77.3200, time: getRelativeTime(3), severity: 3, description: "Chain snatching" },

        // Gurgaon Cyber Hub (NCR)
        { id: 13, type: "harassment", category: "quality_of_life", lat: 28.4950, lng: 77.0890, time: getRelativeTime(18), severity: 2, description: "Stalking incident" }
    ]
};

// Crime category weights
const CRIME_WEIGHTS = {
    violent: 5,
    property: 3,
    quality_of_life: 1
};

// Time-based risk multipliers
const TIME_RISK_MULTIPLIERS = {
    night: 1.6,        // 11 PM - 5 AM
    evening: 1.2,      // 7 PM - 11 PM
    day: 1.0,          // 6 AM - 7 PM
    early_morning: 1.4 // 5 AM - 6 AM
};

// Crime type icons and colors
const CRIME_DISPLAY_CONFIG = {
    assault: { icon: 'fa-fist-raised', color: '#dc2626' },
    robbery: { icon: 'fa-mask', color: '#b91c1c' },
    theft: { icon: 'fa-hand-holding', color: '#f97316' },
    vehicle_theft: { icon: 'fa-car-crash', color: '#ea580c' },
    burglary: { icon: 'fa-door-open', color: '#ea580c' },
    vandalism: { icon: 'fa-spray-can', color: '#eab308' },
    harassment: { icon: 'fa-comment-slash', color: '#ca8a04' }
};

// Demo locations for Delhi
const DEMO_LOCATIONS = {
    origin: {
        name: "Connaught Place",
        lat: 28.6315,
        lng: 77.2167
    },
    destination: {
        name: "Indira Gandhi International Airport",
        lat: 28.5562,
        lng: 77.1000
    },
    alternativeDestinations: [
        { name: "India Gate", lat: 28.6129, lng: 77.2295 },
        { name: "Red Fort", lat: 28.6562, lng: 77.2410 },
        { name: "Lotus Temple", lat: 28.5535, lng: 77.2588 }
    ]
};

// City configurations
const INDIAN_CITIES = {
    delhi: { center: [28.6139, 77.2090], zoom: 12, name: "Delhi NCR" }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CRIME_DATA, CRIME_WEIGHTS, TIME_RISK_MULTIPLIERS, CRIME_DISPLAY_CONFIG, DEMO_LOCATIONS, INDIAN_CITIES };
}
