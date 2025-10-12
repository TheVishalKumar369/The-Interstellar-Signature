"""
Pydantic models for API request/response schemas
"""

from pydantic import BaseModel
from typing import Optional


class InterstellarObject(BaseModel):
    """Interstellar object information"""
    name: str
    designation: str
    discovery_year: int
    description: Optional[str] = None
