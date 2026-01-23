/**
 * Dynamic Map View - Live Disaster Tracking
 * Shows real-time disasters with affected area visualization
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { disasterAPI } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import './DynamicMapView.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom disaster icons by type
const createDisasterIcon = (type, severity) => {
  const colors = {
    critical: '#dc2626',
    high: '#f59e0b',
    medium: '#eab308',
    low: '#22c55e'
  };

  const icons = {
    flood: '🌊',
    earthquake: '🏚️',
    cyclone: '🌀',
    landslide: '⛰️',
    wildfire: '🔥',
    drought: '☀️',
    tsunami: '🌊',
    avalanche: '❄️'
  };

  const color = colors[severity] || '#6b7280';
  const icon = icons[type] || '⚠️';

  return L.divIcon({
    className: 'custom-disaster-icon',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
        ${icon}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Component to fly to selected disaster
const FlyToDisaster = ({ disaster }) => {
  const map = useMap();
  
  useEffect(() => {
    if (disaster && disaster.location?.coordinates) {
      map.flyTo(
        [disaster.location.coordinates.latitude, disaster.location.coordinates.longitude],
        10,
        { duration: 1.5 }
      );
    }
  }, [disaster, map]);
  
  return null;
};

const DynamicMapView = () => {
  const { dataMode } = useDataMode();
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Fetch live disasters
  useEffect(() => {
    fetchDisasters();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDisasters, 300000);
    return () => clearInterval(interval);
  }, []);

  // Reload data when data mode changes
  useEffect(() => {
    fetchDisasters();
  }, [dataMode]);

  // Listen for data mode changes
  useEffect(() => {
    const handleDataModeChange = () => {
      fetchDisasters();
    };
    window.addEventListener('dataModeChanged', handleDataModeChange);
    return () => window.removeEventListener('dataModeChanged', handleDataModeChange);
  }, []);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const response = await disasterAPI.getActiveDisasters();
      
      if (response.data.success) {
        const uniqueDisasters = response.data.data || [];
        // Remove duplicates based on disaster_id
        const seen = new Set();
        const filtered = uniqueDisasters.filter(d => {
          if (seen.has(d.disaster_id)) {
            return false;
          }
          seen.add(d.disaster_id);
          return true;
        });
        
        console.log(`Loaded ${filtered.length} unique disasters (${uniqueDisasters.length} total)`);
        setDisasters(filtered);
        setError(null);
      }
    } catch (err) {
      // Suppress error logging for connection errors (handled by API interceptor)
      if (err.code !== 'ERR_NETWORK' && !err.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching disasters:', err);
      }
      setError('Failed to load disaster data');
    } finally {
      setLoading(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      critical: { fill: '#dc2626', stroke: '#991b1b' },
      high: { fill: '#f59e0b', stroke: '#b45309' },
      medium: { fill: '#eab308', stroke: '#a16207' },
      low: { fill: '#22c55e', stroke: '#15803d' }
    };
    return colors[severity] || colors.medium;
  };

  // Calculate affected radius in meters
  const getRadiusInMeters = (radiusKm) => {
    return (radiusKm || 20) * 1000; // Convert km to meters
  };

  // Format numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  // Get disaster type emoji
  const getDisasterEmoji = (type) => {
    const emojis = {
      flood: '🌊',
      earthquake: '🏚️',
      cyclone: '🌀',
      landslide: '⛰️',
      wildfire: '🔥',
      drought: '☀️',
      tsunami: '🌊',
      avalanche: '❄️'
    };
    return emojis[type] || '⚠️';
  };

  if (loading && disasters.length === 0) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Loading live disaster map...</p>
      </div>
    );
  }

  return (
    <div className="dynamic-map-view">
      {/* Map Header */}
      <div className="map-header">
        <div>
          <h1>🗺️ Live Disaster Map</h1>
          <p>{disasters.length} active disasters tracked across India</p>
        </div>
        <div className="map-controls">
          <button 
            className="btn-refresh" 
            onClick={fetchDisasters}
            title="Refresh data"
          >
            🔄 Refresh
          </button>
          <button 
            className="btn-toggle-sidebar" 
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? '◀ Hide' : '▶ Show'} List
          </button>
        </div>
      </div>

      <div className="map-container-wrapper">
        {/* Disaster List Sidebar */}
        {showSidebar && (
          <div className="disaster-sidebar">
            <h3>Active Disasters</h3>
            {disasters.length === 0 ? (
              <div className="no-disasters">
                <p>✅ No active disasters</p>
                <p className="text-small">All regions are currently safe</p>
              </div>
            ) : (
              <div className="disaster-list">
                {disasters.map((disaster) => (
                  <div
                    key={disaster.disaster_id}
                    className={`disaster-item ${selectedDisaster?.disaster_id === disaster.disaster_id ? 'selected' : ''} severity-${disaster.severity}`}
                    onClick={() => setSelectedDisaster(disaster)}
                  >
                    <div className="disaster-item-header">
                      <span className="disaster-emoji">{getDisasterEmoji(disaster.disaster_type)}</span>
                      <span className={`severity-badge badge-${disaster.severity}`}>
                        {disaster.severity.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="disaster-item-title">{disaster.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div className="map-wrapper">
          <MapContainer
            center={[20.5937, 78.9629]} // India center
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fly to selected disaster */}
            {selectedDisaster && <FlyToDisaster disaster={selectedDisaster} />}

            {/* Disaster Markers and Circles */}
            {disasters.map((disaster) => {
              if (!disaster.location?.coordinates?.latitude) return null;

              const position = [
                disaster.location.coordinates.latitude,
                disaster.location.coordinates.longitude
              ];
              const colors = getSeverityColor(disaster.severity);

              return (
                <React.Fragment key={disaster.disaster_id}>
                  {/* Affected Area Circle */}
                  <Circle
                    center={position}
                    radius={getRadiusInMeters(disaster.affected_radius_km)}
                    pathOptions={{
                      fillColor: colors.fill,
                      fillOpacity: 0.2,
                      color: colors.stroke,
                      weight: 2,
                      opacity: 0.8
                    }}
                  />

                  {/* Disaster Marker */}
                  <Marker
                    position={position}
                    icon={createDisasterIcon(disaster.disaster_type, disaster.severity)}
                    eventHandlers={{
                      click: () => setSelectedDisaster(disaster)
                    }}
                  >
                    <Popup>
                      <div className="disaster-popup">
                        <h3>{disaster.title}</h3>
                        <div className="popup-details">
                          <p><strong>Type:</strong> {disaster.disaster_type}</p>
                          <p><strong>Severity:</strong> <span className={`badge-${disaster.severity}`}>{disaster.severity}</span></p>
                          {disaster.affected_area_km2 && (
                            <p><strong>Affected Area:</strong> {disaster.affected_area_km2} km²</p>
                          )}
                          {disaster.injured > 0 && (
                            <p><strong>Injured:</strong> {disaster.injured}</p>
                          )}
                          <p className="popup-description">{disaster.description}</p>
                          {disaster.relief_prediction?.predicted && (
                            <div className="popup-relief">
                              <h4>Relief Requirements:</h4>
                              <ul>
                                <li>🍽️ Food: {formatNumber(disaster.relief_prediction.food_packets)} packets</li>
                                <li>💧 Water: {formatNumber(disaster.relief_prediction.water_liters)} liters</li>
                                <li>🏥 Medical Teams: {disaster.relief_prediction.medical_teams}</li>
                                <li>🏕️ Shelters: {disaster.relief_prediction.temporary_shelters}</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="map-legend">
            <h4>Severity Levels</h4>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#dc2626' }}></span>
              <span>Critical</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#f59e0b' }}></span>
              <span>High</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#eab308' }}></span>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#22c55e' }}></span>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicMapView;

