import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import './MapView.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  useEffect(() => {
    // Sample disaster data
    const sampleDisasters = [
      {
        id: 1,
        type: 'flood',
        location: 'Mumbai, Maharashtra',
        coordinates: [19.0760, 72.8777],
        severity: 'high',
        affected: 125000,
        date: '2024-01-15',
        resources: {
          food: 1500,
          water: 50000,
          medical: 800,
          shelter: 2500
        }
      },
      {
        id: 2,
        type: 'cyclone',
        location: 'Gujarat Coast',
        coordinates: [21.5222, 70.4579],
        severity: 'critical',
        affected: 500000,
        date: '2024-01-18',
        resources: {
          food: 3000,
          water: 100000,
          medical: 2000,
          shelter: 8000
        }
      },
      {
        id: 3,
        type: 'earthquake',
        location: 'Delhi NCR',
        coordinates: [28.7041, 77.1025],
        severity: 'medium',
        affected: 50000,
        date: '2024-01-20',
        resources: {
          food: 800,
          water: 25000,
          medical: 1200,
          shelter: 1800
        }
      },
      {
        id: 4,
        type: 'flood',
        location: 'Assam',
        coordinates: [26.2006, 92.9376],
        severity: 'high',
        affected: 300000,
        date: '2024-01-19',
        resources: {
          food: 2000,
          water: 75000,
          medical: 1500,
          shelter: 5000
        }
      }
    ];

    setDisasters(sampleDisasters);
  }, []);

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#48bb78',
      medium: '#ecc94b',
      high: '#ed8936',
      critical: '#f56565'
    };
    return colors[severity] || colors.medium;
  };

  const getDisasterIcon = (type, severity) => {
    const color = getSeverityColor(severity);
    return L.divIcon({
      className: 'custom-disaster-icon',
      html: `
        <div style="
          background: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        ">⚠</div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  return (
    <div className="map-view-page">
      <div className="page-header">
        <h1>Disaster Map View</h1>
        <p>Visual representation of active disasters and affected regions</p>
      </div>

      <div className="map-container-wrapper">
        <div className="map-sidebar">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Active Disasters</h2>
              <span className="disaster-count">{disasters.length}</span>
            </div>
            <div className="card-body">
              <div className="disaster-list">
                {disasters.map(disaster => (
                  <div
                    key={disaster.id}
                    className={`disaster-list-item ${selectedDisaster?.id === disaster.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDisaster(disaster)}
                  >
                    <div className="disaster-marker-icon" style={{ background: getSeverityColor(disaster.severity) }}>
                      <FaExclamationTriangle />
                    </div>
                    <div className="disaster-info">
                      <h3>{disaster.type.toUpperCase()}</h3>
                      <p>{disaster.location}</p>
                      <span className={`severity-tag ${disaster.severity}`}>
                        {disaster.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedDisaster && (
            <div className="card selected-disaster-card">
              <div className="card-header">
                <h2 className="card-title">Disaster Details</h2>
              </div>
              <div className="card-body">
                <div className="disaster-details">
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className="value">{selectedDisaster.type.toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="value">{selectedDisaster.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Severity:</span>
                    <span className={`value severity-${selectedDisaster.severity}`}>
                      {selectedDisaster.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Affected:</span>
                    <span className="value">{selectedDisaster.affected.toLocaleString()} people</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(selectedDisaster.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="resources-section">
                    <h4>Required Resources</h4>
                    <div className="resource-grid">
                      <div className="resource-item">
                        <span className="resource-icon">🍚</span>
                        <span className="resource-value">{selectedDisaster.resources.food} tons</span>
                      </div>
                      <div className="resource-item">
                        <span className="resource-icon">💧</span>
                        <span className="resource-value">{selectedDisaster.resources.water.toLocaleString()}L</span>
                      </div>
                      <div className="resource-item">
                        <span className="resource-icon">💊</span>
                        <span className="resource-value">{selectedDisaster.resources.medical} people</span>
                      </div>
                      <div className="resource-item">
                        <span className="resource-icon">🏠</span>
                        <span className="resource-value">{selectedDisaster.resources.shelter} families</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="map-main">
          <MapContainer
            center={[22.5, 78.9]}
            zoom={5}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {disasters.map(disaster => (
              <React.Fragment key={disaster.id}>
                <Circle
                  center={disaster.coordinates}
                  radius={disaster.affected * 10}
                  pathOptions={{
                    color: getSeverityColor(disaster.severity),
                    fillColor: getSeverityColor(disaster.severity),
                    fillOpacity: 0.2
                  }}
                />
                <Marker
                  position={disaster.coordinates}
                  icon={getDisasterIcon(disaster.type, disaster.severity)}
                  eventHandlers={{
                    click: () => setSelectedDisaster(disaster)
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <h3>{disaster.type.toUpperCase()}</h3>
                      <p><strong>Location:</strong> {disaster.location}</p>
                      <p><strong>Severity:</strong> {disaster.severity}</p>
                      <p><strong>Affected:</strong> {disaster.affected.toLocaleString()} people</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapView;














