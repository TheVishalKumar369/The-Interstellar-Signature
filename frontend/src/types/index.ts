// Interstellar object types
export interface InterstellarObject {
  name: string;
  designation: string;
  discovery_year: number;
  description?: string;
}

// Ephemeris data for visualization
export interface EphemerisData {
  datetime_str: string;
  datetime_jd: number;
  RA: number;  // Right Ascension (degrees)
  DEC: number; // Declination (degrees)
  delta: number; // Distance from Earth (AU)
  r: number; // Distance from Sun (AU)
  x: number; // Heliocentric X (AU)
  y: number; // Heliocentric Y (AU)
  z: number; // Heliocentric Z (AU)
  vx: number; // Velocity X (AU/day)
  vy: number; // Velocity Y (AU/day)
  vz: number; // Velocity Z (AU/day)
  V_mag?: number; // Visual magnitude
  elong?: number; // Solar elongation (degrees)
  phase_angle?: number; // Phase angle (degrees)
}

// Orbital elements
export interface OrbitalElements {
  epoch: string;
  a?: number; // Semi-major axis (AU) - null for hyperbolic
  e: number; // Eccentricity
  i: number; // Inclination (degrees)
  Omega: number; // Longitude of ascending node
  w: number; // Argument of periapsis
  q: number; // Perihelion distance (AU)
  Tp?: string; // Time of perihelion
  n?: number; // Mean motion (deg/day)
  M?: number; // Mean anomaly
  period?: number; // Orbital period (days) - null for hyperbolic
  H?: number; // Absolute magnitude
  G?: number; // Magnitude slope parameter
}

// PDS Metadata types (from data/pds/ JSON files)
export interface PDSDiscovery {
  date?: string;
  discovered_by?: string;
  telescope?: string;
  known_since?: string;
  reference: string;
}

export interface PDSPhysicalProperties {
  estimated_diameter_km?: number;
  equatorial_radius_km?: number;
  mass_kg?: number;
  mean_density_g_cm3?: number;
  albedo?: number;
  color_index_BV?: number;
  surface_gravity_m_s2?: number;
  escape_velocity_km_s?: number;
  rotation_period_days?: number;
  axial_tilt_degrees?: number;
}

export interface PDSSpectralData {
  spectral_type?: string;
  dominant_materials?: string[];
  detected_volatiles?: string[];
}

export interface PDSPhotometry {
  absolute_magnitude_H?: number;
  slope_parameter_G?: number;
  geometric_albedo?: number;
}

export interface PDSReflectanceSpectrum {
  wavelength_um: number;
  reflectance: number;
}

export interface PDSObservationMetadata {
  instruments?: string[];
  date_range?: string[];
  observers?: string[];
}

export interface PDSMetadata {
  object: string;
  type: string;
  discovery?: PDSDiscovery;
  physical_properties?: PDSPhysicalProperties;
  spectral_data?: PDSSpectralData;
  photometry?: PDSPhotometry;
  reflectance_spectrum?: PDSReflectanceSpectrum[];
  observation_metadata?: PDSObservationMetadata;
  notes?: string;
  references?: string[];
}

// API Response types
export interface LivePositionResponse {
  success: boolean;
  mode: 'live';
  object: string;
  timestamp: string;
  data: EphemerisData;
}

export interface QueryModeResponse {
  success: boolean;
  mode: 'query';
  object: string;
  start_time: string;
  stop_time: string;
  step_size: string;
  data_points: number;
  data: EphemerisData[];
  pds_metadata?: PDSMetadata; // Merged PDS metadata
  planets?: Record<string, EphemerisData[]>; // Planet ephemeris data
}

export interface OrbitalResponse {
  success: boolean;
  object: string;
  orbital_elements: OrbitalElements;
  timestamp: string;
}

export interface ComparisonResult {
  ephemeris: QueryModeResponse;
  orbital_elements: OrbitalResponse;
}

export interface MultiComparisonResponse {
  success: boolean;
  comparison_objects: string[];
  results: Record<string, ComparisonResult>;
  timestamp: string;
}
