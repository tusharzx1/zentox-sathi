# ZENTOX-SATHI - Crime-Aware Navigation Platform 🛡️

A smart navigation web application that helps you find the **safest routes** to your destination by analyzing crime data and time patterns.

![ZENTOX-SATHI](https://img.shields.io/badge/ZENTOX--SATHI-v1.0-blue?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)

## 🌟 Features

### Core Navigation
- **Smart Route Planning** - Input origin and destination with autocomplete
- **Safety Priority Slider** - Balance between fastest and safest routes
- **Multiple Transport Modes** - Walk, bike, car, or transit options
- **Time-Based Risk Assessment** - Schedule future trips with accurate safety predictions

### Crime Intelligence
- **Real-time Crime Heatmap** - Visualize crime density across the city
- **Crime Markers** - Toggle individual crime incident markers
- **Safety Scoring Algorithm** - AI-powered route safety calculation
- **Time-of-Day Analysis** - Higher risk multipliers for nighttime travel

### Visualization
- **Interactive Map** - Powered by Leaflet.js with dark theme
- **Color-Coded Routes** - Green (safe), Yellow (moderate), Red (risky)
- **Safety Score Display** - Real-time safety metrics for each route
- **Crime Legend** - Easy-to-understand crime type indicators

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for map tiles and routing API)

### Installation

1. **Clone or Download** the repository:
```bash
git clone https://github.com/yourusername/safe-route-app.git
cd safe-route-app
```

2. **Open the application**:
   - Simply open `frontend/index.html` in your browser
   - Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve frontend
```

3. **Access the app**:
   - Open `http://localhost:8000/frontend` in your browser

## 📁 Project Structure

```
safe-route-app/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── style.css           # All styles with CSS variables
│   ├── script.js           # Main application logic
│   └── data/
│       └── crimes.js       # Sample crime dataset (Mumbai)
├── README.md               # This file
└── .gitignore
```

## 🎮 Usage Guide

### Basic Navigation
1. **Click "Demo"** button to see a pre-configured route
2. Or enter your own origin and destination
3. Adjust the **Safety Slider** based on your preference
4. Click **"Find Safe Routes"**
5. Compare routes in the results panel

### Map Controls
- 🔥 **Heatmap Toggle** - Show/hide crime heatmap
- 📍 **Markers Toggle** - Show/hide individual crime markers
- ➕/➖ **Zoom** - Adjust map zoom level

### Safety Score
- **70-100**: Safe route (Green)
- **40-69**: Moderate risk (Yellow)
- **0-39**: High risk (Red)

## ⚙️ APIs Used

| API | Purpose | Cost |
|-----|---------|------|
| OpenStreetMap | Map tiles | Free |
| OSRM | Route calculation | Free |
| Nominatim | Geocoding | Free |
| Leaflet.heat | Heatmap visualization | Free |

## 🧮 Safety Algorithm

```javascript
route_safety_score = 100 - normalized_danger_score

danger_score = Σ (crime_severity × crime_weight × proximity_factor × time_multiplier)

crime_weights = {
  violent: 5,      // Assault, robbery
  property: 3,     // Theft, burglary
  quality_of_life: 1  // Vandalism, harassment
}

time_multipliers = {
  night (10PM-4AM): 1.5,
  evening (6PM-10PM): 1.2,
  early_morning (4AM-6AM): 1.3,
  day (6AM-6PM): 1.0
}
```

## 🎨 Design Features

- **Dark Theme** - Easy on the eyes, especially for nighttime use
- **Glassmorphism** - Modern frosted glass effects
- **Smooth Animations** - GSAP-powered transitions
- **Responsive Design** - Works on desktop and mobile
- **Premium UI** - Professional look and feel

## 🔧 Customization

### Add Your Own Crime Data
Edit `frontend/data/crimes.js`:
```javascript
const CRIME_DATA = {
  city: "Your City",
  crimes: [
    {
      id: 1,
      type: "theft",
      category: "property",
      lat: YOUR_LAT,
      lng: YOUR_LNG,
      time: "2024-01-15T22:30:00",
      severity: 3,
      description: "Description"
    }
  ]
};
```

### Change City Center
Edit `frontend/script.js`:
```javascript
const CONFIG = {
  map: {
    center: [YOUR_LAT, YOUR_LNG],
    zoom: 13
  }
};
```

## 🏆 Hackathon Features

- ✅ Working map with routing
- ✅ Crime heatmap visualization
- ✅ Multiple route alternatives
- ✅ Safety scoring algorithm
- ✅ Demo mode for presentations
- ✅ Clean, presentable UI
- ✅ Time-based risk assessment
- ✅ Transport mode selection

## 📄 License

MIT License - Feel free to use and modify!

## 🙏 Acknowledgments

- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [OSRM](http://project-osrm.org/) - Routing engine
- [OpenStreetMap](https://www.openstreetmap.org/) - Map data
- [Font Awesome](https://fontawesome.com/) - Icons
- [GSAP](https://greensock.com/gsap/) - Animations
- [Google Fonts](https://fonts.google.com/) - Typography

---

Built with ❤️ TUSHAR KUMAR

