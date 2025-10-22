# Project Techstack

A concise, structured version of `techstack.txt` that documents the project's architecture, data sources, physics/visualization pipeline, and future work.

## 1. Overview

- Brief project summary: Visualizing interstellar object trajectories with computational astronomy and 3D visualization.
- Research objectives: Provide interactive visualizations and analysis tools for interstellar objects and small bodies.
- Scientific approach: Combine backend ephemeris fetching and physics computations with a Three.js-based frontend.

## 2. Data Acquisition

### JPL Horizons Integration
- API endpoint: `https://ssd.jpl.nasa.gov/api/horizons.api`
- Query parameters: object ID, time range, step size, observer location
- Data format: CSV ephemeris tables
- Implementation: `backend/fetch_data/horizons.py` (see lines ~120-180 in original reference)

### PDS Metadata
- Source: Planetary Data System JSON files
- Content: Physical properties, discovery data, spectral information
- Storage: `data/pds/*.json`
- Merging logic: `backend/fetch_data/data_merger.py`

## 3. Orbital Mechanics Implementation

- Mean motion: $n = \dfrac{360^\circ}{P}$ (see `ThreeJSViewer.tsx:153`)
- Mean anomaly: $M = (M_0 + n\cdot t) \bmod 360^\circ$ (see `ThreeJSViewer.tsx:156`)
- Kepler equation solver: Newton's method (10 iterations recommended)
- True anomaly: conversion via `\operatorname{atan2}`
- Heliocentric distance: $r = a(1 - e\cos E)$

## 4. Coordinate Transformations

- Orbital plane → Heliocentric ecliptic using rotation matrices (inclination $i$, longitude of ascending node $\Omega$, argument of perihelion $\omega$)
- Three.js adaptation: $(x,y,z) \to (x,z,-y)$ (Y-up rendering)

## 5. Physics Calculations

- Vis-viva (specific orbital energy): $E = \dfrac{v^2}{2} - \dfrac{\mu}{r}$
- Solar gravitational parameter: $\mu = 2.959\times10^{-4}\,\mathrm{AU}^3/\mathrm{day}^2$
- Orbit classification by energy: hyperbolic (E>0), parabolic (E=0), elliptical (E<0)
- Velocity magnitude: $v = \sqrt{v_x^2 + v_y^2 + v_z^2}$

## 6. Visualization Pipeline

- Three.js rendering: Sun + planets + object spheres
- Trail rendering: `LineBasicMaterial` with time-stamped vertices
- Camera: `OrbitControls` with dynamic focus
- Lighting: `AmbientLight` + `DirectionalLight`

## 7. Animation System

- Time interpolation: Linear stepped progression
- Frame updates: `requestAnimationFrame`
- Speed control: 0.5x to 10x multipliers
- Timeline: Date slider with synchronized object positions

## 8. Performance Optimization

- Data throttling: Point reduction using `step = \lceil N / N_{max} \rceil` when $N > 2000$ (see `ThreeJSViewer.tsx:486-487`)
- Camera interpolation smoothing: `p_{new} = p_{current} + 0.05(p_{target} - p_{current})`

## 9. Reference Frames & Time Systems

- Coordinate systems: Heliocentric ecliptic (J2000.0/ICRF)
- Origin: Solar system barycenter
- Epoch: J2000.0 (Jan 1, 2000, 12:00 TT)
- Julian Date support for ephemeris queries

## 10. Validation & Accuracy

- Cross-reference with JPL Horizons positions
- Kepler equation convergence: 10 iterations
- Coordinate transformation verification and energy conservation checks

## 11. Software Stack

### Frontend
- React 18 + TypeScript
- Three.js (r168) via `@react-three/fiber`
- Vite
- Recharts for comparative analysis

### Backend
- FastAPI (Python 3.9+)
- Pydantic
- Asyncio
- CORS middleware

## 12. Limitations & Future Work

- Two-body approximation (no planetary perturbations)
- Non-gravitational forces not modeled (e.g., outgassing)
- Future: N-body integration, uncertainty quantification

## 13. References

- JPL Horizons System documentation
- Planetary Data System standards
- Kepler orbit propagation literature
- Three.js rendering best practices

---

Generated from `techstack.txt`.
