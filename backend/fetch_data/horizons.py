"""
JPL Horizons Data Fetching with Dual Mode Support

This module provides two modes for fetching data:
1. LIVE MODE: Real-time position data for current visualization
2. QUERY MODE: User-defined time range queries for custom analysis

Data Types:
A. Ephemerides (Primary) - For 3D visualization and trajectory plotting
B. Orbital Elements (Secondary) - For comparison between interstellar objects
"""

import requests
import time
import re
from typing import Dict, List, Optional, Literal, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)


@dataclass
class EphemerisData:
    """Structured ephemeris data for visualization"""
    datetime_str: str
    datetime_jd: float  # Julian Date
    RA: float  # Right Ascension (degrees)
    DEC: float  # Declination (degrees)
    delta: float  # Distance from Earth (AU)
    r: float  # Distance from Sun (AU)
    x: float  # Heliocentric X coordinate (AU)
    y: float  # Heliocentric Y coordinate (AU)
    z: float  # Heliocentric Z coordinate (AU)
    vx: float  # Heliocentric velocity X (AU/day)
    vy: float  # Heliocentric velocity Y (AU/day)
    vz: float  # Heliocentric velocity Z (AU/day)
    V_mag: Optional[float] = None  # Visual magnitude
    elong: Optional[float] = None  # Solar elongation (degrees)
    phase_angle: Optional[float] = None  # Sun-Observer-Target angle

    def to_dict(self):
        return asdict(self)


@dataclass
class OrbitalElements:
    """Structured orbital elements for comparison"""
    epoch: str  # Epoch of elements
    a: Optional[float] = None  # Semi-major axis (AU) - None for hyperbolic
    e: float = 0.0  # Eccentricity
    i: float = 0.0  # Inclination (degrees)
    Omega: float = 0.0  # Longitude of ascending node (degrees)
    w: float = 0.0  # Argument of periapsis (degrees)
    q: float = 0.0  # Perihelion distance (AU)
    Tp: Optional[str] = None  # Time of perihelion
    n: Optional[float] = None  # Mean motion (deg/day)
    M: Optional[float] = None  # Mean anomaly (degrees)
    period: Optional[float] = None  # Orbital period (days) - None for hyperbolic
    H: Optional[float] = None  # Absolute magnitude
    G: Optional[float] = None  # Magnitude slope parameter

    def to_dict(self):
        return asdict(self)


