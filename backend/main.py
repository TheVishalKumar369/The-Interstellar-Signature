"""
FastAPI Backend for 3I/ATLAS Interstellar Objects Comparison

This API provides endpoints to fetch and compare data for interstellar objects
from JPL Horizons system.
"""

import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from datetime import datetime
import json
from pathlib import Path

from config import config
from fetch_data.horizons import HorizonsDataFetcher
from models import InterstellarObject

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="3I/ATLAS Interstellar Objects API",
    description="API for fetching and comparing data for interstellar objects from JPL Horizons",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize JPL Horizons client
horizons_fetcher = HorizonsDataFetcher(
    base_url=config.JPL_HORIZONS_URL,
    request_delay=config.JPL_REQUEST_DELAY
)

# Interstellar objects registry
INTERSTELLAR_OBJECTS = {
    "1I/Oumuamua": {
        "designation": "A/2017 U1",
        "discovery_year": 2017,
        "description": "First known interstellar object to pass through our solar system"
    },
    "2I/Borisov": {
        "designation": "C/2019 Q4",
        "discovery_year": 2019,
        "description": "Second interstellar object and first interstellar comet"
    },
    "3I/ATLAS": {
        "designation": "C/2025 N1",
        "discovery_year": 2025,
        "description": "Third interstellar object - comet discovered in July 2025"
    }
}


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "3I/ATLAS Interstellar Objects API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/api/docs",
            "objects": "/api/objects",
            "live": "/api/live/{object_id}",
            "query": "/api/query/{object_id}",
            "orbital": "/api/orbital/{object_id}",
            "compare": "/api/compare-multi"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "jpl_horizons_url": config.JPL_HORIZONS_URL
    }


@app.get("/api/objects", response_model=List[InterstellarObject])
async def list_objects():
    """Get list of all interstellar objects"""
    objects = []
    for name, data in INTERSTELLAR_OBJECTS.items():
        objects.append(InterstellarObject(
            name=name,
            designation=data["designation"],
            discovery_year=data["discovery_year"],
            description=data.get("description")
        ))
    return objects


@app.get("/api/objects/{object_name:path}")
async def get_object_info(object_name: str):
    """Get information about a specific interstellar object

    Args:
        object_name: Object name like "2I/Borisov" (URL encode the slash as %2F)
                    or use query param: /api/objects?name=2I/Borisov
    """
    if object_name not in INTERSTELLAR_OBJECTS:
        raise HTTPException(status_code=404, detail=f"Object '{object_name}' not found")

    obj_data = INTERSTELLAR_OBJECTS[object_name]
    return {
        "name": object_name,
        **obj_data
    }


@app.get("/api/object")
async def get_object_by_query(name: str = Query(..., description="Object name (e.g., '2I/Borisov')")):
    """Get information about a specific interstellar object using query parameter

    Example: /api/object?name=2I/Borisov
    """
    if name not in INTERSTELLAR_OBJECTS:
        raise HTTPException(status_code=404, detail=f"Object '{name}' not found")

    obj_data = INTERSTELLAR_OBJECTS[name]
    return {
        "name": name,
        **obj_data
    }


