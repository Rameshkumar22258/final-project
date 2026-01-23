/**
 * Live Disasters API Routes
 * Provides real-time disaster data for frontend
 */

import express from 'express';
import Disaster from '../models/Disaster.js';

const router = express.Router();

/**
 * GET /api/disasters/latest
 * Get the most recent disaster
 */
router.get('/latest', async (req, res) => {
  try {
    const latest = await Disaster.getLatest();
    
    if (!latest) {
      return res.status(404).json({
        success: false,
        message: 'No active disasters found'
      });
    }
    
    res.json({
      success: true,
      data: latest
    });
  } catch (error) {
    console.error('Error fetching latest disaster:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest disaster',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/historical
 * Get historical disaster data from processed EM-DAT data and recent disasters
 */
router.get('/historical', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const dataDir = path.join(__dirname, '..', '..', 'ml_pipeline', 'data', 'historical');
    let allData = [];
    
    // Try to load multiple data sources and merge them
    const dataSources = [
      'india_historical_disasters_1950_2014.json',  // Historical disasters 1950-2014
      'recent_indian_disasters_processed.json',     // Recent disasters (2025, 2014-2025)
      'disasterIND_processed.json',                  // EM-DAT data
      'training_data_prepared.json'                  // Other prepared data
    ];
    
    for (const source of dataSources) {
      const dataPath = path.join(dataDir, source);
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
          // Handle different JSON structures
          let disasters = [];
          if (Array.isArray(data)) {
            disasters = data;
          } else if (data.india_historical_disasters_1950_2014 && Array.isArray(data.india_historical_disasters_1950_2014)) {
            disasters = data.india_historical_disasters_1950_2014;
          } else if (data.data && Array.isArray(data.data)) {
            disasters = data.data;
          }
          
          if (disasters.length > 0) {
            allData = allData.concat(disasters);
            console.log(`[OK] Loaded ${disasters.length} disasters from ${source}`);
          }
        } catch (e) {
          console.warn(`[WARN] Error loading ${source}: ${e.message}`);
        }
      }
    }
    
    // Remove duplicates based on disaster_name/name and date/year
    if (allData.length > 0) {
      const seen = new Set();
      const uniqueData = [];
      for (const disaster of allData) {
        const name = disaster.disaster_name || disaster.name || disaster.title || '';
        const date = disaster.date || disaster.year || '';
        const key = `${name}_${date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueData.push(disaster);
        }
      }
      allData = uniqueData;
    }
    
    if (allData.length > 0) {
      return res.json({
        success: true,
        count: allData.length,
        data: allData
      });
    } else {
      // Return empty array if no data found
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching historical data',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/active
 * Get all active disasters (within last 7 days)
 */
router.get('/active', async (req, res) => {
  try {
    const active = await Disaster.getActive();
    
    res.json({
      success: true,
      count: active.length,
      data: active
    });
  } catch (error) {
    console.error('Error fetching active disasters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active disasters',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/:id
 * Get specific disaster by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const disaster = await Disaster.findOne({ disaster_id: req.params.id });
    
    if (!disaster) {
      return res.status(404).json({
        success: false,
        message: 'Disaster not found'
      });
    }
    
    res.json({
      success: true,
      data: disaster
    });
  } catch (error) {
    console.error('Error fetching disaster:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disaster',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/type/:type
 * Get disasters by type
 */
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const disasters = await Disaster.find({ 
      disaster_type: type,
      status: 'active'
    }).sort({ detected_at: -1 });
    
    res.json({
      success: true,
      type: type,
      count: disasters.length,
      data: disasters
    });
  } catch (error) {
    console.error('Error fetching disasters by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disasters by type',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/severity/:level
 * Get disasters by severity level
 */
router.get('/severity/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const disasters = await Disaster.find({ 
      severity: level,
      status: 'active'
    }).sort({ detected_at: -1 });
    
    res.json({
      success: true,
      severity: level,
      count: disasters.length,
      data: disasters
    });
  } catch (error) {
    console.error('Error fetching disasters by severity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disasters by severity',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/state/:state
 * Get disasters by state
 */
router.get('/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const disasters = await Disaster.find({ 
      'location.state': new RegExp(state, 'i'),
      status: 'active'
    }).sort({ detected_at: -1 });
    
    res.json({
      success: true,
      state: state,
      count: disasters.length,
      data: disasters
    });
  } catch (error) {
    console.error('Error fetching disasters by state:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disasters by state',
      error: error.message
    });
  }
});

/**
 * GET /api/disasters/stats
 * Get disaster statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const activeDisasters = await Disaster.getActive();
    
    // Calculate statistics
    const stats = {
      total_active: activeDisasters.length,
      by_type: {},
      by_severity: {},
      by_state: {},
      total_affected: 0,
      total_casualties: 0
    };
    
    activeDisasters.forEach(disaster => {
      // By type
      if (disaster.disaster_type) {
        stats.by_type[disaster.disaster_type] = (stats.by_type[disaster.disaster_type] || 0) + 1;
      }
      
      // By severity
      if (disaster.severity) {
        stats.by_severity[disaster.severity] = (stats.by_severity[disaster.severity] || 0) + 1;
      }
      
      // By state
      if (disaster.location && disaster.location.state) {
        const state = disaster.location.state;
        stats.by_state[state] = (stats.by_state[state] || 0) + 1;
      }
      
      // Totals
      stats.total_affected += disaster.displaced || 0;
      stats.total_casualties += disaster.casualties || 0;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error calculating disaster stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating disaster stats',
      error: error.message
    });
  }
});

/**
 * POST /api/disasters/create-sample
 * Create sample active disasters for testing
 */
router.post('/create-sample', async (req, res) => {
  try {
    const sampleDisasters = [
      {
        disaster_id: 'SAMPLE_FLOOD_001',
        title: 'Heavy Flooding in Mumbai',
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
        description: 'Heavy monsoon rains causing flooding in Mumbai suburbs',
        detected_at: new Date() // Current date, so it's within 7 days
      },
      {
        disaster_id: 'SAMPLE_EARTHQUAKE_001',
        title: 'Earthquake in Uttarakhand',
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
        description: 'Moderate earthquake detected in Uttarakhand region',
        detected_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        disaster_id: 'SAMPLE_CYCLONE_001',
        title: 'Cyclone Warning in Odisha',
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
        description: 'Cyclonic storm approaching Odisha coast',
        detected_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        disaster_id: 'SAMPLE_LANDSLIDE_001',
        title: 'Landslide in Himachal Pradesh',
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
        description: 'Landslide blocks major highway in Himachal Pradesh',
        detected_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];

    const created = [];
    for (const disasterData of sampleDisasters) {
      // Check if already exists
      const existing = await Disaster.findOne({ disaster_id: disasterData.disaster_id });
      if (!existing) {
        const disaster = new Disaster(disasterData);
        await disaster.save();
        created.push(disaster);
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${created.length} sample disasters`,
      data: created
    });
  } catch (error) {
    console.error('Error creating sample disasters:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample disasters',
      error: error.message
    });
  }
});

