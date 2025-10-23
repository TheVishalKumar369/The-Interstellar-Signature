#  3I/ATLAS - Interstellar Objects Visualization

An interactive 3D visualization platform for comparing trajectories of interstellar objects passing through our solar system. Built with Three.js, React, and FastAPI, powered by JPL Horizons ephemeris data.

<img width="1909" height="890" alt="Screenshot (824)" src="https://github.com/user-attachments/assets/3cc9a2d7-a627-41d1-8d9c-9dd9ff5b73cf" />
<img width="1920" height="916" alt="overview_2" src="https://github.com/user-attachments/assets/20a2f4bc-1b88-48c7-891d-00e28650bde5" />
<img width="732" height="463" alt="distance_comparisson" src="https://github.com/user-attachments/assets/c9c2ccc2-5498-4cfe-b10d-042979438c28" />
<img width="723" height="481" alt="velocity" src="https://github.com/user-attachments/assets/08c14c15-8fa9-4a74-b9c2-8f555bf6a43c" />
<img width="725" height="501" alt="energy" src="https://github.com/user-attachments/assets/664bf62f-950d-4aa4-8ba9-2a90fd82f73f" />
<img width="739" height="484" alt="multi-character" src="https://github.com/user-attachments/assets/609d78fb-172d-43c9-8ed7-7b31671c69e2" />


## Features

### 3D Visualization
- **Real-time Three.js rendering** with accurate heliocentric coordinates
- **Interactive orbital mechanics** using Kepler's equations for planetary positions
- **Timestamped animation** showing object movement through time
- **Multi-object comparison** with color-coded trajectories
- **Dynamic camera controls** with orbit, zoom, and pan

### Data Integration
- **JPL Horizons API** for real-time ephemeris data
- **PDS metadata** including physical properties, spectral data, and discovery information
- **Orbital elements** for scientific comparison (eccentricity, inclination, perihelion)
- **Timestamped coordinates** (x, y, z positions at each time step)

### Animation System
- **Playback controls** with adjustable speed (0.5x to 10x)
- **Timeline scrubbing** for manual navigation through time
- **Trail visualization** showing object paths
- **Date display** with current position information

### Supported Objects
- **1I/ʻOumuamua** - First detected interstellar object (2017)
- **2I/Borisov** - First interstellar comet (2019)
- **3I/ATLAS** - Third interstellar object (2025)

##  Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** 3.9+
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/3I_ATLAS.git
cd 3I_ATLAS
```

2. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure environment variables**

Create `backend/.env`:
```env
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=True
LOG_LEVEL=INFO
JPL_HORIZONS_URL=https://ssd.jpl.nasa.gov/api/horizons.api
JPL_REQUEST_DELAY=1.0
CORS_ORIGINS=["http://localhost:3000"]
```

### Running the Application

1. **Start the backend server**
```bash
cd backend
python main.py
```
Backend will run at `http://localhost:8000`

