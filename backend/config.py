"""
Configuration loading from environment variables
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """Configuration class for backend settings"""

    # API Configuration
    API_HOST = os.getenv('API_HOST', '0.0.0.0')
    API_PORT = int(os.getenv('API_PORT', '8000'))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    # CORS Settings
    CORS_ORIGINS = eval(os.getenv('CORS_ORIGINS', '["http://localhost:3000"]'))

    # JPL Horizons API
    JPL_HORIZONS_URL = os.getenv('JPL_HORIZONS_URL', 'https://ssd.jpl.nasa.gov/api/horizons.api')
    JPL_REQUEST_DELAY = float(os.getenv('JPL_REQUEST_DELAY', '1.0'))

    # Orbital Calculation Settings
    CALCULATION_PRECISION = float(os.getenv('CALCULATION_PRECISION', '1e-12'))
    MAX_ITERATIONS = int(os.getenv('MAX_ITERATIONS', '100'))

    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL = int(os.getenv('WS_HEARTBEAT_INTERVAL', '30'))
    WS_MAX_CONNECTIONS = int(os.getenv('WS_MAX_CONNECTIONS', '100'))

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'backend.log')

    # Performance
    CACHE_TTL = int(os.getenv('CACHE_TTL', '300'))
    MAX_TRAJECTORY_POINTS = int(os.getenv('MAX_TRAJECTORY_POINTS', '10000'))

    @classmethod
    def get_config_dict(cls) -> dict:
        """Return configuration as dictionary"""
        return {
            key: value for key, value in cls.__dict__.items()
            if not key.startswith('_') and not callable(value)
        }


# Singleton instance
config = Config()
