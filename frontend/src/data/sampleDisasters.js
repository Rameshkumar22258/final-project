/**
 * Sample Disasters Data
 * Used for demonstration when data mode is set to 'sample'
 */

export const SAMPLE_DISASTERS = [
  {
    _id: 'sample_flood_001',
    disaster_id: 'SAMPLE_FLOOD_001',
    title: 'Heavy Flooding in Mumbai Suburbs',
    disaster_type: 'flood',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      coordinates: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    severity: 'high',
    affected_area_km2: 150,
    casualties: 12,
    injured: 45,
    displaced: 5000,
    buildings_damaged: 200,
    status: 'active',
    description: 'Heavy monsoon rains causing severe flooding in Mumbai suburbs. Multiple areas waterlogged, traffic disrupted.',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    relief_prediction: {
      predicted: true,
      food_packets: 15000,
      water_liters: 50000,
      medical_teams: 5,
      rescue_personnel: 100,
      temporary_shelters: 100,
      financial_aid_inr: 125000000,
      confidence_score: 0.92,
      predicted_at: new Date()
    }
  },
  {
    _id: 'sample_earthquake_001',
    disaster_id: 'SAMPLE_EARTHQUAKE_001',
    title: 'Earthquake in Uttarakhand Region',
    disaster_type: 'earthquake',
    location: {
      city: 'Dehradun',
      state: 'Uttarakhand',
      district: 'Dehradun',
      coordinates: {
        latitude: 30.3165,
        longitude: 78.0322
      }
    },
    severity: 'critical',
    affected_area_km2: 50,
    casualties: 8,
    injured: 25,
    displaced: 2000,
    buildings_damaged: 150,
    status: 'active',
    description: 'Moderate earthquake (5.8 magnitude) detected in Uttarakhand region. Several buildings damaged, rescue operations ongoing.',
    detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    relief_prediction: {
      predicted: true,
      food_packets: 6000,
      water_liters: 20000,
      medical_teams: 8,
      rescue_personnel: 150,
      temporary_shelters: 40,
      financial_aid_inr: 50000000,
      confidence_score: 0.95,
      predicted_at: new Date()
    }
  },
  {
    _id: 'sample_cyclone_001',
    disaster_id: 'SAMPLE_CYCLONE_001',
    title: 'Cyclone Warning in Odisha Coast',
    disaster_type: 'cyclone',
    location: {
      city: 'Bhubaneswar',
      state: 'Odisha',
      district: 'Khordha',
      coordinates: {
        latitude: 20.2961,
        longitude: 85.8245
      }
    },
    severity: 'high',
    affected_area_km2: 300,
    casualties: 3,
    injured: 15,
    displaced: 10000,
    buildings_damaged: 500,
    status: 'active',
    description: 'Cyclonic storm approaching Odisha coast. Evacuation operations in progress. High wind speeds expected.',
    detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    relief_prediction: {
      predicted: true,
      food_packets: 30000,
      water_liters: 100000,
      medical_teams: 10,
      rescue_personnel: 200,
      temporary_shelters: 200,
      financial_aid_inr: 250000000,
      confidence_score: 0.88,
      predicted_at: new Date()
    }
  },
  {
    _id: 'sample_landslide_001',
    disaster_id: 'SAMPLE_LANDSLIDE_001',
    title: 'Landslide Blocks Highway in Himachal Pradesh',
    disaster_type: 'landslide',
    location: {
      city: 'Shimla',
      state: 'Himachal Pradesh',
      district: 'Shimla',
      coordinates: {
        latitude: 31.1048,
        longitude: 77.1734
      }
    },
    severity: 'medium',
    affected_area_km2: 5,
    casualties: 2,
    injured: 8,
    displaced: 500,
    buildings_damaged: 20,
    status: 'active',
    description: 'Major landslide blocks national highway in Himachal Pradesh. Road clearing operations underway.',
    detected_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    relief_prediction: {
      predicted: true,
      food_packets: 1500,
      water_liters: 5000,
      medical_teams: 2,
      rescue_personnel: 50,
      temporary_shelters: 10,
      financial_aid_inr: 12500000,
      confidence_score: 0.85,
      predicted_at: new Date()
    }
  },
  {
    _id: 'sample_drought_001',
    disaster_id: 'SAMPLE_DROUGHT_001',
    title: 'Severe Drought in Rajasthan',
    disaster_type: 'drought',
    location: {
      city: 'Jodhpur',
      state: 'Rajasthan',
      district: 'Jodhpur',
      coordinates: {
        latitude: 26.2389,
        longitude: 73.0243
      }
    },
    severity: 'high',
    affected_area_km2: 500,
    casualties: 0,
    injured: 0,
    displaced: 15000,
    buildings_damaged: 0,
    status: 'active',
    description: 'Severe drought conditions in Rajasthan. Water scarcity affecting multiple districts. Relief measures being implemented.',
    detected_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    relief_prediction: {
      predicted: true,
      food_packets: 45000,
      water_liters: 300000,
      medical_teams: 5,
      rescue_personnel: 50,
      temporary_shelters: 0,
      financial_aid_inr: 375000000,
      confidence_score: 0.90,
      predicted_at: new Date()
    }
  }
];

export const getSampleDisasters = () => {
  return SAMPLE_DISASTERS.map(disaster => ({
    ...disaster,
    toObject: () => disaster,
    toJSON: () => disaster
  }));
};

