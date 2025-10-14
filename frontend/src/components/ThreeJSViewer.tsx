import { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { EphemerisData } from '../types';

interface ThreeJSViewerProps {
  trajectoryData: Record<string, EphemerisData[]>;
  selectedObject?: string;
  maxTrajectoryPoints?: number;
  animationMode?: boolean;
  currentTimestep?: number; // Current animation timestep
  onTimestepChange?: (timestep: number) => void; // Callback for timestep change
  planetEphemeris?: Record<string, EphemerisData[]>; // Optional: JPL Horizons planet data
}

// Color mapping for objects
const OBJECT_COLORS: Record<string, string> = {
  '1I/Oumuamua': '#ff0000',
  '2I/Borisov': '#00ffff',
  '3I/ATLAS': '#00ff00',
};

// Planet data with orbital elements for proper positioning
interface PlanetData {
  name: string;
  color: string;
  radius: number; // Display radius in scene units
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  longitudeOfAscendingNode: number; // degrees
  argumentOfPerihelion: number; // degrees
  meanAnomaly: number; // degrees at epoch (J2000)
  orbitalPeriod: number; // days
}

const PLANETS: PlanetData[] = [
  {
    name: 'Mercury',
    color: '#888888',
    radius: 0.02,  // Reduced from 0.05
    semiMajorAxis: 0.38709893,
    eccentricity: 0.20563069,
    inclination: 7.00487,
    longitudeOfAscendingNode: 48.33167,
    argumentOfPerihelion: 77.45645,
    meanAnomaly: 252.25084,
    orbitalPeriod: 87.969,
  },
  {
    name: 'Venus',
    color: '#ffa500',
    radius: 0.035,  // Reduced from 0.095
    semiMajorAxis: 0.72333199,
    eccentricity: 0.00677323,
    inclination: 3.39471,
    longitudeOfAscendingNode: 76.68069,
    argumentOfPerihelion: 131.53298,
    meanAnomaly: 181.97973,
    orbitalPeriod: 224.701,
  },
  {
    name: 'Earth',
    color: '#0080ff',
    radius: 0.035,  // Reduced from 0.1
    semiMajorAxis: 1.00000011,
    eccentricity: 0.01671022,
    inclination: 0.00005,
    longitudeOfAscendingNode: -11.26064,
    argumentOfPerihelion: 102.94719,
    meanAnomaly: 100.46435,
    orbitalPeriod: 365.256,
  },
  {
    name: 'Mars',
    color: '#ff4500',
    radius: 0.025,  // Reduced from 0.065
    semiMajorAxis: 1.52366231,
    eccentricity: 0.09341233,
    inclination: 1.85061,
    longitudeOfAscendingNode: 49.57854,
    argumentOfPerihelion: 336.04084,
    meanAnomaly: 355.45332,
    orbitalPeriod: 686.980,
  },
  {
    name: 'Jupiter',
    color: '#daa520',
    radius: 0.08,  // Reduced from 0.3
    semiMajorAxis: 5.20336301,
    eccentricity: 0.04839266,
    inclination: 1.30530,
    longitudeOfAscendingNode: 100.55615,
    argumentOfPerihelion: 14.75385,
    meanAnomaly: 34.40438,
    orbitalPeriod: 4332.589,
  },
  {
    name: 'Saturn',
    color: '#f4a460',
    radius: 0.07,  // Reduced from 0.25
    semiMajorAxis: 9.53707032,
    eccentricity: 0.05415060,
    inclination: 2.48446,
    longitudeOfAscendingNode: 113.71504,
    argumentOfPerihelion: 92.43194,
    meanAnomaly: 49.94432,
    orbitalPeriod: 10759.22,
  },
  {
    name: 'Uranus',
    color: '#add8e6',
    radius: 0.05,  // Reduced from 0.18
    semiMajorAxis: 19.19126393,
    eccentricity: 0.04716771,
    inclination: 0.76986,
    longitudeOfAscendingNode: 74.22988,
    argumentOfPerihelion: 170.96424,
    meanAnomaly: 313.23218,
    orbitalPeriod: 30685.4,
  },
  {
    name: 'Neptune',
    color: '#1e90ff',
    radius: 0.05,  // Reduced from 0.175
    semiMajorAxis: 30.06896348,
    eccentricity: 0.00858587,
    inclination: 1.76917,
    longitudeOfAscendingNode: 131.72169,
    argumentOfPerihelion: 44.97135,
    meanAnomaly: 304.88003,
    orbitalPeriod: 60189.0,
  },
  {
    name: 'Pluto',
    color: '#d4a574',
    radius: 0.015,  // Reduced from 0.04
    semiMajorAxis: 39.48211675,
    eccentricity: 0.24882730,
    inclination: 17.14001,
    longitudeOfAscendingNode: 110.30393684,
    argumentOfPerihelion: 113.83420109,
    meanAnomaly: 14.53619609,
    orbitalPeriod: 90560.0,
  },
];

// Convert orbital elements to Cartesian coordinates (heliocentric)
// time: days since J2000.0 (January 1, 2000, 12:00 TT)
function orbitalToCartesian(planet: PlanetData, time: number = 0): THREE.Vector3 {
  // Calculate mean motion (degrees per day)
  const n = 360 / planet.orbitalPeriod;

  // Calculate mean anomaly at given time (days since J2000)
  const M = (planet.meanAnomaly + n * time) % 360;
  const M_rad = THREE.MathUtils.degToRad(M);

  // Solve Kepler's equation for eccentric anomaly (using Newton's method)
  let E = M_rad;
  for (let i = 0; i < 10; i++) {
    E = M_rad + planet.eccentricity * Math.sin(E);
  }

  // Calculate true anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + planet.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - planet.eccentricity) * Math.cos(E / 2)
  );

  // Calculate distance from sun
  const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(E));

  // Calculate position in orbital plane
  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);

  // Convert angles to radians
  const i = THREE.MathUtils.degToRad(planet.inclination);
  const omega = THREE.MathUtils.degToRad(planet.argumentOfPerihelion);
  const Omega = THREE.MathUtils.degToRad(planet.longitudeOfAscendingNode);

  // Apply rotation matrices to convert to heliocentric ecliptic coordinates
  const x = x_orb * (Math.cos(omega) * Math.cos(Omega) - Math.sin(omega) * Math.sin(Omega) * Math.cos(i))
          - y_orb * (Math.sin(omega) * Math.cos(Omega) + Math.cos(omega) * Math.sin(Omega) * Math.cos(i));

  const y = x_orb * (Math.cos(omega) * Math.sin(Omega) + Math.sin(omega) * Math.cos(Omega) * Math.cos(i))
          - y_orb * (Math.sin(omega) * Math.sin(Omega) - Math.cos(omega) * Math.cos(Omega) * Math.cos(i));

  const z = x_orb * (Math.sin(omega) * Math.sin(i))
          + y_orb * (Math.cos(omega) * Math.sin(i));

  return new THREE.Vector3(x, z, -y); // Convert to Three.js coordinate system (Y-up)
}