class HorizonsDataFetcher:
    """
    Main class for fetching Horizons data in Live or Query mode
    """

    INTERSTELLAR_OBJECTS = {
        "1I/Oumuamua": "A/2017 U1",
        "2I/Borisov": "C/2019 Q4",
        "3I/ATLAS": "C/2025 N1"
    }

    def __init__(self, base_url: str = "https://ssd.jpl.nasa.gov/api/horizons.api",
                 request_delay: float = 1.0):
        self.base_url = base_url
        self.request_delay = request_delay
        self.last_request_time = 0

    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        if elapsed < self.request_delay:
            time.sleep(self.request_delay - elapsed)
        self.last_request_time = time.time()

    # ==================== LIVE MODE ====================

    def fetch_live_position(self, object_id: str, observer: str = "@399") -> Dict[str, Any]:
        """
        LIVE MODE: Fetch current position of object for real-time visualization

        Args:
            object_id: Object designation (e.g., "C/2019 Q4" or "2I/Borisov")
            observer: Observer location code (default @399 = Earth geocenter)
                     @sun = heliocentric, @399 = Earth

        Returns:
            Dictionary with current ephemeris and position data
        """
        # Get designation if friendly name provided
        if object_id in self.INTERSTELLAR_OBJECTS:
            designation = self.INTERSTELLAR_OBJECTS[object_id]
        else:
            designation = object_id

        # Current time
        now = datetime.utcnow()
        # Fetch data for current moment + next hour (for velocity calculation)
        start_time = now.strftime("%Y-%m-%d %H:%M")
        stop_time = (now + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")

        logger.info(f"[LIVE MODE] Fetching current position for {designation}")

        # Fetch both observer table and vectors
        ephemeris_result = self._fetch_observer_ephemeris(
            designation, start_time, stop_time, "1h", observer
        )

        vector_result = self._fetch_state_vectors(
            designation, start_time, stop_time, "1h"
        )

        if ephemeris_result['success'] and vector_result['success']:
            # Parse and combine data
            ephem_parsed = self._parse_ephemeris_table(ephemeris_result['raw_data'])
            vector_parsed = self._parse_vector_table(vector_result['raw_data'])

            if ephem_parsed and vector_parsed:
                # Combine first data point
                combined = self._combine_ephemeris_data(ephem_parsed[0], vector_parsed[0])

                return {
                    'success': True,
                    'mode': 'live',
                    'object': designation,
                    'timestamp': now.isoformat(),
                    'data': combined.to_dict() if combined else None
                }

        return {
            'success': False,
            'mode': 'live',
            'object': designation,
            'error': 'Failed to fetch live position data'
        }

    # ==================== QUERY MODE ====================

    def fetch_query_mode(self,
                        object_id: str,
                        start_time: str,
                        stop_time: str,
                        step_size: str = "1d",
                        observer: str = "@399") -> Dict[str, Any]:
        """
        QUERY MODE: Fetch user-defined time range for custom visualization/analysis

        Args:
            object_id: Object designation or name
            start_time: Start time (format: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM")
            stop_time: Stop time (same format)
            step_size: Time step (e.g., "1d", "6h", "1h", "10m")
            observer: Observer location

        Returns:
            Dictionary with ephemeris data array and metadata
        """
        # Get designation if friendly name provided
        if object_id in self.INTERSTELLAR_OBJECTS:
            designation = self.INTERSTELLAR_OBJECTS[object_id]
        else:
            designation = object_id

        logger.info(f"[QUERY MODE] Fetching data for {designation} from {start_time} to {stop_time}")

        # Fetch both observer table and vectors
        ephemeris_result = self._fetch_observer_ephemeris(
            designation, start_time, stop_time, step_size, observer
        )

        vector_result = self._fetch_state_vectors(
            designation, start_time, stop_time, step_size
        )

        if ephemeris_result['success'] and vector_result['success']:
            # Parse both datasets
            ephem_parsed = self._parse_ephemeris_table(ephemeris_result['raw_data'])
            vector_parsed = self._parse_vector_table(vector_result['raw_data'])

            if ephem_parsed and vector_parsed:
                # Combine all data points
                combined_data = []
                for ephem, vector in zip(ephem_parsed, vector_parsed):
                    combined = self._combine_ephemeris_data(ephem, vector)
                    if combined:
                        combined_data.append(combined.to_dict())

                return {
                    'success': True,
                    'mode': 'query',
                    'object': designation,
                    'start_time': start_time,
                    'stop_time': stop_time,
                    'step_size': step_size,
                    'data_points': len(combined_data),
                    'data': combined_data
                }

        return {
            'success': False,
            'mode': 'query',
            'object': designation,
            'error': 'Failed to fetch query data'
        }

    # ==================== ORBITAL ELEMENTS (COMPARISON) ====================

    def fetch_orbital_elements(self, object_id: str, epoch: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch orbital elements for comparison between objects

        Args:
            object_id: Object designation or name
            epoch: Epoch time (optional, defaults to current)

        Returns:
            Dictionary with structured orbital elements
        """
        if object_id in self.INTERSTELLAR_OBJECTS:
            designation = self.INTERSTELLAR_OBJECTS[object_id]
        else:
            designation = object_id

        self._rate_limit()

        logger.info(f"Fetching orbital elements for {designation}")

        params = {
            'format': 'text',
            'COMMAND': f"'{designation}'",
            'OBJ_DATA': 'YES',
            'MAKE_EPHEM': 'NO'
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()

            # Parse orbital elements from response
            elements = self._parse_orbital_elements(response.text)

            return {
                'success': True,
                'object': designation,
                'orbital_elements': elements.to_dict() if elements else None,
                'raw_data': response.text,
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching orbital elements: {e}")
            return {
                'success': False,
                'object': designation,
                'error': str(e)
            }

    # ==================== INTERNAL FETCH METHODS ====================

    def _fetch_observer_ephemeris(self,
                                  designation: str,
                                  start_time: str,
                                  stop_time: str,
                                  step_size: str,
                                  observer: str) -> Dict[str, Any]:
        """Fetch observer-based ephemeris (RA, DEC, distance, magnitude)"""
        self._rate_limit()

        # Quantities: 1=RA/DEC, 9=Vis.mag, 20=Range/Range-rate, 23=S-T-O, 24=S-O-T
        params = {
            'format': 'text',
            'COMMAND': f"'{designation}'",
            'OBJ_DATA': 'YES',
            'MAKE_EPHEM': 'YES',
            'EPHEM_TYPE': 'OBSERVER',
            'CENTER': f"'{observer}'",
            'START_TIME': f"'{start_time}'",
            'STOP_TIME': f"'{stop_time}'",
            'STEP_SIZE': f"'{step_size}'",
            'QUANTITIES': "'1,9,20,23,24'",
            'CSV_FORMAT': 'YES',
            'CAL_FORMAT': 'BOTH',  # Include both JD and calendar date
            'ANG_FORMAT': 'DEG'     # Use decimal degrees instead of sexagesimal
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            return {
                'success': True,
                'raw_data': response.text
            }
        except Exception as e:
            logger.error(f"Error fetching observer ephemeris: {e}")
            return {'success': False, 'error': str(e)}

    def _fetch_state_vectors(self,
                            designation: str,
                            start_time: str,
                            stop_time: str,
                            step_size: str) -> Dict[str, Any]:
        """Fetch heliocentric state vectors (position and velocity)"""
        self._rate_limit()

        params = {
            'format': 'text',
            'COMMAND': f"'{designation}'",
            'OBJ_DATA': 'YES',
            'MAKE_EPHEM': 'YES',
            'EPHEM_TYPE': 'VECTORS',
            'CENTER': '@sun',
            'START_TIME': f"'{start_time}'",
            'STOP_TIME': f"'{stop_time}'",
            'STEP_SIZE': f"'{step_size}'",
            'REF_PLANE': 'ECLIPTIC',
            'VEC_TABLE': '3',
            'CSV_FORMAT': 'YES',
            'OUT_UNITS': 'AU-D',
            'VEC_CORR': 'NONE'
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            return {
                'success': True,
                'raw_data': response.text
            }
        except Exception as e:
            logger.error(f"Error fetching state vectors: {e}")
            return {'success': False, 'error': str(e)}

    # ==================== PARSING METHODS ====================

    def _parse_ephemeris_table(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parse observer ephemeris table (RA, DEC, distances, magnitude)"""
        try:
            # Check if data markers exist
            if "$$SOE" not in raw_data or "$$EOE" not in raw_data:
                logger.error(f"No ephemeris data found in response. Response may contain error message.")
                # Log a snippet of the response to help debug
                logger.error(f"Response snippet: {raw_data[:500]}")
                return []

            # Extract data between $$SOE and $$EOE markers
            soe_idx = raw_data.index("$$SOE") + 5
            eoe_idx = raw_data.index("$$EOE")
            csv_data = raw_data[soe_idx:eoe_idx].strip()

            # Log first 2 lines to see actual CSV structure
            lines = csv_data.split('\n')
            if lines:
                logger.info(f"CSV first line: {lines[0]}")
                if len(lines) > 1:
                    logger.info(f"CSV second line: {lines[1]}")

            results = []
            for line_num, line in enumerate(lines, 1):
                if not line.strip():
                    continue

                try:
                    parts = [p.strip() for p in line.split(',')]
                    logger.debug(f"Line {line_num}: {len(parts)} parts")

                    if len(parts) < 10:
                        continue

                    # With CAL_FORMAT=BOTH, format is: Calendar, JD, empty, empty, RA, DEC, APmag, S-brt, delta, deldot, S-O-T, phase, S-T-O
                    datetime_str = parts[0]

                    # Get JD (should be second field)
                    try:
                        datetime_jd = float(parts[1])
                    except (ValueError, IndexError):
                        datetime_jd = 0.0

                    # Helper function to safely parse float
                    def safe_float(value, default=0.0):
                        if not value or value == 'n.a.' or value == '/T':
                            return default
                        try:
                            return float(value)
                        except ValueError:
                            return default

                    # Parse fields based on observed structure
                    # Skip empty fields (indices 2, 3)
                    # Index 4: RA (decimal degrees)
                    # Index 5: DEC (decimal degrees)
                    # Index 6: APmag (visual magnitude)
                    # Index 7: S-brt (surface brightness - often n.a.)
                    # Index 8: delta (observer distance in AU)
                    # Index 9: deldot (range rate)
                    # Index 10: S-O-T angle
                    # Index 11: phase indicator (like /T)
                    # Index 12: S-T-O angle

                    results.append({
                        'datetime_jd': datetime_jd,
                        'datetime_str': datetime_str,
                        'RA': safe_float(parts[4], 0.0),
                        'DEC': safe_float(parts[5], 0.0),
                        'V_mag': safe_float(parts[6], None),
                        'delta': safe_float(parts[8], 0.0),
                        'r': safe_float(parts[8], 0.0),  # Using delta for now, will get r from vectors
                        'elong': safe_float(parts[10], None) if len(parts) > 10 else None,
                        'phase_angle': safe_float(parts[12], None) if len(parts) > 12 else None
                    })
                except (ValueError, IndexError) as e:
                    logger.warning(f"Skipping line {line_num} due to parsing error: {e}")
                    logger.debug(f"Problematic line: {line}")
                    continue

            return results

        except Exception as e:
            logger.error(f"Error parsing ephemeris table: {e}")
            logger.exception("Full traceback:")
            return []

    def _parse_vector_table(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parse state vector table (X, Y, Z, VX, VY, VZ)"""
        try:
            # Check if data markers exist
            if "$$SOE" not in raw_data or "$$EOE" not in raw_data:
                logger.error(f"No vector data found in response. Response may contain error message.")
                logger.error(f"Response snippet: {raw_data[:500]}")
                return []

            soe_idx = raw_data.index("$$SOE") + 5
            eoe_idx = raw_data.index("$$EOE")
            csv_data = raw_data[soe_idx:eoe_idx].strip()

            results = []
            for line in csv_data.split('\n'):
                if not line.strip():
                    continue

                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 7:
                    results.append({
                        'datetime_jd': float(parts[0]),
                        'x': float(parts[2]) if parts[2] else 0.0,
                        'y': float(parts[3]) if parts[3] else 0.0,
                        'z': float(parts[4]) if parts[4] else 0.0,
                        'vx': float(parts[5]) if parts[5] else 0.0,
                        'vy': float(parts[6]) if parts[6] else 0.0,
                        'vz': float(parts[7]) if len(parts) > 7 and parts[7] else 0.0
                    })

            return results

        except Exception as e:
            logger.error(f"Error parsing vector table: {e}")
            return []

    def _combine_ephemeris_data(self,
                               ephem: Dict[str, Any],
                               vector: Dict[str, Any]) -> Optional[EphemerisData]:
        """Combine observer ephemeris and state vectors into unified structure"""
        try:
            return EphemerisData(
                datetime_str=ephem.get('datetime_str', ''),
                datetime_jd=ephem.get('datetime_jd', 0.0),
                RA=ephem.get('RA', 0.0),
                DEC=ephem.get('DEC', 0.0),
                delta=ephem.get('delta', 0.0),
                r=ephem.get('r', 0.0),
                x=vector.get('x', 0.0),
                y=vector.get('y', 0.0),
                z=vector.get('z', 0.0),
                vx=vector.get('vx', 0.0),
                vy=vector.get('vy', 0.0),
                vz=vector.get('vz', 0.0),
                V_mag=ephem.get('V_mag'),
                elong=ephem.get('elong'),
                phase_angle=ephem.get('phase_angle')
            )
        except Exception as e:
            logger.error(f"Error combining ephemeris data: {e}")
            return None

    def _parse_orbital_elements(self, raw_data: str) -> Optional[OrbitalElements]:
        """Parse orbital elements from Horizons response"""
        try:
            elements = OrbitalElements(epoch=datetime.utcnow().strftime("%Y-%m-%d"))

            # Extract orbital parameters using regex
            patterns = {
                'e': r'EC=\s*([\d.E+-]+)',
                'q': r'QR=\s*([\d.E+-]+)',
                'i': r'IN=\s*([\d.E+-]+)',
                'Omega': r'OM=\s*([\d.E+-]+)',
                'w': r'W\s*=\s*([\d.E+-]+)',
                'Tp': r'Tp=\s*([\d.]+)',
                'n': r'N\s*=\s*([\d.E+-]+)',
                'M': r'MA=\s*([\d.E+-]+)',
                'a': r'A\s*=\s*([\d.E+-]+)',
                'period': r'PR=\s*([\d.E+-]+)',
                'H': r'H\s*=\s*([\d.E+-]+)',
                'G': r'G\s*=\s*([\d.]+)'
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, raw_data)
                if match:
                    value = match.group(1)
                    if key == 'Tp':
                        setattr(elements, key, value)
                    else:
                        try:
                            setattr(elements, key, float(value))
                        except ValueError:
                            pass

            # Extract epoch
            epoch_match = re.search(r'(\d{4}-[A-Za-z]+-\d{2}\s+\d{2}:\d{2})', raw_data)
            if epoch_match:
                elements.epoch = epoch_match.group(1)

            return elements

        except Exception as e:
            logger.error(f"Error parsing orbital elements: {e}")
            return None

    # ==================== COMPARISON HELPER ====================

    def compare_objects(self,
                       object_ids: List[str],
                       start_time: str,
                       stop_time: str,
                       step_size: str = "1d") -> Dict[str, Any]:
        """
        Compare multiple interstellar objects with both ephemerides and orbital elements

        Args:
            object_ids: List of object names or designations
            start_time: Start time for ephemeris
            stop_time: Stop time for ephemeris
            step_size: Time step

        Returns:
            Comparison data for all objects
        """
        results = {}

        for obj_id in object_ids:
            logger.info(f"Comparing object: {obj_id}")

            # Fetch query mode ephemeris
            query_data = self.fetch_query_mode(obj_id, start_time, stop_time, step_size)

            # Fetch orbital elements
            orbital_data = self.fetch_orbital_elements(obj_id)

            results[obj_id] = {
                'ephemeris': query_data,
                'orbital_elements': orbital_data
            }

        return {
            'success': True,
            'comparison_objects': object_ids,
            'results': results,
            'timestamp': datetime.utcnow().isoformat()
        }
