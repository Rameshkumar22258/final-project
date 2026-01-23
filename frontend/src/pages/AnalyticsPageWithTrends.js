/**
 * Combined Analytics & Historical Trends Page
 * Shows both current analytics and historical trends in tabs
 */

import React, { useState, useEffect } from 'react';
import { disasterAPI } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './AnalyticsPage.css';
import './AnalyticsPageEnhanced.css';
import './HistoricalTrendsPage.css';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const COLORS = {
  flood: '#3b82f6',
  earthquake: '#8b5cf6',
  cyclone: '#06b6d4',
  landslide: '#f59e0b',
  drought: '#ef4444',
  wildfire: '#f97316',
  tsunami: '#6366f1',
  'industrial / chemical': '#6b7280',
  'flash flood / landslide': '#3b82f6',
  'extreme temperature / heat wave': '#ef4444',
  'glacial lake outburst / flood': '#06b6d4',
  'cyclone / storm surge': '#06b6d4',
  'reservoir events': '#3b82f6',
  unknown: '#6b7280'
};

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#84cc16'
};

const FAMOUS_DISASTERS = [
  {
    id: 'kerala_floods_2018',
    name: 'Kerala Floods 2018',
    year: 2018,
    type: 'flood',
    location: 'Kerala',
    casualties: 483,
    affected: 5000000,
    description: 'Worst flooding in Kerala in nearly a century, affecting all 14 districts'
  },
  {
    id: 'chennai_floods_2015',
    name: 'Chennai Floods 2015',
    year: 2015,
    type: 'flood',
    location: 'Chennai, Tamil Nadu',
    casualties: 500,
    affected: 2000000,
    description: 'Heavy rainfall caused massive flooding in Chennai and surrounding areas'
  },
  {
    id: 'uttarakhand_floods_2013',
    name: 'Uttarakhand Floods 2013',
    year: 2013,
    type: 'flood',
    location: 'Uttarakhand',
    casualties: 6000,
    affected: 1000000,
    description: 'Flash floods and landslides in the Himalayan state, also known as "Himalayan Tsunami"'
  },
  {
    id: 'gujarat_earthquake_2001',
    name: 'Gujarat Earthquake 2001',
    year: 2001,
    type: 'earthquake',
    location: 'Gujarat',
    casualties: 20000,
    affected: 2000000,
    description: '7.7 magnitude earthquake, one of the deadliest in India\'s history'
  },
  {
    id: 'cyclone_fani_2019',
    name: 'Cyclone Fani 2019',
    year: 2019,
    type: 'cyclone',
    location: 'Odisha',
    casualties: 89,
    affected: 3000000,
    description: 'Extremely severe cyclonic storm, largest evacuation in India\'s history'
  }
];