// Convert calendar date to days since J2000.0
function dateToJ2000Days(dateString: string): number {
  const date = new Date(dateString);
  const j2000 = new Date('2000-01-01T12:00:00Z');
  const diffMs = date.getTime() - j2000.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays;
}

// Sun component
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="#ffff00" emissive="#ffdd00" emissiveIntensity={3.5} />
      <Html distanceFactor={3} position={[0, 0.5, 0]}>
        <div style={{
          color: 'yellow',
          fontSize: '14px',
          fontWeight: 'bold',
          textShadow: '0 0 5px black, 0 0 10px black',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          Sun
        </div>
      </Html>
    </mesh>
  );
}

// Planet component with animated position
function Planet({
  planet,
  showLabel = true,
  currentDate,
  ephemerisData,
  currentTimestep = 0
}: {
  planet: PlanetData;
  showLabel?: boolean;
  currentDate?: string;
  ephemerisData?: EphemerisData[];
  currentTimestep?: number;
}) {
  // Use ephemeris data if available, otherwise calculate from orbital elements
  const position = useMemo(() => {
    // Priority 1: Use JPL Horizons ephemeris data if available
    if (ephemerisData && ephemerisData.length > 0) {
      const data = ephemerisData[Math.min(currentTimestep, ephemerisData.length - 1)];
      if (data && data.x !== undefined && data.y !== undefined && data.z !== undefined) {
        if (planet.name === 'Jupiter' && currentTimestep % 20 === 0) {
          console.log(`${planet.name} using JPL data [timestep ${currentTimestep}]:`, {
            x: data.x, y: data.y, z: data.z,
            date: data.datetime_str,
            threejs: { x: data.x, y: data.z, z: -data.y }
          });
        }
        return new THREE.Vector3(data.x, data.z, -data.y);
      }
    }

    // Priority 2: Calculate from date if available
    if (currentDate) {
      const daysSinceJ2000 = dateToJ2000Days(currentDate);
      const pos = orbitalToCartesian(planet, daysSinceJ2000);
      if (planet.name === 'Jupiter') {
        console.log(`${planet.name} using orbital elements for ${currentDate}:`, {
          threejs: { x: pos.x, y: pos.y, z: pos.z }
        });
      }
      return pos;
    }

    // Priority 3: Default to J2000 epoch
    return orbitalToCartesian(planet, 0);
  }, [planet, currentDate, ephemerisData, currentTimestep]);

  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[planet.radius, 16, 16]} />
        <meshStandardMaterial color={planet.color} emissive={planet.color} emissiveIntensity={0.5} />
        {showLabel && (
          <Html distanceFactor={5} position={[0, planet.radius + 0.2, 0]}>
            <div style={{
              color: 'white',
              fontSize: '12px',
              textShadow: '0 0 3px black, 0 0 6px black',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>
              {planet.name}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

// Orbital path component
function OrbitalPath({ planet }: { planet: PlanetData }) {
  const points = useMemo(() => {
    // Always calculate from orbital elements to show complete orbit
    // Orbital inclinations and orientations remain stable for thousands of years
    const pts: THREE.Vector3[] = [];
    const steps = 200; // More points for smoother orbits

    for (let i = 0; i <= steps; i++) {
      const time = (i / steps) * planet.orbitalPeriod;
      pts.push(orbitalToCartesian(planet, time));
    }

    return pts;
  }, [planet]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={planet.color} opacity={0.3} transparent />
    </line>
  );
}

// Trajectory component for interstellar objects
function Trajectory({
  data,
  color,
  name,
  isSelected,
  currentTimestep = 0,
  showTrail = true
}: {
  data: EphemerisData[];
  color: string;
  name: string;
  isSelected: boolean;
  currentTimestep?: number;
  showTrail?: boolean;
}) {
  const points = useMemo(() => {
    return data.map(point => new THREE.Vector3(point.x, point.z, -point.y));
  }, [data]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  // Get current position based on timestep
  const currentPosition = points[currentTimestep] || points[0] || new THREE.Vector3(0, 0, 0);

  // Trail geometry (from start to current timestep)
  const trailGeometry = useMemo(() => {
    if (!showTrail || currentTimestep === 0) return null;
    const trailPoints = points.slice(0, currentTimestep + 1);
    return new THREE.BufferGeometry().setFromPoints(trailPoints);
  }, [points, currentTimestep, showTrail]);

  // Current ephemeris data for display
  const currentData = data[currentTimestep] || data[0];

  return (
    <group>
      {/* Full trajectory line or trail */}
      {showTrail ? (
        <>
          {/* Full trajectory line (faded) */}
          <line geometry={geometry}>
            <lineBasicMaterial
              color={color}
              opacity={0.2}
              transparent
            />
          </line>
          {/* Trail up to current position (bright) */}
          {trailGeometry && (
            <line geometry={trailGeometry}>
              <lineBasicMaterial
                color={color}
                opacity={isSelected ? 1.0 : 0.6}
                transparent
              />
            </line>
          )}
        </>
      ) : (
        /* Static mode - show full bright trajectory */
        <line geometry={geometry}>
          <lineBasicMaterial
            color={color}
            opacity={isSelected ? 0.8 : 0.6}
            transparent
          />
        </line>
      )}

      {/* Current position marker */}
      <mesh position={currentPosition}>
        <sphereGeometry args={[isSelected ? 0.15 : 0.1, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        <Html distanceFactor={5} position={[0, 0.3, 0]}>
          <div style={{
            color: color,
            fontSize: isSelected ? '14px' : '12px',
            fontWeight: isSelected ? 'bold' : 'normal',
            textShadow: '0 0 3px black, 0 0 6px black',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            <div>{name}</div>
            {isSelected && currentData && showTrail && (
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                {currentData.datetime_str.split(' ')[0]}
              </div>
            )}
          </div>
        </Html>
      </mesh>
    </group>
  );
}

// Camera controller for focusing on selected object
function CameraController({ focusPosition }: { focusPosition: THREE.Vector3 | null }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (focusPosition && controls) {
      // Calculate distance based on object position
      const distance = Math.max(5, focusPosition.length() * 0.5);

      // Position camera at an angle to view both the object and the Sun
      const angle = Math.atan2(focusPosition.z, focusPosition.x);
      const cameraX = focusPosition.x * 0.3 + Math.cos(angle + Math.PI / 4) * distance;
      const cameraY = distance * 0.4; // Elevated view
      const cameraZ = focusPosition.z * 0.3 + Math.sin(angle + Math.PI / 4) * distance;

      // Smoothly move camera
      const targetPos = new THREE.Vector3(cameraX, cameraY, cameraZ);
      camera.position.lerp(targetPos, 0.05);

      // Update controls target to look at the object
      if ('target' in controls) {
        const orbitControls = controls as any;
        orbitControls.target.lerp(focusPosition, 0.05);
      }
    }
  }, [focusPosition, camera, controls]);

  return null;
}

// Scene component
function Scene({
  trajectoryData,
  selectedObject,
  maxTrajectoryPoints = 200,
  animationMode = false,
  currentTimestep = 0,
  planetEphemeris = {}
}: ThreeJSViewerProps) {
  const [focusPosition, setFocusPosition] = useState<THREE.Vector3 | null>(null);

  // Throttle trajectory data (only when not in animation mode)
  const throttledTrajectoryData = useMemo(() => {
    const result: Record<string, EphemerisData[]> = {};

    Object.entries(trajectoryData).forEach(([objectName, data]) => {
      if (!data || data.length === 0) {
        result[objectName] = [];
        return;
      }

      // In animation mode, use all data points; otherwise throttle
      if (!animationMode && data.length > maxTrajectoryPoints) {
        const step = Math.ceil(data.length / maxTrajectoryPoints);
        result[objectName] = data.filter((_, i) => i % step === 0);
      } else {
        result[objectName] = data;
      }
    });

    return result;
  }, [trajectoryData, maxTrajectoryPoints, animationMode]);

  // Get current date for planet positioning
  const currentDate = useMemo(() => {
    if (selectedObject && throttledTrajectoryData[selectedObject]?.length > 0) {
      // In animation mode, use current timestep; otherwise use first data point
      const timestep = animationMode ? currentTimestep : 0;
      const data = throttledTrajectoryData[selectedObject][timestep];
      if (data?.datetime_str) {
        return data.datetime_str.split(' ')[0]; // Extract date part (YYYY-MM-DD)
      }
    }
    // Default to a reference date (start of 2025)
    return '2025-01-01';
  }, [animationMode, selectedObject, throttledTrajectoryData, currentTimestep]);

  // Update focus position based on current timestep
  useEffect(() => {
    if (selectedObject && throttledTrajectoryData[selectedObject]?.length > 0) {
      const timestep = animationMode ? currentTimestep : 0;
      const data = throttledTrajectoryData[selectedObject][timestep] || throttledTrajectoryData[selectedObject][0];
      setFocusPosition(new THREE.Vector3(data.x, data.z, -data.y));
    }
  }, [selectedObject, throttledTrajectoryData, animationMode, currentTimestep]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 0, 0]} intensity={4} color="#ffffdd" />

      {/* Stars background */}
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Sun */}
      <Sun />

      {/* Planets with orbital paths */}
      {PLANETS.map(planet => {
        const planetData = planetEphemeris[planet.name];
        if (planet.name === 'Jupiter') {
          console.log('Jupiter planet rendering:', {
            hasPlanetEphemeris: !!planetEphemeris,
            planetEphemerisKeys: Object.keys(planetEphemeris),
            jupiterDataExists: !!planetData,
            jupiterDataLength: planetData?.length || 0,
            currentTimestep,
            animationMode
          });
        }
        return (
          <group key={planet.name}>
            <OrbitalPath planet={planet} />
            <Planet
              planet={planet}
              currentDate={currentDate}
              ephemerisData={planetData}
              currentTimestep={animationMode ? currentTimestep : 0}
            />
          </group>
        );
      })}

      {/* Interstellar object trajectories */}
      {Object.entries(throttledTrajectoryData).map(([objectName, data]) => {
        if (!data || data.length === 0) return null;

        const color = OBJECT_COLORS[objectName] || '#ffffff';
        const isSelected = selectedObject === objectName;

        return (
          <Trajectory
            key={objectName}
            data={data}
            color={color}
            name={objectName}
            isSelected={isSelected}
            currentTimestep={animationMode ? currentTimestep : 0}
            showTrail={animationMode}
          />
        );
      })}

      {/* Camera controller */}
      <CameraController focusPosition={focusPosition} />

      {/* Orbit controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={50}
        target={[0, 0, 0]}
      />
    </>
  );
}

// Main viewer component
export function ThreeJSViewer(props: ThreeJSViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#000000' }}>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
