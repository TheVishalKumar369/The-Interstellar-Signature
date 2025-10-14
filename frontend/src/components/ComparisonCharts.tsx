import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import type { EphemerisData, OrbitalElements } from '../types';

interface ComparisonChartsProps {
  trajectoryData: Record<string, EphemerisData[]>;
  orbitalElements: Record<string, OrbitalElements>;
}

const COLORS = {
  '1I/Oumuamua': '#ff0000',
  '2I/Borisov': '#00ffff',
  '3I/ATLAS': '#00ff00'
};

// Gravitational parameter of the Sun: GM☉ in AU³/day²
// Derived from Kepler's third law: μ = 4π²/T² where T = 1 year = 365.25 days, a = 1 AU
const MU_SUN = 2.9591220828559093e-4; // AU³/day²

// Reference data for Solar System objects (for comparison)
const REFERENCE_OBJECTS = {
  // Planets
  'Earth': { e: 0.0167, i: 0.00, q: 0.983, type: 'Planet', color: '#4169E1' },
  'Mars': { e: 0.0934, i: 1.85, q: 1.381, type: 'Planet', color: '#CD5C5C' },
  'Jupiter': { e: 0.0489, i: 1.31, q: 4.950, type: 'Planet', color: '#DAA520' },

  // Famous Comets (bound, elliptical)
  'Halley': { e: 0.967, i: 162.3, q: 0.586, type: 'Comet (Bound)', color: '#FF69B4' },
  'Hale-Bopp': { e: 0.995, i: 89.4, q: 0.914, type: 'Comet (Bound)', color: '#FF1493' },
  'Encke': { e: 0.847, i: 11.8, q: 0.330, type: 'Comet (Bound)', color: '#DB7093' },
};