const AnalyticsPageWithTrends = () => {
  const { dataMode } = useDataMode();
  const [historicalDisasters, setHistoricalDisasters] = useState([]);
  const [filteredDisasters, setFilteredDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [yearRange, setYearRange] = useState({ start: 1950, end: 2014 });

  useEffect(() => {
    loadHistoricalData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historicalDisasters, yearRange]);


  const loadHistoricalData = async () => {
    try {
      // Try to load from backend API first
      const response = await api.get('/disasters/historical');
      let historicalData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          historicalData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          historicalData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          historicalData = response.data.data;
        } else if (response.data.india_historical_disasters_1950_2014) {
          historicalData = response.data.india_historical_disasters_1950_2014;
        }
      }
      
      // If no data from API, load from local JSON file
      if (historicalData.length === 0) {
        try {
          const localResponse = await fetch('/data/india_historical_disasters_1950_2014.json');
          if (localResponse.ok) {
            const localData = await localResponse.json();
            historicalData = localData.india_historical_disasters_1950_2014 || [];
          }
        } catch (e) {
          console.log('Could not load local JSON file');
        }
      }
      
      // Process and normalize the data
      const processedData = historicalData.map(disaster => {
        // Normalize disaster type to lowercase
        const type = (disaster.disaster_type || disaster.type || 'unknown')
          .toLowerCase()
          .replace(/\s+\/\s+/g, '/')
          .split('/')[0] // Take first type if multiple
          .trim();
        
        return {
          ...disaster,
          disaster_type: type,
          type: type,
          year: disaster.year || parseInt(disaster.date?.substring(0, 4)) || 2000,
          casualties: disaster.approx_deaths || disaster.casualties || 0,
          affected_population: disaster.affected || disaster.affected_population || 0,
          location: disaster.location || 'Unknown',
          name: disaster.name || disaster.title || 'Unknown Disaster'
        };
      });
      
      if (processedData.length > 0) {
        setHistoricalDisasters(processedData);
      } else {
        // Fallback to famous disasters
        setHistoricalDisasters(FAMOUS_DISASTERS);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
      // Try to load from local file as fallback
      try {
        const localResponse = await fetch('/data/india_historical_disasters_1950_2014.json');
        if (localResponse.ok) {
          const localData = await localResponse.json();
          const processedData = (localData.india_historical_disasters_1950_2014 || []).map(disaster => ({
            ...disaster,
            disaster_type: (disaster.disaster_type || 'unknown').toLowerCase().split('/')[0].trim(),
            type: (disaster.disaster_type || 'unknown').toLowerCase().split('/')[0].trim(),
            year: disaster.year || 2000,
            casualties: disaster.approx_deaths || 0,
            affected_population: 0,
            location: disaster.location || 'Unknown',
            name: disaster.name || 'Unknown Disaster'
          }));
          setHistoricalDisasters(processedData);
        } else {
          setHistoricalDisasters(FAMOUS_DISASTERS);
        }
      } catch (e) {
        setHistoricalDisasters(FAMOUS_DISASTERS);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...historicalDisasters];
    filtered = filtered.filter(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      return year >= yearRange.start && year <= yearRange.end;
    });
    // Sort by year (newest first)
    filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
    setFilteredDisasters(filtered);
  };

  // Historical data functions
  const getDisasterTypeData = () => {
    const typeCount = {};
    filteredDisasters.forEach(d => {
      const type = d.disaster_type || d.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const entries = Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: COLORS[type] || '#6b7280'
    }));
    return {
      labels: entries.map(e => e.name),
      datasets: [{
        label: 'Disasters',
        data: entries.map(e => e.value),
        backgroundColor: entries.map(e => e.color),
        borderColor: entries.map(e => e.color),
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  };

  const getYearlyTrendData = () => {
    const yearlyData = {};
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      if (!yearlyData[year]) {
        yearlyData[year] = { year, count: 0, casualties: 0 };
      }
      yearlyData[year].count += 1;
      yearlyData[year].casualties += d.casualties || 0;
    });
    const sorted = Object.values(yearlyData).sort((a, b) => a.year - b.year);
    return {
      labels: sorted.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Number of Disasters',
          data: sorted.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Casualties (in thousands)',
          data: sorted.map(d => Math.round((d.casualties || 0) / 1000)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          yAxisID: 'y1',
        }
      ]
    };
  };

  const getSeverityData = () => {
    const severityCount = {};
    filteredDisasters.forEach(d => {
      let severity = d.severity;
      
      // If no explicit severity, calculate from casualties
      if (!severity) {
        const casualties = d.casualties || d.approx_deaths || 0;
        if (casualties > 5000) severity = 'critical';
        else if (casualties > 500) severity = 'high';
        else if (casualties > 50) severity = 'medium';
        else severity = 'low';
      }
      
      severity = severity.toLowerCase();
      severityCount[severity] = (severityCount[severity] || 0) + 1;
    });
    
    // Ensure all severity levels are represented
    const allSeverities = ['critical', 'high', 'medium', 'low'];
    allSeverities.forEach(sev => {
      if (!severityCount[sev]) severityCount[sev] = 0;
    });
    
    const entries = Object.entries(severityCount)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
        color: SEVERITY_COLORS[severity] || '#6b7280'
      }));
    
    return {
      labels: entries.map(e => e.name),
      datasets: [{
        label: 'Disasters',
        data: entries.map(e => e.value),
        backgroundColor: entries.map(e => e.color),
        borderColor: entries.map(e => e.color),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    };
  };

  const getStateData = () => {
    const stateCount = {};
    filteredDisasters.forEach(d => {
      const location = d.location || d.state || 'Unknown';
      let state = 'Unknown';
      
      // Extract state from location string
      if (typeof location === 'string') {
        // Try to match common state patterns
        const statePatterns = [
          /Kerala/i, /Tamil Nadu/i, /Uttarakhand/i, /Gujarat/i, /Odisha/i, /Orissa/i,
          /Maharashtra/i, /Assam/i, /Bihar/i, /West Bengal/i, /Andhra Pradesh/i,
          /Telangana/i, /Himachal Pradesh/i, /Jammu & Kashmir/i, /Kashmir/i,
          /Madhya Pradesh/i, /Northeast India/i, /Assam–Tibet/i, /Pan-India/i,
          /Sikkim/i, /Pondicherry/i, /Puducherry/i, /Tamil Nadu/i
        ];
        
        for (const pattern of statePatterns) {
          if (pattern.test(location)) {
            const match = location.match(pattern);
            if (match) {
              state = match[0];
              // Normalize state names
              if (state.toLowerCase().includes('orissa')) state = 'Odisha';
              if (state.toLowerCase().includes('pondicherry')) state = 'Puducherry';
              if (state.toLowerCase().includes('jammu') || state.toLowerCase().includes('kashmir')) state = 'Jammu & Kashmir';
              if (state.toLowerCase().includes('northeast') || state.toLowerCase().includes('assam–tibet')) state = 'Northeast India';
              break;
            }
          }
        }
        
        // If no pattern matched, try to extract from comma-separated location
        if (state === 'Unknown' && location.includes(',')) {
          const parts = location.split(',').map(p => p.trim());
          // Usually state is the last part or contains state keywords
          for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            for (const pattern of statePatterns) {
              if (pattern.test(part)) {
                state = part;
                break;
              }
            }
            if (state !== 'Unknown') break;
          }
        }
      } else if (location && typeof location === 'object') {
        state = location.state || location.name || 'Unknown';
      }
      
      stateCount[state] = (stateCount[state] || 0) + 1;
    });
    
    const sorted = Object.entries(stateCount)
      .filter(([state]) => state !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sorted.map(([state]) => state),
      datasets: [{
        label: 'Disasters',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#06b6d4',
        borderColor: '#0891b2',
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 40
      }]
    };
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading historical trends...</p>
      </div>
    );
  }

  // New visualization functions
  const getDecadeData = () => {
    const decadeData = {};
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      const decade = Math.floor(year / 10) * 10;
      if (!decadeData[decade]) {
        decadeData[decade] = { decade, count: 0, casualties: 0 };
      }
      decadeData[decade].count += 1;
      decadeData[decade].casualties += d.casualties || 0;
    });
    const sorted = Object.values(decadeData).sort((a, b) => a.decade - b.decade);
    return {
      labels: sorted.map(d => `${d.decade}s`),
      datasets: [
        {
          label: 'Disasters per Decade',
          data: sorted.map(d => d.count),
          backgroundColor: '#6366f1',
          borderColor: '#4f46e5',
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 50
        }
      ]
    };
  };

  const getCasualtiesByType = () => {
    const typeCasualties = {};
    filteredDisasters.forEach(d => {
      const type = (d.disaster_type || d.type || 'unknown').toLowerCase();
      if (!typeCasualties[type]) {
        typeCasualties[type] = 0;
      }
      typeCasualties[type] += d.casualties || 0;
    });
    const sorted = Object.entries(typeCasualties)
      .filter(([, casualties]) => casualties > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return {
      labels: sorted.map(([type]) => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [{
        label: 'Total Casualties',
        data: sorted.map(([, casualties]) => casualties),
        backgroundColor: sorted.map(([type]) => COLORS[type] || '#6b7280'),
        borderColor: sorted.map(([type]) => COLORS[type] || '#6b7280'),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 50
      }]
    };
  };

  // Calculate all chart data before rendering
  const typeData = getDisasterTypeData();
  const yearlyData = getYearlyTrendData();
  const severityData = getSeverityData();
  const stateData = getStateData();
  const decadeData = getDecadeData();
  const casualtiesByTypeData = getCasualtiesByType();

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Historical Trends</h1>
          <p>Historical disaster patterns and analysis</p>
        </div>
      </div>

      <div className="historical-trends-page">
          <div className="year-range-selector">
            <label>Year Range:</label>
            <input
              type="number"
              min="1950"
              max="2014"
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) || 1950 })}
            />
            <span>to</span>
            <input
              type="number"
              min="1950"
              max="2014"
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) || 2014 })}
            />
            <span className="record-count">{filteredDisasters.length} disasters</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>{filteredDisasters.length}</h3>
              <p>Total Disasters</p>
            </div>
            <div className="stat-card">
              <h3>{filteredDisasters.reduce((sum, d) => sum + (d.casualties || 0), 0).toLocaleString()}</h3>
              <p>Total Casualties</p>
            </div>
            <div className="stat-card">
              <h3>{(filteredDisasters.reduce((sum, d) => sum + (d.affected_population || d.affected || 0), 0) / 1000000).toFixed(1)}M</h3>
              <p>People Affected</p>
            </div>
            <div className="stat-card">
              <h3>{new Set(filteredDisasters.map(d => d.state || d.location?.state)).size}</h3>
              <p>States Affected</p>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Disaster Types Distribution</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Pie
                  data={typeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Severity Distribution</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar
                  data={severityData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>Disaster Frequency & Casualties Over Time (1950-2014)</h3>
              <div style={{ height: '400px', position: 'relative' }}>
                <Line
                  data={yearlyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                      y: { 
                        type: 'linear', 
                        display: true, 
                        position: 'left', 
                        title: { display: true, text: 'Number of Disasters', color: '#3b82f6', font: { size: 12, weight: 'bold' } },
                        ticks: { color: '#3b82f6' },
                        grid: { color: 'rgba(59, 130, 246, 0.1)' }
                      },
                      y1: { 
                        type: 'linear', 
                        display: true, 
                        position: 'right', 
                        title: { display: true, text: 'Casualties (thousands)', color: '#ef4444', font: { size: 12, weight: 'bold' } }, 
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#ef4444' }
                      },
                      x: {
                        title: { display: true, text: 'Year', font: { size: 12, weight: 'bold' } },
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Disasters by Decade</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar
                  data={decadeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Disasters: ${context.parsed.y}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1 } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Casualties by Disaster Type</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar
                  data={casualtiesByTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Casualties: ${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>Top Affected Regions</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar
                  data={stateData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { beginAtZero: true, ticks: { stepSize: 1 } },
                      y: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Map View */}
          <div className="chart-card full-width map-card">
            <h3>Geographic Distribution</h3>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {filteredDisasters.slice(0, 50).map((disaster, idx) => {
                // Try to get coordinates from location or use default
                let lat = 20.5937, lng = 78.9629;
                const location = disaster.location || '';
                
                // Simple coordinate mapping for major states/regions
                const locationCoords = {
                  'kerala': [10.1632, 76.6413],
                  'tamil nadu': [11.1271, 78.6569],
                  'uttarakhand': [30.0668, 79.0193],
                  'gujarat': [23.0225, 72.5714],
                  'odisha': [20.9517, 85.0985],
                  'orissa': [20.9517, 85.0985],
                  'maharashtra': [19.7515, 75.7139],
                  'assam': [26.2006, 92.9376],
                  'bihar': [25.0961, 85.3131],
                  'west bengal': [22.9868, 87.8550],
                  'andhra pradesh': [15.9129, 79.7400],
                  'telangana': [18.1124, 79.0193],
                  'himachal pradesh': [31.1048, 77.1734],
                  'jammu': [32.7266, 74.8570],
                  'kashmir': [34.0837, 74.7973],
                  'madhya pradesh': [22.9734, 78.6569],
                  'sikkim': [27.5330, 88.5122],
                  'pondicherry': [11.9416, 79.8083],
                  'puducherry': [11.9416, 79.8083],
                  'visakhapatnam': [17.6868, 83.2185],
                  'chennai': [13.0827, 80.2707],
                  'kolkata': [22.5726, 88.3639],
                  'bhopal': [23.2599, 77.4126],
                  'latur': [18.4088, 76.5604],
                  'koyna': [17.4000, 73.7500]
                };
                
                const locationLower = location.toLowerCase();
                for (const [key, coords] of Object.entries(locationCoords)) {
                  if (locationLower.includes(key)) {
                    lat = coords[0];
                    lng = coords[1];
                    break;
                  }
                }
                
                const type = disaster.disaster_type || disaster.type || 'flood';
                const affected = disaster.affected_population || disaster.affected || 0;
                
                // Determine severity based on casualties
                let severity = 'medium';
                const casualties = disaster.casualties || disaster.approx_deaths || 0;
                if (casualties > 5000) severity = 'critical';
                else if (casualties > 500) severity = 'high';
                else if (casualties > 50) severity = 'medium';
                else severity = 'low';

                return (
                  <Marker key={idx} position={[lat, lng]}>
                    <Popup>
                      <div className="disaster-popup">
                        <h4>{disaster.name || disaster.event_name || disaster.title || `Disaster ${idx + 1}`}</h4>
                        <p><strong>Type:</strong> {type.charAt(0).toUpperCase() + type.slice(1)}</p>
                        <p><strong>Year:</strong> {disaster.year || disaster.date?.substring(0, 4)}</p>
                        <p><strong>Severity:</strong> <span style={{ color: SEVERITY_COLORS[severity] }}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</span></p>
                        {location && <p><strong>Location:</strong> {location}</p>}
                        {affected > 0 && <p><strong>Affected:</strong> {affected.toLocaleString()}</p>}
                        {casualties > 0 && <p><strong>Casualties:</strong> {casualties.toLocaleString()}</p>}
                        {disaster.notes && <p className="popup-description">{disaster.notes}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Famous Disasters List */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>Major Historical Disasters</h3>
              <div className="famous-disasters-list">
                {filteredDisasters
                  .filter(d => (d.casualties || 0) > 0)
                  .sort((a, b) => (b.casualties || 0) - (a.casualties || 0))
                  .slice(0, 10)
                  .map((disaster, idx) => (
                    <div key={disaster.id || idx} className="famous-disaster-item">
                      <div className="disaster-rank">#{idx + 1}</div>
                      <div className="disaster-info">
                        <h4>{disaster.name || disaster.title || 'Unknown Disaster'}</h4>
                        <div className="disaster-details">
                          <span className="disaster-year">{disaster.year || 'Unknown'}</span>
                          <span className="disaster-type">{(disaster.disaster_type || disaster.type || 'Unknown').charAt(0).toUpperCase() + (disaster.disaster_type || disaster.type || 'Unknown').slice(1)}</span>
                          <span className="disaster-location">{disaster.location || 'Unknown Location'}</span>
                        </div>
                        {disaster.casualties > 0 && (
                          <div className="disaster-casualties">
                            Casualties: {disaster.casualties.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AnalyticsPageWithTrends;

