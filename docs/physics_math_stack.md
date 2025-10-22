# Physics & Mathematics Stack

A structured Markdown version of `physics_math_stack.txt`, describing the physics and math used by the project. Equations use KaTeX formatting where appropriate.

## 1. Kepler's Equations (Orbital Mechanics)

- Mean motion:

  $$n = \frac{360^\circ}{P}$$

  where $P$ is orbital period (days). (See `ThreeJSViewer.tsx:153`)

- Mean anomaly:

  $$M = (M_0 + n\cdot t) \bmod 360^\circ$$

  where $M_0$ is mean anomaly at epoch, $t$ is time since epoch. (See `ThreeJSViewer.tsx:156`)

- Kepler's equation (Newton's method):

  $$M = E - e\sin E$$

  Iterative solver: $E_{n+1} = M + e\sin(E_n)$ — 10 iterations recommended. (See `ThreeJSViewer.tsx:160-163`)

- True anomaly:

  $$\nu = 2\arctan2\left(\sqrt{1+e}\sin\frac{E}{2},\ \sqrt{1-e}\cos\frac{E}{2}\right)$$

- Heliocentric distance:

  $$r = a(1 - e\cos E)$$

  where $a$ is semi-major axis, $e$ eccentricity.

## 2. Coordinate Transformations

Orbital plane coordinates:

- $$x_{orb} = r\cos\nu$$
- $$y_{orb} = r\sin\nu$$

3D rotation to heliocentric ecliptic (using $\omega$, $\Omega$, $i$):

- $$x = x_{orb}(\cos\omega\cos\Omega - \sin\omega\sin\Omega\cos i) - y_{orb}(\sin\omega\cos\Omega + \cos\omega\sin\Omega\cos i)$$
- $$y = x_{orb}(\cos\omega\sin\Omega + \sin\omega\cos\Omega\cos i) - y_{orb}(\sin\omega\sin\Omega - \cos\omega\cos\Omega\cos i)$$
- $$z = x_{orb}\sin\omega\sin i + y_{orb}\cos\omega\sin i$$

Three.js coordinate conversion: $(x,y,z) \to (x,z,-y)$ for Y-up rendering. (See `ThreeJSViewer.tsx:184-193`)

## 3. Time Systems & Epochs

- J2000.0 epoch: Jan 1, 2000, 12:00 TT
- Days since J2000.0 used for time deltas
- Julian Date support for ephemeris queries (See `horizons.py` lines referenced)

## 4. Orbital Energy & Dynamics

- Solar gravitational parameter:

  $$\mu = 2.9591220828559093\times10^{-4}\ \mathrm{AU}^3/\mathrm{day}^2$$

- Specific orbital energy (vis-viva):

  $$E = \frac{v^2}{2} - \frac{\mu}{r}$$

  Units: AU^2/day^2

- Orbit classification by energy:
  - $E > 0$ : Hyperbolic (unbound)
  - $E = 0$ : Parabolic
  - $E < 0$ : Elliptical (bound)

- Velocity magnitude:

  $$v = \sqrt{v_x^2 + v_y^2 + v_z^2}$$

- Escape velocity at distance $r$:

  $$v_{esc} = \sqrt{\frac{2\mu}{r}}$$

## 5. Orbital Elements (Keplerian Elements)

Classical elements used and notes:

- $a$ — semi-major axis (AU); for hyperbolic orbits $a<0$
- $e$ — eccentricity
- $i$ — inclination (degrees)
- $\Omega$ — longitude of ascending node (degrees)
- $\omega$ — argument of perihelion (degrees)
- $q$ — perihelion distance: $q = a(1 - e)$
- $M$ — mean anomaly (degrees)
- $n$ — mean motion (degrees/day)
- $P$ — orbital period (days)

(See `horizons.py` and `ThreeJSViewer.tsx` for usages and line references.)

## 6. Ephemeris Data (Observational Parameters)

- Positions: $(x,y,z)$ heliocentric ecliptic coords (AU)
- Velocity components: $(v_x,v_y,v_z)$ (AU/day)
- Derived quantities: RA/DEC, elongation, phase angle, visual magnitude

## 7. Computational Methods

- Newton's method for solving Kepler's equation (10 iterations)
- Linear interpolation for camera movement: $p_{new} = p_{current} + \alpha(p_{target}-p_{current})$, $\alpha=0.05$
- Data throttling: $\text{step} = \lceil N/N_{max}\rceil$ when $N>N_{max}$

## 8. Reference Frames

- Heliocentric ecliptic frame (origin: Sun)
- Observer frame (geocentric/topocentric) for RA/DEC
- J2000.0 / ICRF coordinate standard

## 9. Physical Constants & Units

- 1 AU = 149,597,870.7 km
- 1 day = 86,400 s
- Unit conversions: deg↔rad
- 1 AU/day ≈ 1731.46 km/s

## 10. Statistical & Analytical Calculations

- Average velocity: $v_{avg} = \frac{\sum v_i}{N}$
- Min/max distances: $r_{min} = \min r_i$, $r_{max} = \max r_i$
- Orbit type classification by eccentricity: $e>1$ hyperbolic, $e=1$ parabolic, $e<1$ elliptical

## 11. Visualization Mathematics

- Camera distance: $d = \max(5, |p_{focus}|\times 0.5)$
- Camera positioning formulas (angle-based):
  - $\text{angle} = \arctan2(z,x)$
  - $\text{camera}_x = p_x\times 0.3 + \cos(\text{angle}+\tfrac{\pi}{4})\times d$
  - $\text{camera}_z = p_z\times 0.3 + \sin(\text{angle}+\tfrac{\pi}{4})\times d$
  - $\text{camera}_y = d\times 0.4$

- Orbital path generation: 200 points uniformly over one period: $t_i = (i/200)\times P$

## Summary

This document condenses the project's mathematical and physical foundations, with references to implementation locations in the codebase for verification and reproducibility.

---

Generated from `physics_math_stack.txt`.
