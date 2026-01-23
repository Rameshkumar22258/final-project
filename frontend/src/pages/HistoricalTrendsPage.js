import React, { useState, useEffect, useRef } from 'react';
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
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
  'industrial / chemical': '#dc2626',
  'extreme temperature / heat wave': '#f97316',
  'glacial lake outburst / flood': '#0ea5e9',
  'flash flood / landslide': '#f59e0b',
  'reservoir events': '#6366f1',
  'wind storm': '#06b6d4',
  avalanche: '#94a3b8'
};

// Helper function to get color for disaster type (case-insensitive)
const getDisasterColor = (type) => {
  if (!type) return '#6b7280';
  const typeLower = type.toLowerCase();
  return COLORS[typeLower] || COLORS[typeLower.split('/')[0].trim()] || '#6b7280';
};

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#84cc16'
};


const HistoricalTrendsPage = () => {
  const [disasters, setDisasters] = useState([]);
  const [filteredDisasters, setFilteredDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [yearRange, setYearRange] = useState({ start: 1950, end: 2014 });

  useEffect(() => {
    loadHistoricalData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [disasters, yearRange]);

  // Debug: Log when filtered disasters change
  useEffect(() => {
    if (filteredDisasters.length > 0) {
      console.log('Filtered disasters count:', filteredDisasters.length);
      console.log('Total deaths:', filteredDisasters.reduce((sum, d) => sum + (d.casualties || d.approx_deaths || 0), 0));
      const states = new Set();
      filteredDisasters.forEach(d => {
        const state = d.state || extractState(d.location);
        if (state && state !== 'Unknown') {
          states.add(state);
        }
      });
      console.log('States found:', Array.from(states));
      console.log('States count:', states.size);
    }
  }, [filteredDisasters]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      // Try to load from backend API
      const response = await api.get('/disasters/historical');
      let loadedData = [];
      
      if (response.data) {
        // Handle different response structures
        if (Array.isArray(response.data)) {
          loadedData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          loadedData = response.data.data;
        } else if (response.data.india_historical_disasters_1950_2014 && Array.isArray(response.data.india_historical_disasters_1950_2014)) {
          loadedData = response.data.india_historical_disasters_1950_2014;
        }
      }
      
      if (loadedData.length > 0) {
        // Transform data to match expected format
        const transformedData = loadedData.map(d => ({
          ...d,
          // Map field names
          name: d.name || d.disaster_name || d.title || 'Unknown Disaster',
          year: d.year || parseInt(d.date?.substring(0, 4)) || 2000,
          disaster_type: d.disaster_type || d.type || 'Unknown',
          location: d.location || d.city || 'Unknown',
          casualties: d.approx_deaths || d.casualties || 0,
          affected: d.affected_population || d.affected || 0,
          notes: d.notes || d.description || '',
          sources: d.sources || []
        }));
        console.log('✅ Loaded disasters from API:', transformedData.length);
        console.log('📊 Sample disaster:', transformedData[0]);
        console.log('📍 Sample locations:', transformedData.slice(0, 5).map(d => d.location));
        const totalDeaths = transformedData.reduce((sum, d) => sum + (d.casualties || 0), 0);
        console.log('💀 Total deaths in data:', totalDeaths);
        setDisasters(transformedData);
      } else {
        // Fallback: Try direct JSON fetch
        try {
          const jsonResponse = await fetch('/ml_pipeline/data/historical/india_historical_disasters_1950_2014.json');
          if (jsonResponse.ok) {
            const data = await jsonResponse.json();
            let jsonData = [];
            if (data.india_historical_disasters_1950_2014) {
              jsonData = data.india_historical_disasters_1950_2014;
            } else if (Array.isArray(data)) {
              jsonData = data;
            }
            const transformedData = jsonData.map(d => ({
              ...d,
              name: d.name || 'Unknown Disaster',
              year: d.year || 2000,
              disaster_type: d.disaster_type || 'Unknown',
              location: d.location || 'Unknown',
              casualties: d.approx_deaths || 0,
              affected: d.affected || 0,
              notes: d.notes || '',
              sources: d.sources || []
            }));
            console.log('✅ Loaded disasters from JSON fallback:', transformedData.length);
            console.log('📊 Sample disaster:', transformedData[0]);
            console.log('📍 Sample locations:', transformedData.slice(0, 5).map(d => d.location));
            const totalDeaths = transformedData.reduce((sum, d) => sum + (d.casualties || 0), 0);
            console.log('💀 Total deaths in data:', totalDeaths);
            setDisasters(transformedData);
          } else {
            setDisasters([]);
          }
        } catch (e) {
          console.warn('Error loading from JSON fallback:', e);
          setDisasters([]);
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
      setDisasters([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...disasters];
    
    // Filter by year range
    filtered = filtered.filter(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      return year >= yearRange.start && year <= yearRange.end;
    });
    
    setFilteredDisasters(filtered);
  };

  // Extract state from location string
  const extractState = (location) => {
    if (!location) return 'Unknown';
    const locationStr = location.toString().toLowerCase();
    
    // State mapping with various patterns
    const stateMap = {
      'andhra pradesh': 'Andhra Pradesh',
      'assam': 'Assam',
      'bihar': 'Bihar',
      'gujarat': 'Gujarat',
      'bhuj': 'Gujarat',
      'haryana': 'Haryana',
      'himachal pradesh': 'Himachal Pradesh',
      'himachal': 'Himachal Pradesh',
      'jammu & kashmir': 'Jammu & Kashmir',
      'jammu': 'Jammu & Kashmir',
      'kashmir': 'Jammu & Kashmir',
      'karnataka': 'Karnataka',
      'kerala': 'Kerala',
      'kozhikode': 'Kerala',
      'calicut': 'Kerala',
      'madhya pradesh': 'Madhya Pradesh',
      'bhopal': 'Madhya Pradesh',
      'maharashtra': 'Maharashtra',
      'koyna': 'Maharashtra',
      'latur': 'Maharashtra',
      'osmanabad': 'Maharashtra',
      'pune': 'Maharashtra',
      'manipur': 'Manipur',
      'meghalaya': 'Meghalaya',
      'mizoram': 'Mizoram',
      'nagaland': 'Nagaland',
      'odisha': 'Odisha',
      'orissa': 'Odisha',
      'punjab': 'Punjab',
      'rajasthan': 'Rajasthan',
      'sikkim': 'Sikkim',
      'tamil nadu': 'Tamil Nadu',
      'chennai': 'Tamil Nadu',
      'tripura': 'Tripura',
      'uttar pradesh': 'Uttar Pradesh',
      'uttarakhand': 'Uttarakhand',
      'uttarkashi': 'Uttarakhand',
      'kedarnath': 'Uttarakhand',
      'malpa': 'Uttarakhand',
      'west bengal': 'West Bengal',
      'delhi': 'Delhi',
      'goa': 'Goa',
      'chhattisgarh': 'Chhattisgarh',
      'jharkhand': 'Jharkhand',
      'telangana': 'Telangana',
      'arunachal pradesh': 'Arunachal Pradesh',
      'northeast india': 'Northeast India',
      'northeast': 'Northeast India',
      'ne india': 'Northeast India',
      'andaman': 'Andaman & Nicobar',
      'nicobar': 'Andaman & Nicobar',
      'pondicherry': 'Puducherry'
    };
    
    // Check for exact matches first
    for (const [key, value] of Object.entries(stateMap)) {
      if (locationStr.includes(key)) {
        return value;
      }
    }
    
    // Check for "Pan-India" or "Multiple states"
    if (locationStr.includes('pan-india') || locationStr.includes('multiple states')) {
      return 'Multiple States';
    }
    
    return 'Unknown';
  };

  const getDisasterTypeData = () => {
    const typeCount = {};
    filteredDisasters.forEach(d => {
      const type = d.disaster_type || d.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const entries = Object.entries(typeCount).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: getDisasterColor(type)
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
        yearlyData[year] = { year, count: 0, casualties: 0, affected: 0 };
      }
      yearlyData[year].count += 1;
      yearlyData[year].casualties += d.casualties || d.approx_deaths || 0;
      yearlyData[year].affected += d.affected_population || d.affected || 0;
    });
    const sorted = Object.values(yearlyData).sort((a, b) => a.year - b.year);
    return {
      labels: sorted.map(d => d.year.toString()),
      datasets: [
        {
          label: 'Number of Disasters',
          data: sorted.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
        },
        {
          label: 'Deaths',
          data: sorted.map(d => d.casualties),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderDash: [5, 5],
          yAxisID: 'y1',
        }
      ]
    };
  };

  const getSeverityData = () => {
    const severityCount = {};
    filteredDisasters.forEach(d => {
      const severity = d.severity || 'medium';
      severityCount[severity] = (severityCount[severity] || 0) + 1;
    });
    const entries = Object.entries(severityCount).map(([severity, count]) => ({
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


  // Get deaths over time data
  const getDeathsOverTimeData = () => {
    const yearlyDeaths = {};
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      const deaths = d.casualties || d.approx_deaths || 0;
      if (!yearlyDeaths[year]) {
        yearlyDeaths[year] = 0;
      }
      yearlyDeaths[year] += deaths;
    });
    const sorted = Object.entries(yearlyDeaths)
      .map(([year, deaths]) => ({ year: parseInt(year), deaths }))
      .sort((a, b) => a.year - b.year);
    
    return {
      labels: sorted.map(d => d.year.toString()),
      datasets: [{
        label: 'Deaths',
        data: sorted.map(d => d.deaths),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    };
  };

  // Get most deadly disasters
  const getMostDeadlyDisastersData = () => {
    const deadly = filteredDisasters
      .filter(d => (d.casualties || d.approx_deaths || 0) > 0)
      .map(d => ({
        name: d.name || 'Unknown',
        deaths: d.casualties || d.approx_deaths || 0,
        year: d.year || 2000,
        type: d.disaster_type || d.type || 'Unknown'
      }))
      .sort((a, b) => b.deaths - a.deaths)
      .slice(0, 10);
    
    return {
      labels: deadly.map(d => `${d.name.substring(0, 25)}${d.name.length > 25 ? '...' : ''} (${d.year})`),
      datasets: [{
        label: 'Deaths',
        data: deadly.map(d => d.deaths),
        backgroundColor: deadly.map(d => {
          const deaths = d.deaths;
          if (deaths > 10000) return '#dc2626';
          if (deaths > 5000) return '#ea580c';
          if (deaths > 1000) return '#f59e0b';
          return '#84cc16';
        }),
        borderColor: '#1e293b',
        borderWidth: 2,
        borderRadius: 6
      }]
    };
  };

  // Get decade-based analysis
  const getDecadeData = () => {
    const decadeData = {};
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      const decade = Math.floor(year / 10) * 10;
      const decadeKey = `${decade}s`;
      
      if (!decadeData[decadeKey]) {
        decadeData[decadeKey] = {
          count: 0,
          deaths: 0,
          types: {}
        };
      }
      decadeData[decadeKey].count += 1;
      decadeData[decadeKey].deaths += d.casualties || d.approx_deaths || 0;
      
      const type = d.disaster_type || d.type || 'Unknown';
      decadeData[decadeKey].types[type] = (decadeData[decadeKey].types[type] || 0) + 1;
    });
    
    const sorted = Object.entries(decadeData)
      .map(([decade, data]) => ({
        decade,
        ...data
      }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
    
    return {
      labels: sorted.map(d => d.decade),
      datasets: [
        {
          label: 'Number of Disasters',
          data: sorted.map(d => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Total Deaths',
          data: sorted.map(d => d.deaths),
          backgroundColor: 'rgba(220, 38, 38, 0.6)',
          borderColor: '#dc2626',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Get disaster type trends by decade
  const getDisasterTypeByDecadeData = () => {
    const typeDecadeData = {};
    
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      const decade = Math.floor(year / 10) * 10;
      const type = d.disaster_type || d.type || 'Unknown';
      
      if (!typeDecadeData[type]) {
        typeDecadeData[type] = {};
      }
      typeDecadeData[type][decade] = (typeDecadeData[type][decade] || 0) + 1;
    });
    
    // Get all decades
    const decades = new Set();
    filteredDisasters.forEach(d => {
      const year = d.year || parseInt(d.date?.substring(0, 4)) || 2000;
      decades.add(Math.floor(year / 10) * 10);
    });
    const sortedDecades = Array.from(decades).sort((a, b) => a - b);
    
    const datasets = Object.entries(typeDecadeData).map(([type, decadeCounts]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      data: sortedDecades.map(decade => decadeCounts[decade] || 0),
      backgroundColor: getDisasterColor(type),
      borderColor: getDisasterColor(type),
      borderWidth: 2
    }));
    
    return {
      labels: sortedDecades.map(d => `${d}s`),
      datasets
    };
  };


  if (loading) {
    return (
      <div className="historical-trends-loading">
        <div className="spinner"></div>
        <p>Loading historical disaster data...</p>
      </div>
    );
  }

  const typeData = getDisasterTypeData();
  const yearlyData = getYearlyTrendData();
  const severityData = getSeverityData();
  const deathsOverTimeData = getDeathsOverTimeData();
  const mostDeadlyData = getMostDeadlyDisastersData();
  const decadeData = getDecadeData();
  const typeByDecadeData = getDisasterTypeByDecadeData();

  // Force component remount if data changes significantly
  const dataVersion = filteredDisasters.length > 0 ? filteredDisasters[0]?.year : 0;

  return (
    <div className="historical-trends-page" key={`trends-${dataVersion}`}>
      <div className="historical-trends-header">
        <h1>Historical Disaster Trends</h1>
        <p>Analyze patterns and trends from India's disaster history (1950-2014)</p>
      </div>

      {/* Year Range Selector */}
      <div className="year-range-selector">
        <label>Year Range:</label>
        <input
          type="number"
          min="1950"
          max="2014"
          value={yearRange.start}
          onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
        />
        <span>to</span>
        <input
          type="number"
          min="1950"
          max="2014"
          value={yearRange.end}
          onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
        />
        <span className="record-count">{filteredDisasters.length} disasters</span>
        <span className="total-deaths">
          Total Deaths: {filteredDisasters.reduce((sum, d) => sum + (d.casualties || d.approx_deaths || 0), 0).toLocaleString()}
        </span>
      </div>

      <div className="historical-trends-content">
        {/* Left Column: Charts and Analytics */}
        <div className="trends-main">
          {/* Summary Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{filteredDisasters.length}</h3>
              <p>Total Disasters</p>
            </div>
            <div className="stat-card">
              <h3>{(() => {
                const total = filteredDisasters.reduce((sum, d) => {
                  const deaths = d.casualties || d.approx_deaths || 0;
                  return sum + (typeof deaths === 'number' ? deaths : 0);
                }, 0);
                return total.toLocaleString();
              })()}</h3>
              <p>Total Deaths</p>
            </div>
            <div className="stat-card">
              <h3>{(() => {
                if (filteredDisasters.length === 0) return 'N/A';
                const typeCount = {};
                filteredDisasters.forEach(d => {
                  const type = (d.disaster_type || d.type || 'Unknown').toString();
                  typeCount[type] = (typeCount[type] || 0) + 1;
                });
                const mostCommon = Object.entries(typeCount)
                  .sort((a, b) => b[1] - a[1])[0];
                if (mostCommon) {
                  return mostCommon[0].split('/')[0].trim();
                }
                return 'N/A';
              })()}</h3>
              <p>Most Common Type</p>
            </div>
            <div className="stat-card">
              <h3>{(() => {
                if (filteredDisasters.length === 0) return 0;
                const states = new Set();
                filteredDisasters.forEach(d => {
                  const location = d.location || '';
                  const state = d.state || extractState(location);
                  if (state && state !== 'Unknown' && state !== 'Multiple States') {
                    states.add(state);
                  }
                });
                return states.size;
              })()}</h3>
              <p>States Affected</p>
            </div>
          </div>

          {/* Charts Row 1 */}
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
                      legend: {
                        position: 'bottom',
                      },
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
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>Disaster Frequency Over Time</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line
                  data={yearlyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Number of Disasters'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Casualties'
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row 2.5 - Deaths Over Time */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>💔 Deaths Over Time (1950-2014)</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line
                  data={deathsOverTimeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Deaths: ${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Deaths',
                          font: { weight: 'bold' }
                        },
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row 3 - Most Deadly Disasters */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>🔥 Top 10 Most Deadly Disasters</h3>
              <div style={{ height: '350px', position: 'relative' }}>
                <Bar
                  data={mostDeadlyData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Deaths: ${context.parsed.x.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Deaths',
                          font: { weight: 'bold' }
                        },
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString();
                          }
                        }
                      },
                      y: {
                        ticks: {
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row 4 - Decade Analysis */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>📅 Disaster Trends by Decade</h3>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar
                  data={decadeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            if (context.datasetIndex === 0) {
                              return `Disasters: ${context.parsed.y}`;
                            } else {
                              return `Deaths: ${context.parsed.y.toLocaleString()}`;
                            }
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Disasters'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Total Deaths'
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row 5 - Disaster Types by Decade */}
          <div className="charts-row">
            <div className="chart-card full-width">
              <h3>🌊 Disaster Types Over Decades</h3>
              <div style={{ height: '350px', position: 'relative' }}>
                <Bar
                  data={typeByDecadeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} disasters`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        stacked: false,
                        title: {
                          display: true,
                          text: 'Decade'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        stacked: false,
                        title: {
                          display: true,
                          text: 'Number of Disasters'
                        }
                      }
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
                // Try to extract coordinates from location or use default India center
                // For now, we'll use approximate coordinates based on state/location
                const lat = disaster.latitude || 20.5937;
                const lng = disaster.longitude || 78.9629;
                const type = disaster.disaster_type || disaster.type || 'flood';
                const affected = disaster.affected_population || disaster.affected || 0;
                const deaths = disaster.casualties || disaster.approx_deaths || 0;
                const typeColor = getDisasterColor(type);
                
                // Create custom icon with color based on disaster type
                const customIcon = L.divIcon({
                  className: 'custom-disaster-marker',
                  html: `<div style="background-color: ${typeColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                });
                
                return (
                  <Marker key={idx} position={[lat, lng]} icon={customIcon}>
                    <Popup>
                      <div className="disaster-popup">
                        <h4>{disaster.name || disaster.event_name || `Disaster ${idx + 1}`}</h4>
                        <p><strong>Type:</strong> {type}</p>
                        <p><strong>Year:</strong> {disaster.year || disaster.date?.substring(0, 4)}</p>
                        <p><strong>Location:</strong> {disaster.location || disaster.city || 'Unknown'}</p>
                        {affected > 0 && <p><strong>Affected:</strong> {affected.toLocaleString()}</p>}
                        <p><strong>Deaths:</strong> {deaths.toLocaleString()}</p>
                        {disaster.notes && <p><strong>Notes:</strong> {disaster.notes.substring(0, 100)}{disaster.notes.length > 100 ? '...' : ''}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Right Column: Disaster Details */}
        <div className="trends-sidebar">
          {/* Selected Disaster Details */}
          {selectedDisaster && (
            <div className="disaster-details-card">
              <h3>📊 Disaster Details</h3>
              <div className="disaster-details">
                <h4>{selectedDisaster.name || selectedDisaster.event_name || 'Disaster Details'}</h4>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{selectedDisaster.disaster_type || selectedDisaster.type || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Year:</span>
                  <span className="value">{selectedDisaster.year || selectedDisaster.date?.substring(0, 4) || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{selectedDisaster.location || selectedDisaster.city || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">State:</span>
                  <span className="value">{selectedDisaster.state || extractState(selectedDisaster.location) || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Severity:</span>
                  <span className={`value severity-${selectedDisaster.severity || 'medium'}`}>
                    {(selectedDisaster.severity || 'medium').toUpperCase()}
                  </span>
                </div>
                {selectedDisaster.affected_population || selectedDisaster.affected ? (
                  <div className="detail-row">
                    <span className="label">People:</span>
                    <span className="value">{(selectedDisaster.affected_population || selectedDisaster.affected || 0).toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="detail-row">
                  <span className="label">Deaths:</span>
                  <span className="value">{(selectedDisaster.casualties || selectedDisaster.approx_deaths || 0).toLocaleString()}</span>
                </div>
                {selectedDisaster.notes && (
                  <div className="detail-description">
                    <p><strong>Notes:</strong> {selectedDisaster.notes}</p>
                  </div>
                )}
                {selectedDisaster.sources && selectedDisaster.sources.length > 0 && (
                  <div className="detail-description">
                    <p><strong>Sources:</strong></p>
                    <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                      {selectedDisaster.sources.map((source, idx) => (
                        <li key={idx}>
                          <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedDisaster.description && (
                  <div className="detail-description">
                    <p>{selectedDisaster.description}</p>
                  </div>
                )}
                {selectedDisaster.relief_food_packets && (
                  <div className="relief-estimates">
                    <h5>Estimated Relief Requirements:</h5>
                    <div className="relief-item">Food: {selectedDisaster.relief_food_packets.toLocaleString()} packets</div>
                    <div className="relief-item">Water: {selectedDisaster.relief_water_liters.toLocaleString()} liters</div>
                    <div className="relief-item">Medical Teams: {selectedDisaster.relief_medical_teams}</div>
                    <div className="relief-item">Shelters: {selectedDisaster.relief_shelters}</div>
                    <div className="relief-item">Financial Aid: ₹{(selectedDisaster.relief_financial_aid_inr || 0).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrendsPage;