@app.get("/api/data/{object_name:path}")
async def get_cached_data(object_name: str):
    """Get cached data for an object from the data directory"""
    try:
        # Clean object name for filename
        filename = f"{object_name.replace('/', '_')}_complete.json"
        filepath = Path(__file__).parent.parent / 'data' / 'pds' / filename

        logger.info(f"Looking for cached data at: {filepath}")
        logger.info(f"File exists: {filepath.exists()}")

        if not filepath.exists():
            raise HTTPException(
                status_code=404,
                detail=f"No cached data found for {object_name}. Looked in: {filepath}"
            )

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading cached data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/api/data")
async def list_cached_data():
    """List all available cached data files"""
    try:
        data_dir = Path(__file__).parent.parent / 'data' / 'pds'

        if not data_dir.exists():
            return {"files": [], "message": "No data directory found"}

        files = []
        for file in data_dir.glob("*.json"):
            files.append({
                "filename": file.name,
                "size": file.stat().st_size,
                "modified": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
            })

        return {"files": files, "count": len(files)}

    except Exception as e:
        logger.error(f"Error listing cached data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NEW DUAL-MODE ENDPOINTS ====================

@app.get("/api/live/{object_id:path}")
async def get_live_position(
    object_id: str,
    observer: str = Query("@399", description="Observer location (@399=Earth, @sun=Sun)")
):
    """
    LIVE MODE: Get current real-time position of interstellar object

    Args:
        object_id: Object name (e.g., "2I/Borisov") or designation (e.g., "C/2019 Q4")
        observer: Observer location (@399=Earth, @sun=Sun)

    Returns:
        Current ephemeris data with position, velocity, and observational parameters
    """
    try:
        logger.info(f"[LIVE MODE] Request for object_id='{object_id}', observer='{observer}'")
        result = horizons_fetcher.fetch_live_position(object_id, observer)

        if result['success']:
            return result
        else:
            error_msg = result.get('error', 'Failed to fetch live data')
            logger.error(f"[LIVE MODE] Failed: {error_msg}")
            raise HTTPException(status_code=404, detail=error_msg)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in live mode: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def load_pds_metadata(object_name: str) -> Optional[dict]:
    """Load PDS metadata from JSON file for an interstellar object"""
    try:
        # Map both friendly names AND designations to filenames
        filename_map = {
            "1I/Oumuamua": "1I_Oumuamua_complete.json",
            "A/2017 U1": "1I_Oumuamua_complete.json",
            "2I/Borisov": "2I_Borisov_complete.json",
            "C/2019 Q4": "2I_Borisov_complete.json",
            "3I/ATLAS": "3I_ATLAS_complete.json",
            "C/2025 N1": "3I_ATLAS_complete.json"
        }

        filename = filename_map.get(object_name)
        if not filename:
            logger.warning(f"No PDS metadata file mapping for {object_name}")
            return None

        filepath = Path(__file__).parent.parent / 'data' / 'pds' / filename

        if not filepath.exists():
            logger.warning(f"PDS metadata file not found: {filepath}")
            return None

        with open(filepath, 'r', encoding='utf-8') as f:
            metadata = json.load(f)

        logger.info(f"Loaded PDS metadata for {object_name}")
        return metadata

    except Exception as e:
        logger.error(f"Error loading PDS metadata for {object_name}: {e}")
        return None


def fetch_planet_ephemeris(start_time: str, stop_time: str, step_size: str) -> dict:
    """
    Fetch ephemeris data for all 9 planets (including Pluto) from JPL Horizons sequentially
    with retry logic to avoid rate limiting

    Args:
        start_time: Start time for ephemeris
        stop_time: Stop time for ephemeris
        step_size: Time step

    Returns:
        Dictionary mapping planet names to their ephemeris data
    """
    import time

    # JPL Horizons planet IDs (including Pluto as dwarf planet)
    planets = {
        "Mercury": "199",
        "Venus": "299",
        "Earth": "399",
        "Mars": "499",
        "Jupiter": "599",
        "Saturn": "699",
        "Uranus": "799",
        "Neptune": "899",
        "Pluto": "999"  # Pluto - dwarf planet
    }

    def fetch_single_planet_with_retry(planet_name: str, planet_id: str, max_retries=3):
        """Fetch a single planet's ephemeris data with retry logic"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching ephemeris for {planet_name} (ID: {planet_id}) [attempt {attempt + 1}/{max_retries}]")
                result = horizons_fetcher.fetch_query_mode(
                    planet_id, start_time, stop_time, step_size, observer="@sun"
                )

                if result['success']:
                    data = result.get('data', [])
                    logger.info(f"Successfully fetched {len(data)} data points for {planet_name}")
                    return data
                else:
                    error_msg = result.get('error', 'Unknown error')
                    if attempt < max_retries - 1:
                        wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                        logger.warning(f"Failed to fetch {planet_name}: {error_msg}. Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        logger.warning(f"Failed to fetch ephemeris for {planet_name} after {max_retries} attempts: {error_msg}")
                        return []

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2
                    logger.error(f"Error fetching {planet_name}: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Error fetching ephemeris for {planet_name} after {max_retries} attempts: {e}")
                    return []

        return []

    # Fetch planets sequentially with delays to avoid rate limiting
    planet_ephemeris = {}

    for i, (planet_name, planet_id) in enumerate(planets.items()):
        planet_ephemeris[planet_name] = fetch_single_planet_with_retry(planet_name, planet_id)

        # Add delay between requests (except after the last one)
        if i < len(planets) - 1:
            time.sleep(1)  # 1 second delay between planet requests

    successful_count = sum(1 for data in planet_ephemeris.values() if len(data) > 0)
    logger.info(f"Completed planet ephemeris fetch: {successful_count}/{len(planets)} successful - {list(planet_ephemeris.keys())}")
    return planet_ephemeris


@app.post("/api/query/{object_id:path}")
async def get_query_mode_data(
    object_id: str,
    start_time: str = Query(..., description="Start time (YYYY-MM-DD or YYYY-MM-DD HH:MM)"),
    stop_time: str = Query(..., description="Stop time (YYYY-MM-DD or YYYY-MM-DD HH:MM)"),
    step_size: str = Query("1d", description="Time step (e.g., 1d, 6h, 1h)"),
    observer: str = Query("@399", description="Observer location"),
    include_planets: bool = Query(False, description="Include planet ephemeris data")
):
    """
    QUERY MODE: Get custom time range data for visualization/analysis

    Merges timestamped ephemeris data from JPL Horizons with PDS metadata
    (physical properties, spectral data, discovery info, etc.)

    Args:
        object_id: Object name or designation
        start_time: Start of time range
        stop_time: End of time range
        step_size: Time interval between data points
        observer: Observer location
        include_planets: Whether to include planet ephemeris data

    Returns:
        Timestamped ephemeris data merged with PDS metadata for simulation
    """
    try:
        logger.info(f"[QUERY MODE] Request for {object_id} from {start_time} to {stop_time}")

        # Fetch ephemeris data from Horizons
        result = horizons_fetcher.fetch_query_mode(
            object_id, start_time, stop_time, step_size, observer
        )

        if result['success']:
            # Load PDS metadata for this object
            pds_metadata = load_pds_metadata(object_id)

            # Merge metadata into response
            result['pds_metadata'] = pds_metadata

            # Fetch planet ephemeris data if requested
            if include_planets:
                planet_data = fetch_planet_ephemeris(start_time, stop_time, step_size)
                result['planets'] = planet_data

            logger.info(f"[QUERY MODE] Returning {len(result.get('data', []))} timesteps with PDS metadata")
            return result
        else:
            raise HTTPException(status_code=404, detail=result.get('error', 'Failed to fetch query data'))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in query mode: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orbital/{object_id:path}")
async def get_orbital_elements_comparison(object_id: str):
    """
    Get orbital elements for comparison

    Args:
        object_id: Object name or designation

    Returns:
        Structured orbital elements (e, i, q, Omega, w, etc.)
    """
    try:
        logger.info(f"Fetching orbital elements for comparison: {object_id}")
        result = horizons_fetcher.fetch_orbital_elements(object_id)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=404, detail=result.get('error', 'Failed to fetch orbital elements'))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching orbital elements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compare-multi")
async def compare_multiple_objects(
    object_ids: List[str] = Query(..., description="List of object names/designations"),
    start_time: str = Query(..., description="Start time for ephemeris"),
    stop_time: str = Query(..., description="Stop time for ephemeris"),
    step_size: str = Query("1d", description="Time step")
):
    """
    Compare multiple interstellar objects with both ephemerides and orbital elements

    Args:
        object_ids: List of object names (e.g., ["1I/Oumuamua", "2I/Borisov", "3I/ATLAS"])
        start_time: Start time for trajectory data
        stop_time: Stop time for trajectory data
        step_size: Time interval

    Returns:
        Comprehensive comparison data for all objects
    """
    try:
        logger.info(f"Multi-object comparison: {object_ids}")
        result = horizons_fetcher.compare_objects(object_ids, start_time, stop_time, step_size)

        if result['success']:
            return result
        else:
            raise HTTPException(status_code=500, detail='Comparison failed')

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in multi-object comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower()
    )