export const ComparisonCharts = ({ trajectoryData, orbitalElements }: ComparisonChartsProps) => {

  // Prepare distance from Sun over time - merge all objects by time index
  const distanceData: any[] = [];
  const maxLength = Math.max(...Object.values(trajectoryData).map(data => data.length));

  for (let i = 0; i < maxLength; i++) {
    const dataPoint: any = { index: i };

    Object.entries(trajectoryData).forEach(([name, data]) => {
      if (data[i]) {
        dataPoint.datetime = data[i].datetime_str;
        dataPoint[`${name}_distance`] = data[i].r;
      }
    });

    distanceData.push(dataPoint);
  }

  // Prepare velocity magnitude over time - merge all objects by time index
  const velocityData: any[] = [];

  for (let i = 0; i < maxLength; i++) {
    const dataPoint: any = { index: i };

    Object.entries(trajectoryData).forEach(([name, data]) => {
      if (data[i]) {
        dataPoint.datetime = data[i].datetime_str;
        const velocity = Math.sqrt(data[i].vx ** 2 + data[i].vy ** 2 + data[i].vz ** 2);
        dataPoint[`${name}_velocity`] = velocity;
      }
    });

    velocityData.push(dataPoint);
  }

  // Prepare orbital energy (specific energy) over time
  // E = v²/2 - μ/r
  // E < 0: bound orbit (solar system object)
  // E > 0: unbound orbit (interstellar object escaping)
  const energyData: any[] = [];

  for (let i = 0; i < maxLength; i++) {
    const dataPoint: any = { index: i };

    Object.entries(trajectoryData).forEach(([name, data]) => {
      if (data[i]) {
        dataPoint.datetime = data[i].datetime_str;
        const velocity = Math.sqrt(data[i].vx ** 2 + data[i].vy ** 2 + data[i].vz ** 2);
        const r = data[i].r; // distance from Sun in AU
        // Specific orbital energy: E = v²/2 - μ/r (in AU²/day²)
        const energy = (velocity ** 2) / 2 - MU_SUN / r;
        dataPoint[`${name}_energy`] = energy;
      }
    });

    energyData.push(dataPoint);
  }

  // Prepare orbital elements comparison (Interstellar objects + reference objects)
  const orbitalData = [
    // Interstellar objects from fetched data
    ...Object.entries(orbitalElements).map(([name, elements]) => ({
      object: name,
      eccentricity: elements.e,
      inclination: elements.i,
      perihelion: elements.q,
      type: 'Interstellar',
      color: COLORS[name as keyof typeof COLORS] || '#ffffff'
    })),
    // Reference objects (planets and comets)
    ...Object.entries(REFERENCE_OBJECTS).map(([name, data]) => ({
      object: name,
      eccentricity: data.e,
      inclination: data.i,
      perihelion: data.q,
      type: data.type,
      color: data.color
    }))
  ];

  // Create comprehensive comparison table data
  const comparisonTableData = Object.entries(orbitalElements).map(([name, elements]) => {
    // Calculate additional derived parameters
    const avgVelocity = trajectoryData[name] ?
      trajectoryData[name].reduce((sum, point) => {
        const v = Math.sqrt(point.vx ** 2 + point.vy ** 2 + point.vz ** 2);
        return sum + v;
      }, 0) / trajectoryData[name].length : 0;

    const minDistance = trajectoryData[name] ?
      Math.min(...trajectoryData[name].map(p => p.r)) : 0;

    const maxDistance = trajectoryData[name] ?
      Math.max(...trajectoryData[name].map(p => p.r)) : 0;

    // Calculate escape velocity at perihelion: v_esc = sqrt(2μ/r)
    const escapeVelocityAtPerihelion = Math.sqrt(2 * MU_SUN / elements.q);

    return {
      name,
      eccentricity: elements.e,
      inclination: elements.i,
      perihelion: elements.q,
      semiMajorAxis: elements.a,
      avgVelocity,
      minDistance,
      maxDistance,
      escapeVelocity: escapeVelocityAtPerihelion,
      orbitalType: elements.e > 1 ? 'Hyperbolic (Unbound)' : elements.e === 1 ? 'Parabolic' : 'Elliptical (Bound)'
    };
  });

  // Radar chart data for orbital comparison
  const radarData = [
    {
      parameter: 'Eccentricity',
      ...Object.fromEntries(
        Object.entries(orbitalElements).map(([name, elem]) => [
          name,
          elem.e
        ])
      )
    },
    {
      parameter: 'Inclination (°)',
      ...Object.fromEntries(
        Object.entries(orbitalElements).map(([name, elem]) => [
          name,
          elem.i / 90 // Normalize to 0-2
        ])
      )
    },
    {
      parameter: 'Perihelion (AU)',
      ...Object.fromEntries(
        Object.entries(orbitalElements).map(([name, elem]) => [
          name,
          elem.q
        ])
      )
    }
  ];

  return (
    <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', maxWidth: '100%' }}>

      {/* Distance from Sun over Time */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Distance from Sun (AU)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={distanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="index"
              stroke="#888"
              label={{ value: 'Time Steps', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis
              stroke="#888"
              label={{ value: 'Distance (AU)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
              labelStyle={{ color: '#fff' }}
              labelFormatter={(value) => {
                const point = distanceData[value as number];
                return point?.datetime || `Step ${value}`;
              }}
              formatter={(value: any) => [value.toFixed(3) + ' AU', '']}
            />
            <Legend />
            {Object.keys(trajectoryData).map(name => (
              <Line
                key={name}
                type="monotone"
                dataKey={`${name}_distance`}
                stroke={COLORS[name as keyof typeof COLORS] || '#ffffff'}
                strokeWidth={2}
                dot={false}
                name={name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Velocity over Time */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Velocity Magnitude (AU/day)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="index"
              stroke="#888"
              label={{ value: 'Time Steps', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis
              stroke="#888"
              label={{ value: 'Velocity (AU/day)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
              labelStyle={{ color: '#fff' }}
              labelFormatter={(value) => {
                const point = velocityData[value as number];
                return point?.datetime || `Step ${value}`;
              }}
              formatter={(value: any) => [value.toFixed(4) + ' AU/day', '']}
            />
            <Legend />
            {Object.keys(trajectoryData).map(name => (
              <Line
                key={name}
                type="monotone"
                dataKey={`${name}_velocity`}
                stroke={COLORS[name as keyof typeof COLORS] || '#ffffff'}
                strokeWidth={2}
                dot={false}
                name={name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orbital Energy over Time */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Orbital Energy (Specific Energy)</h3>
        <p style={{ color: '#999', fontSize: '11px', marginBottom: '10px' }}>
          E &lt; 0: Bound orbit (captured) | E &gt; 0: Unbound orbit (interstellar)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="index"
              stroke="#888"
              label={{ value: 'Time Steps', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis
              stroke="#888"
              label={{ value: 'Energy (AU²/day²)', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
              labelStyle={{ color: '#fff' }}
              labelFormatter={(value) => {
                const point = energyData[value as number];
                return point?.datetime || `Step ${value}`;
              }}
              formatter={(value: any) => {
                const status = value > 0 ? '(Unbound)' : value < 0 ? '(Bound)' : '(Parabolic)';
                return [`${value.toExponential(4)} AU²/day² ${status}`, ''];
              }}
            />
            <Legend />
            {Object.keys(trajectoryData).map(name => (
              <Line
                key={name}
                type="monotone"
                dataKey={`${name}_energy`}
                stroke={COLORS[name as keyof typeof COLORS] || '#ffffff'}
                strokeWidth={2}
                dot={false}
                name={name}
              />
            ))}
            {/* Reference line at E = 0 (bound/unbound boundary) */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="#888"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="E = 0 (Escape)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Eccentricity Comparison - Interstellar vs Solar System Objects */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Eccentricity Comparison</h3>
        <p style={{ color: '#999', fontSize: '11px', marginBottom: '10px' }}>
          e &gt; 1: Hyperbolic (Interstellar) | e = 1: Parabolic | e &lt; 1: Elliptical (Bound)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orbitalData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#888" />
            <YAxis type="category" dataKey="object" stroke="#888" width={100} />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
              formatter={(value: any, name: any, props: any) => {
                const type = props.payload.type;
                return [value.toFixed(3), `${name} (${type})`];
              }}
            />
            <Legend />
            <Bar dataKey="eccentricity" name="Eccentricity">
              {orbitalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            {/* Reference line at e = 1 (bound/unbound boundary) */}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Perihelion Distance Comparison */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Perihelion Distance (Closest Approach)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orbitalData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis type="number" stroke="#888" label={{ value: 'AU', position: 'insideBottom', offset: -5, fill: '#888' }} />
            <YAxis type="category" dataKey="object" stroke="#888" width={100} />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
              formatter={(value: any, name: any, props: any) => {
                const type = props.payload.type;
                return [`${value.toFixed(3)} AU`, `${name} (${type})`];
              }}
            />
            <Legend />
            <Bar dataKey="perihelion" name="Perihelion (AU)">
              {orbitalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart for Multi-parameter Comparison */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Multi-Parameter Comparison (Interstellar)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#444" />
            <PolarAngleAxis dataKey="parameter" stroke="#888" />
            <PolarRadiusAxis stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
            />
            <Legend />
            {Object.keys(orbitalElements).map(name => (
              <Radar
                key={name}
                name={name}
                dataKey={name}
                stroke={COLORS[name as keyof typeof COLORS] || '#ffffff'}
                fill={COLORS[name as keyof typeof COLORS] || '#ffffff'}
                fillOpacity={0.3}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Comprehensive Comparison Table */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px', gridColumn: '1 / -1' }}>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>Detailed Orbital Parameters Comparison</h3>

        {/* Interstellar Objects Table */}
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <h4 style={{ color: '#10b981', marginBottom: '10px', fontSize: '14px' }}>Interstellar Objects</h4>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            color: '#fff'
          }}>
            <thead>
              <tr style={{ background: '#2a2a3e', borderBottom: '2px solid #444' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Object</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Eccentricity (e)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Inclination (°)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Perihelion (AU)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Semi-major Axis (AU)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Avg Velocity (AU/day)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Min Distance (AU)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Max Distance (AU)</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Orbit Type</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTableData.map((row, index) => (
                <tr key={row.name} style={{
                  borderBottom: '1px solid #333',
                  background: index % 2 === 0 ? '#1a1a2e' : '#222232'
                }}>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold', color: COLORS[row.name as keyof typeof COLORS] }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.eccentricity.toFixed(4)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.inclination.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.perihelion.toFixed(3)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    {row.semiMajorAxis < 0 ? `${row.semiMajorAxis.toFixed(2)}` : row.semiMajorAxis.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.avgVelocity.toFixed(4)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.minDistance.toFixed(3)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.maxDistance.toFixed(3)}</td>
                  <td style={{ padding: '10px 8px', color: row.eccentricity > 1 ? '#10b981' : '#ef4444' }}>
                    {row.orbitalType}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reference Objects Table */}
        <div style={{ overflowX: 'auto' }}>
          <h4 style={{ color: '#6366f1', marginBottom: '10px', fontSize: '14px' }}>Solar System Objects (Reference)</h4>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            color: '#fff'
          }}>
            <thead>
              <tr style={{ background: '#2a2a3e', borderBottom: '2px solid #444' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Object</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Eccentricity (e)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Inclination (°)</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Perihelion (AU)</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(REFERENCE_OBJECTS).map(([name, data], index) => (
                <tr key={name} style={{
                  borderBottom: '1px solid #333',
                  background: index % 2 === 0 ? '#1a1a2e' : '#222232'
                }}>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold', color: data.color }}>
                    {name}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{data.type}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{data.e.toFixed(4)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{data.i.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>{data.q.toFixed(3)}</td>
                  <td style={{ padding: '10px 8px', fontSize: '11px', color: '#999' }}>
                    {data.type === 'Planet' ? 'Nearly circular orbit' :
                     data.e > 0.9 ? 'Highly eccentric, long period' : 'Elliptical bound orbit'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Insights */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#2a2a3e', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ color: '#10b981', marginBottom: '10px', fontSize: '14px' }}>Key Insights</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#ccc', lineHeight: '1.8' }}>
            <li><strong>Eccentricity (e &gt; 1):</strong> All interstellar objects have hyperbolic orbits (e &gt; 1), confirming they're not gravitationally bound to the Sun</li>
            <li><strong>High Inclination:</strong> Interstellar objects have much higher inclinations compared to planets, indicating they originated outside our solar system</li>
            <li><strong>Negative Semi-major Axis:</strong> Hyperbolic orbits have negative semi-major axes (a &lt; 0), distinguishing them from bound elliptical orbits</li>
            <li><strong>Comparison with Comets:</strong> Even highly eccentric comets like Halley (e=0.967) and Hale-Bopp (e=0.995) are still bound (e &lt; 1)</li>
            <li><strong>One-time Visitors:</strong> Interstellar objects pass through our solar system only once and never return</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