2. **Start the frontend development server**
```bash
cd frontend
npm run dev
```
Frontend will run at `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

##  Usage Guide

### Basic Workflow

1. **Select Objects**
   - Click on object buttons to select/deselect (1I/Oumuamua, 2I/Borisov, 3I/ATLAS)
   - Or use "Select All" button to choose all objects
   - Selected count is displayed

2. **Set Time Range**
   - Choose start and end dates
   - Select step size (1 day, 5 days, 10 days, or 1 month)
   - Smaller steps = more detailed animation (but slower)

3. **Fetch Data**
   - Click "Fetch Data" to retrieve trajectories from JPL Horizons
   - Data includes both ephemeris and PDS metadata

4. **View Trajectories**
   - 3D View: Interactive Three.js visualization
   - Charts View: Comparative analysis graphs

5. **Animate**
   - Click "Start Animation" to enable timestamped playback
   - Use play/pause button and timeline slider
   - Adjust speed from 0.5x to 10x
   - Objects move through their actual historical positions

### Keyboard Controls (3D View)
- **Left Mouse**: Rotate camera
- **Right Mouse**: Pan view
- **Scroll**: Zoom in/out

##  Project Structure

```
3I_ATLAS/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main API server
│   ├── config.py              # Configuration
│   ├── models.py              # Pydantic models
│   ├── requirements.txt       # Python dependencies
│   ├── fetch_data/            # Data fetching modules
│   │   ├── horizons.py        # JPL Horizons client
│   │   ├── pds_fetcher.py     # PDS data fetcher
│   │   └── data_merger.py     # Data merging utilities
│   └── utils/                 # Utility functions
│       └── czml_generator.py  # CZML generation (legacy)
│
├── frontend/                   # React + Three.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThreeJSViewer.tsx    # Main 3D viewer
│   │   │   └── ComparisonCharts.tsx # Chart components
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── App.tsx                  # Main application
│   │   └── main.tsx                 # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── data/                       # Data directory
│   └── pds/                    # PDS metadata JSON files
│       ├── 1I_Oumuamua_complete.json
│       ├── 2I_Borisov_complete.json
│       ├── 3I_ATLAS_complete.json
│       ├── Mercury.json        # Planet data
│       ├── Venus.json
│       ├── Earth.json
│       ├── Mars.json
│       ├── Jupiter.json
│       ├── Saturn.json
│       ├── Uranus.json
│       ├── Neptune.json
│       └── Sun.json
│
└── README.md
```

##  Technical Details

### Backend Architecture
- **FastAPI** for REST API endpoints
- **JPL Horizons API** integration for ephemeris queries
- **Dual-mode support**: Live position and custom time range queries
- **PDS metadata merging** from JSON files
- **CORS enabled** for local development

### Frontend Architecture
- **React 18** with TypeScript
- **Three.js** for 3D rendering via `@react-three/fiber`
- **React Query** for data fetching and caching
- **Vite** for fast development and building

### Coordinate Systems
- **Heliocentric ecliptic coordinates** from JPL Horizons (x, y, z in AU)
- **Orbital elements** calculated using Kepler's equation
- **Three.js coordinate transformation**: (x, z, -y) for proper Y-up rendering

### Data Sources
- **JPL Horizons System**: Real-time ephemeris data
- **PDS (Planetary Data System)**: Physical and spectral properties
- **NASA/JPL**: Orbital elements and discovery information

## API Endpoints

### Objects
- `GET /api/objects` - List all available interstellar objects
- `GET /api/objects/{object_name}` - Get object information

### Ephemeris Data
- `GET /api/live/{object_id}` - Get current position (live mode)
- `POST /api/query/{object_id}` - Get custom time range data (query mode)
  - Parameters: `start_time`, `stop_time`, `step_size`, `observer`

### Orbital Elements
- `GET /api/orbital/{object_id}` - Get orbital elements for comparison

### Data
- `GET /api/data/{object_name}` - Get cached PDS metadata
- `GET /api/data` - List all available data files

##  Customization

### Adding New Objects

1. **Add to backend registry** (`backend/main.py`):
```python
INTERSTELLAR_OBJECTS = {
    "4I/NewObject": {
        "designation": "C/2026 X1",
        "discovery_year": 2026,
        "description": "Fourth interstellar object"
    }
}
```

2. **Create PDS metadata file** (`data/pds/4I_NewObject_complete.json`)

3. **Update color mapping** (`frontend/src/components/ThreeJSViewer.tsx`):
```typescript
const OBJECT_COLORS: Record<string, string> = {
  '4I/NewObject': '#ff00ff',
  // ... other objects
};
```

### Adjusting Animation Speed
Modify `frontend/src/App.tsx`:
```typescript
<option value="20">20x</option>  // Add faster speeds
<option value="50">50x</option>
```

##  Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in backend/.env
API_PORT=8001
```

**JPL Horizons API errors:**
- Check internet connection
- Verify object designation is correct
- Ensure date range is valid (objects must be observable)

### Frontend Issues

**Three.js rendering errors:**
- Clear browser cache
- Check WebGL support: `chrome://gpu`
- Update graphics drivers

**Data not loading:**
- Verify backend is running at `http://localhost:8000`
- Check browser console for CORS errors
- Ensure `.env` CORS_ORIGINS includes frontend URL

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **NASA JPL Horizons System** - Ephemeris data
- **Planetary Data System (PDS)** - Scientific metadata
- **Three.js Community** - 3D rendering framework
- **React Three Fiber** - React renderer for Three.js

## Contact

For questions, issues, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/TheVishalKumar369/3I_ATLAS/issues)
- **Email**: panchanarayansahu00@gmail.com
##  Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Add more interstellar objects as they're discovered
- [ ] Implement WebGL orbit paths with line width support
- [ ] Add export functionality (screenshots, videos)
- [ ] Mobile responsive design
- [ ] Real-time object tracking mode
- [ ] Educational mode with annotations
- [ ] VR/AR support

---

**Made with ❤️ for space exploration and scientific visualization**











