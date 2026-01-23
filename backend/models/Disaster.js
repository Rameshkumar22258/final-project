/**
 * Disaster Model
 * Stores live disaster information
 */

import mongoose from 'mongoose';

const DisasterSchema = new mongoose.Schema({
  // Identification
  disaster_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Information
  title: {
    type: String,
    required: true
  },
  
  disaster_type: {
    type: String,
    required: true,
    enum: ['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche', 'other'],
    index: true
  },
  
  // Location
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    district: String,
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  
  // Severity
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  
  // Impact Details
  affected_area_km2: Number,
  affected_radius_km: Number,
  casualties: { type: Number, default: 0 },
  injured: { type: Number, default: 0 },
  displaced: { type: Number, default: 0 },
  buildings_damaged: Number,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'monitoring', 'resolved', 'archived'],
    default: 'active',
    index: true
  },
  
  // Source Information
  source: {
    type: { type: String, default: 'news_api' },
    url: String,
    published_at: Date,
    author: String
  },
  
  // Content
  description: String,
  content: String,
  
  // Metadata
  relevance_score: {
    type: Number,
    min: 0,
    max: 100
  },
  
  search_keyword: String,
  
  // Relief Prediction (populated after prediction)
  relief_prediction: {
    predicted: { type: Boolean, default: false },
    food_packets: Number,
    water_liters: Number,
    medical_teams: Number,
    rescue_personnel: Number,
    temporary_shelters: Number,
    financial_aid_inr: Number,
    confidence_score: Number,
    predicted_at: Date
  },
  
  // Timestamps
  detected_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
DisasterSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });
DisasterSchema.index({ detected_at: -1 });
DisasterSchema.index({ status: 1, detected_at: -1 });

// Virtual for age in hours
DisasterSchema.virtual('age_hours').get(function() {
  return Math.round((Date.now() - this.detected_at) / (1000 * 60 * 60));
});

// Method to check if disaster is recent (within 7 days)
DisasterSchema.methods.isRecent = function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.detected_at > sevenDaysAgo;
};

// Method to calculate severity level as number
DisasterSchema.methods.getSeverityLevel = function() {
  const levels = { critical: 4, high: 3, medium: 2, low: 1 };
  return levels[this.severity] || 0;
};

// Static method to get active disasters
DisasterSchema.statics.getActive = function() {
  return this.find({ 
    status: 'active',
    detected_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).sort({ detected_at: -1 });
};

// Static method to get latest disaster
DisasterSchema.statics.getLatest = function() {
  return this.findOne({ status: 'active' })
    .sort({ detected_at: -1 });
};

// Update timestamp on save
DisasterSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model('Disaster', DisasterSchema);