/**
 * POST /api/disasters/create
 * Create a new disaster record (from news collector)
 */
router.post('/create', async (req, res) => {
  try {
    const disasterData = req.body;
    
    // Check if disaster already exists
    const existing = await Disaster.findOne({ disaster_id: disasterData.disaster_id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Disaster already exists'
      });
    }
    
    const disaster = new Disaster(disasterData);
    await disaster.save();
    
    res.status(201).json({
      success: true,
      message: 'Disaster created successfully',
      data: disaster
    });
  } catch (error) {
    console.error('Error creating disaster:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating disaster',
      error: error.message
    });
  }
});

/**
 * PUT /api/disasters/:id/update
 * Update disaster information
 */
router.put('/:id/update', async (req, res) => {
  try {
    const disaster = await Disaster.findOneAndUpdate(
      { disaster_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!disaster) {
      return res.status(404).json({
        success: false,
        message: 'Disaster not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Disaster updated successfully',
      data: disaster
    });
  } catch (error) {
    console.error('Error updating disaster:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating disaster',
      error: error.message
    });
  }
});

/**
 * PUT /api/disasters/:id/relief-prediction
 * Add relief prediction to disaster
 */
router.put('/:id/relief-prediction', async (req, res) => {
  try {
    const { prediction } = req.body;
    
    const disaster = await Disaster.findOneAndUpdate(
      { disaster_id: req.params.id },
      { 
        relief_prediction: {
          ...prediction,
          predicted: true,
          predicted_at: new Date()
        }
      },
      { new: true }
    );
    
    if (!disaster) {
      return res.status(404).json({
        success: false,
        message: 'Disaster not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Relief prediction added successfully',
      data: disaster
    });
  } catch (error) {
    console.error('Error adding relief prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding relief prediction',
      error: error.message
    });
  }
});

export default router;

