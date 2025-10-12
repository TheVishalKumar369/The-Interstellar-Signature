import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
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

export const ComparisonCharts = ({ trajectoryData, orbitalElements }: ComparisonChartsProps) => {

  // Prepare distance from Sun over time
  const distanceData = Object.entries(trajectoryData).flatMap(([name, data]) =>
    data.map((point, index) => ({
      index,
      datetime: point.datetime_str,
      [`${name}_distance`]: point.r,
      name
    }))
  );

  // Prepare velocity magnitude over time
  const velocityData = Object.entries(trajectoryData).flatMap(([name, data]) =>
    data.map((point, index) => {
      const velocity = Math.sqrt(point.vx ** 2 + point.vy ** 2 + point.vz ** 2);
      return {
        index,
        datetime: point.datetime_str,
        [`${name}_velocity`]: velocity,
        name
      };
    })
  );

  // Prepare orbital elements comparison
  const orbitalData = Object.entries(orbitalElements).map(([name, elements]) => ({
    object: name.split('/')[1] || name, // Short name
    eccentricity: elements.e,
    inclination: elements.i,
    perihelion: elements.q,
  }));

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
    <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>

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

      {/* Orbital Elements Bar Chart */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Orbital Elements Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orbitalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="object" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#2a2a3e', border: '1px solid #444', color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="eccentricity" fill="#ff6b6b" name="Eccentricity" />
            <Bar dataKey="inclination" fill="#4ecdc4" name="Inclination (°)" />
            <Bar dataKey="perihelion" fill="#ffe66d" name="Perihelion (AU)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar Chart for Multi-parameter Comparison */}
      <div style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Multi-Parameter Comparison</h3>
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
    </div>
  );
};
