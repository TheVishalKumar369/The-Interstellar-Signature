import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Play, Pause, RotateCcw, Globe, BarChart3 } from 'lucide-react';
import { ThreeJSViewer } from './components/ThreeJSViewer';
import { ComparisonCharts } from './components/ComparisonCharts';
import { apiClient } from './services/api';
import type { InterstellarObject, EphemerisData, OrbitalElements } from './types';
import './App.css';

const queryClient = new QueryClient();

// Color mapping for objects (matching ThreeJSViewer)
const OBJECT_COLORS: Record<string, string> = {
  '1I/Oumuamua': '#ff0000',
  '2I/Borisov': '#00ffff',
  '3I/ATLAS': '#00ff00',
};

function AppContent() {
  const [selectedObjects, setSelectedObjects] = useState<string[]>(['3I/ATLAS']);
  const [selectedObject, setSelectedObject] = useState<string>('3I/ATLAS');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [stepSize, setStepSize] = useState('5d');
  const [viewMode, setViewMode] = useState<'3d' | 'charts'>('3d');
  const [isLoading, setIsLoading] = useState(false);

  // Performance settings for Three.js - trajectory points limit
  const [maxTrajectoryPoints, setMaxTrajectoryPoints] = useState(200);

  // Animation state
  const [animationMode, setAnimationMode] = useState(false);
  const [currentTimestep, setCurrentTimestep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // timesteps per second
  const [maxTimesteps, setMaxTimesteps] = useState(0);

  // PDS metadata storage
  const [pdsMetadata, setPdsMetadata] = useState<Record<string, any>>({});

  // Planet ephemeris storage (optional - only fetched once)
  const [planetEphemeris, setPlanetEphemeris] = useState<Record<string, EphemerisData[]>>({});

  // Fetch available objects
  const { data: objects = [] } = useQuery({
    queryKey: ['objects'],
    queryFn: () => apiClient.getObjects()
  });

  // State for trajectory and orbital data
  const [trajectoryData, setTrajectoryData] = useState<Record<string, EphemerisData[]>>({});
  const [orbitalElements, setOrbitalElements] = useState<Record<string, OrbitalElements>>({});

  // Fetch data for selected objects
  const fetchData = async () => {
    setIsLoading(true);
    console.log('Fetching data for objects:', selectedObjects);
    console.log('Date range:', startDate, 'to', endDate, 'step:', stepSize);

    try {
      const newTrajectoryData: Record<string, EphemerisData[]> = {};
      const newOrbitalElements: Record<string, OrbitalElements> = {};
      let planetsFetched = false;

      for (const objectName of selectedObjects) {
        console.log(`Fetching ${objectName}...`);

        // Fetch trajectory data (include planets for first object only)
        const includePlanets = !planetsFetched;

        const queryResponse = await apiClient.getQueryMode(
          objectName,
          startDate,
          endDate,
          stepSize,
          '@sun',
          includePlanets
        );
        console.log(`${objectName} trajectory response:`, queryResponse);

        if (queryResponse.success) {
          newTrajectoryData[objectName] = queryResponse.data;
          console.log(`${objectName} data points:`, queryResponse.data.length);

          // Store PDS metadata if available
          if (queryResponse.pds_metadata) {
            setPdsMetadata(prev => ({
              ...prev,
              [objectName]: queryResponse.pds_metadata
            }));
            console.log(`${objectName} PDS metadata loaded:`, queryResponse.pds_metadata.object);
          } else {
            console.warn(`${objectName} NO PDS metadata received from backend`);
          }

          // Store planet ephemeris data if included (only once)
          if (includePlanets && queryResponse.planets) {
            setPlanetEphemeris(queryResponse.planets);
            planetsFetched = true;
            console.log('Planet ephemeris loaded for:', Object.keys(queryResponse.planets));
          }

          // Update max timesteps
          if (queryResponse.data.length > maxTimesteps) {
            setMaxTimesteps(queryResponse.data.length);
          }
        } else {
          console.error(`Failed to fetch ${objectName} trajectory`);
        }

        // Fetch orbital elements
        const orbitalResponse = await apiClient.getOrbitalElements(objectName);
        console.log(`${objectName} orbital response:`, orbitalResponse);

        if (orbitalResponse.success) {
          newOrbitalElements[objectName] = orbitalResponse.orbital_elements;
        } else {
          console.error(`Failed to fetch ${objectName} orbital elements`);
        }
      }

      console.log('Final trajectory data:', newTrajectoryData);
      console.log('Final orbital data:', newOrbitalElements);

      setTrajectoryData(newTrajectoryData);
      setOrbitalElements(newOrbitalElements);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Animation playback effect
  useEffect(() => {
    if (!isPlaying || !animationMode) return;

    const interval = setInterval(() => {
      setCurrentTimestep(prev => {
        if (prev >= maxTimesteps - 1) {
          setIsPlaying(false);
          return 0; // Loop back to start
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, animationMode, maxTimesteps, playbackSpeed]);

  // Reset timestep when animation mode changes
  useEffect(() => {
    if (!animationMode) {
      setCurrentTimestep(0);
      setIsPlaying(false);
    }
  }, [animationMode]);


  const toggleObjectSelection = (objectName: string) => {
    setSelectedObjects(prev =>
      prev.includes(objectName)
        ? prev.filter(name => name !== objectName)
        : [...prev, objectName]
    );
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>THE INTERSTELLAR SIGNATURE - TRACK THE INTERSTELLAR WORLD</h1>
        <p>Visualizing trajectories of interstellar visitors to our solar system</p>
      </header>

      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-section">
          <label>Select Objects (click multiple):</label>
          <div className="object-selector">
            {objects.map((obj: InterstellarObject) => (
              <button
                key={obj.name}
                className={`object-button ${selectedObjects.includes(obj.name) ? 'active' : ''}`}
                onClick={() => toggleObjectSelection(obj.name)}
              >
                {obj.name}
              </button>
            ))}
            <button
              className="object-button"
              onClick={() => {
                const allNames = objects.map((o: InterstellarObject) => o.name);
                setSelectedObjects(allNames);
              }}
              style={{ marginLeft: '10px', background: '#6366f1' }}
            >
              Select All
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
            Selected: {selectedObjects.length} object(s)
          </p>
        </div>

        <div className="control-section">
          <label>Time Range:</label>
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <select value={stepSize} onChange={(e) => setStepSize(e.target.value)}>
              <option value="1d">1 day</option>
              <option value="5d">5 days</option>
              <option value="10d">10 days</option>
              <option value="1m">1 month</option>
            </select>
          </div>
        </div>

        <div className="control-section">
          <button className="fetch-button" onClick={fetchData} disabled={isLoading}>
            {isLoading ? <RotateCcw className="spin" size={16} /> : <Play size={16} />}
            {isLoading ? 'Loading...' : 'Fetch Data'}
          </button>

          <button
            className="fetch-button"
            onClick={() => setAnimationMode(!animationMode)}
            disabled={Object.keys(trajectoryData).length === 0}
            style={{ marginLeft: '10px', background: animationMode ? '#10b981' : '#6366f1' }}
          >
            {animationMode ? 'Stop Animation' : 'Start Animation'}
          </button>

          <div className="view-toggle">
            <button
              className={viewMode === '3d' ? 'active' : ''}
              onClick={() => setViewMode('3d')}
            >
              <Globe size={16} />
              3D View
            </button>
            <button
              className={viewMode === 'charts' ? 'active' : ''}
              onClick={() => setViewMode('charts')}
            >
              <BarChart3 size={16} />
              Charts
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === '3d' ? (
          <div className="viewer-container">
            <ThreeJSViewer
              trajectoryData={trajectoryData}
              selectedObject={selectedObject}
              maxTrajectoryPoints={maxTrajectoryPoints}
              animationMode={animationMode}
              currentTimestep={currentTimestep}
              planetEphemeris={planetEphemeris}
            />

            {/* Animation Controls */}
            {animationMode && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '15px 20px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                zIndex: 100
              }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <input
                  type="range"
                  min="0"
                  max={maxTimesteps - 1}
                  value={currentTimestep}
                  onChange={(e) => {
                    setCurrentTimestep(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  style={{ width: '300px' }}
                />

                <span style={{ color: 'white', fontSize: '12px', minWidth: '150px' }}>
                  {trajectoryData[selectedObject]?.[currentTimestep]?.datetime_str || 'N/A'}
                  ({currentTimestep + 1} / {maxTimesteps})
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label style={{ color: 'white', fontSize: '12px' }}>Speed:</label>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    style={{
                      background: '#1f2937',
                      color: 'white',
                      border: '1px solid #374151',
                      padding: '4px 8px',
                      borderRadius: '5px'
                    }}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="5">5x</option>
                    <option value="10">10x</option>
                  </select>
                </div>
              </div>
            )}

            <div className="object-selector-overlay">
              {animationMode ? (
                <>
                  <h4 style={{ color: '#10b981' }}>Animation Mode</h4>
                  <p style={{ fontSize: '11px', color: '#999', marginBottom: '10px' }}>
                    Animating through {maxTimesteps} timesteps
                  </p>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {selectedObjects.map(name => (
                      <div key={name} style={{ margin: '5px 0' }}>
                        <span style={{ color: OBJECT_COLORS[name as keyof typeof OBJECT_COLORS] || '#fff' }}>●</span> {name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h4>Focus Object:</h4>
                  {selectedObjects.map(name => (
                    <button
                      key={name}
                      className={selectedObject === name ? 'active' : ''}
                      onClick={() => setSelectedObject(name)}
                    >
                      {name}
                    </button>
                  ))}
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      Quality: {maxTrajectoryPoints} points
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="50"
                      value={maxTrajectoryPoints}
                      onChange={(e) => setMaxTrajectoryPoints(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <ComparisonCharts
            trajectoryData={trajectoryData}
            orbitalElements={orbitalElements}
          />
        )}
      </div>

      {/* Info Panel */}
      <div className="info-panel">
        <h3>Object Information</h3>
        {selectedObjects.map(name => {
          const obj = objects.find((o: InterstellarObject) => o.name === name);
          const orbital = orbitalElements[name];
          const timestep = animationMode ? currentTimestep : 0;
          const trajectory = trajectoryData[name]?.[timestep];
          const metadata = pdsMetadata[name];

          return (
            <div key={name} className="object-info">
              <h4>{name}</h4>
              {obj && <p className="description">{obj.description}</p>}

              {/* PDS Metadata - Physical Properties */}
              {metadata?.physical_properties && (
                <div className="stats" style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
                  <h5 style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>Physical Properties</h5>
                  {metadata.physical_properties.estimated_diameter_km && (
                    <div className="stat">
                      <span>Diameter:</span>
                      <strong>{metadata.physical_properties.estimated_diameter_km} km</strong>
                    </div>
                  )}
                  {metadata.physical_properties.albedo && (
                    <div className="stat">
                      <span>Albedo:</span>
                      <strong>{metadata.physical_properties.albedo.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* PDS Metadata - Spectral Data */}
              {metadata?.spectral_data?.spectral_type && (
                <div className="stats" style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
                  <h5 style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>Spectral Type</h5>
                  <div className="stat">
                    <strong>{metadata.spectral_data.spectral_type}</strong>
                  </div>
                </div>
              )}

              {/* Orbital Elements */}
              {orbital && (
                <div className="stats" style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
                  <h5 style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>Orbital Elements</h5>
                  <div className="stat">
                    <span>Eccentricity:</span>
                    <strong>{orbital.e.toFixed(2)}</strong>
                  </div>
                  <div className="stat">
                    <span>Inclination:</span>
                    <strong>{orbital.i.toFixed(1)}°</strong>
                  </div>
                  <div className="stat">
                    <span>Perihelion:</span>
                    <strong>{orbital.q.toFixed(2)} AU</strong>
                  </div>
                </div>
              )}

              {/* Current Position (from timestep) */}
              {trajectory && (
                <div className="stats" style={{ borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
                  <h5 style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>
                    {animationMode ? `Position at ${trajectory.datetime_str.split(' ')[0]}` : 'Current Position'}
                  </h5>
                  <div className="stat">
                    <span>Distance from Sun:</span>
                    <strong>{trajectory.r.toFixed(2)} AU</strong>
                  </div>
                  <div className="stat">
                    <span>Distance from Earth:</span>
                    <strong>{trajectory.delta.toFixed(2)} AU</strong>
                  </div>
                  {trajectory.V_mag && (
                    <div className="stat">
                      <span>Visual Magnitude:</span>
                      <strong>{trajectory.V_mag.toFixed(1)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
