/**
 * Relief Prediction API Routes
 * Handles ML-based relief requirement predictions
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import Disaster from '../models/Disaster.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/relief/predict
 * Generate relief prediction for a disaster
 */
router.post('/predict', async (req, res) => {
  try {
    const {
      disaster_id,
      disaster_type,
      location,
      severity,
      affected_population,
      affected_area_km2
    } = req.body;

    // Validate required fields
    if (!disaster_type || !location || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: disaster_type, location, severity'
      });
    }

    // Prepare prediction data with location coordinates and new fields
    const predictionData = {
      disaster_type,
      disaster_subtype: req.body.disaster_subtype || null, // e.g., 'urban', 'riverine', 'flash', 'coastal'
      location: location.city || location,
      state: location.state || '',
      severity,
      affected_population: affected_population || 2500,
      affected_area_km2: affected_area_km2 || 50,
      exposure_ratio: req.body.exposure_ratio || null, // Will be calculated if not provided
      disruption_duration: req.body.disruption_duration || null, // Will be calculated if not provided
      terrain: req.body.terrain || null, // e.g., 'coastal', 'hilly', 'urban', 'rural'
      admin_capacity: req.body.admin_capacity || null, // District capacity limits
      latitude: location.coordinates?.latitude || (typeof location === 'object' ? location.latitude : 20.0),
      longitude: location.coordinates?.longitude || (typeof location === 'object' ? location.longitude : 75.0)
    };

    // Try Python ML prediction first, fallback to rule-based
    let prediction;
    try {
      console.log('Attempting Python ML prediction...');
      prediction = await executePythonPrediction(predictionData);
      console.log('✓ Python ML prediction successful, method:', prediction.method);
    } catch (error) {
      console.warn('⚠️ Python prediction failed, using rule-based fallback:', error.message);
      prediction = ruleBasedPrediction(predictionData);
    }

    // Update disaster record with prediction
    if (disaster_id) {
      await Disaster.findOneAndUpdate(
        { disaster_id },
        {
          relief_prediction: {
            ...prediction,
            predicted: true,
            predicted_at: new Date()
          }
        }
      );
    }

    res.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Relief prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate relief prediction',
      message: error.message
    });
  }
});

/**
 * GET /api/relief/predict/:disaster_id
 * Get relief prediction for specific disaster
 */
router.get('/predict/:disaster_id', async (req, res) => {
  try {
    const disaster = await Disaster.findOne({ disaster_id: req.params.disaster_id });

    if (!disaster) {
      return res.status(404).json({
        success: false,
        error: 'Disaster not found'
      });
    }

    if (!disaster.relief_prediction || !disaster.relief_prediction.predicted) {
      return res.status(404).json({
        success: false,
        error: 'No relief prediction available for this disaster'
      });
    }

    res.json({
      success: true,
      prediction: disaster.relief_prediction,
      disaster: {
        id: disaster.disaster_id,
        type: disaster.disaster_type,
        location: disaster.location,
        severity: disaster.severity
      }
    });

  } catch (error) {
    console.error('Error fetching relief prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relief prediction',
      message: error.message
    });
  }
});

/**
 * Execute Python prediction script with proper error handling and timeout
 */
function executePythonPrediction(data) {
  return new Promise((resolve, reject) => {
    // PRIORITY: Use ML predictor with geographic matching
    // This uses ML models trained on actual data, with geographic matching for unknown locations
    let scriptPath = path.join(__dirname, '..', '..', 'ml_pipeline', 'models', 'ml_relief_predictor.py');
    
    // Fallback to predictor with actual data
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(__dirname, '..', '..', 'ml_pipeline', 'models', 'relief_predictor_with_actual_data.py');
    }
    
    // Final fallback to regular predictor
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(__dirname, '..', '..', 'ml_pipeline', 'models', 'relief_predictor.py');
    }
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.log(`Python script not found at: ${scriptPath}`);
      reject(new Error('Python prediction script not found'));
      return;
    }

    console.log(`Executing Python script: ${scriptPath}`);
    
    // Write JSON to temp file (more reliable than command-line args on Windows)
    const tempFile = path.join(os.tmpdir(), `relief_prediction_${Date.now()}.json`);
    const jsonData = JSON.stringify(data);
    // Write without BOM (Python doesn't like UTF-8 BOM)
    fs.writeFileSync(tempFile, jsonData, { encoding: 'utf8', flag: 'w' });
    
    // Debug: Log temp file content
    console.log(`Temp file created: ${tempFile}`);
    console.log(`Temp file content: ${jsonData.substring(0, 200)}...`);
    
    // Spawn Python process with temp file path
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const python = spawn(pythonCmd, [scriptPath, tempFile], {
      shell: true // Use shell on Windows for better compatibility
    });
    
    let dataString = '';
    let errorString = '';
    let timeoutId;
    
    // Set timeout (15 seconds - Python may need time to load models)
    timeoutId = setTimeout(() => {
      python.kill();
      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch (e) {}
      reject(new Error('Python prediction timeout (15s exceeded)'));
    }, 15000);
    
    python.stdout.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      dataString += chunkStr;
      console.log(`Python stdout: ${chunkStr.substring(0, 300)}`);
    });
    
    python.stderr.on('data', (chunk) => {
      const errorChunk = chunk.toString();
      errorString += errorChunk;
      // Log all stderr for debugging (Python outputs warnings to stderr)
      console.log(`Python stderr: ${errorChunk.substring(0, 300)}`);
    });
    
    python.on('close', (code) => {
      clearTimeout(timeoutId);
      
      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch (e) {}
      
      if (code !== 0) {
        // Python script failed
        const errorMsg = errorString || 'Unknown error';
        console.error(`Python script failed (code ${code}): ${errorMsg.substring(0, 500)}`);
        reject(new Error(`Python script exited with code ${code}: ${errorMsg.substring(0, 200)}`));
        return;
      }
      
      // Try to parse JSON output
      // Python may output warnings before/after JSON, so extract JSON line
      try {
        let jsonString = dataString.trim();
        
        // Try to find JSON object in output (might be mixed with warnings)
        // Look for the last complete JSON object (Python outputs warnings first, then JSON)
        const jsonMatches = jsonString.match(/\{[^{}]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Use the last match (most likely the actual result)
          jsonString = jsonMatches[jsonMatches.length - 1];
        } else {
          // Try multiline JSON match
          const multilineMatch = jsonString.match(/\{[\s\S]*\}/);
          if (multilineMatch) {
            jsonString = multilineMatch[0];
          }
        }
        
        if (!jsonString || jsonString.trim().length === 0) {
          throw new Error('No JSON output found in Python stdout');
        }
        
        const result = JSON.parse(jsonString);
        
        // Check if result has error field
        if (result.error) {
          reject(new Error(result.error));
          return;
        }
        
        // Validate prediction structure
        if (!result.food_packets && !result.water_liters) {
          reject(new Error('Invalid prediction result from Python script'));
          return;
        }
        
        resolve(result);
      } catch (parseError) {
        // If parsing fails, check if there's useful error info
        // Check if errorString contains actual errors (not just warnings)
        const hasRealError = errorString.toLowerCase().includes('error') && 
                            !errorString.toLowerCase().includes('warning') &&
                            !errorString.toLowerCase().includes('userwarning');
        
        if (hasRealError) {
          reject(new Error(`Python script error: ${errorString.substring(0, 200)}`));
        } else {
          // Try to extract JSON from errorString if stdout parsing failed
          const errorJsonMatch = errorString.match(/\{[\s\S]*\}/);
          if (errorJsonMatch) {
            try {
              const result = JSON.parse(errorJsonMatch[0]);
              if (result.error) {
                reject(new Error(result.error));
              } else {
                resolve(result);
              }
            } catch (e) {
              reject(new Error(`Failed to parse Python output. stdout: ${dataString.substring(0, 200)}`));
            }
          } else {
            reject(new Error(`Failed to parse Python output. stdout: ${dataString.substring(0, 200)}`));
          }
        }
      }
    });
    
    python.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * Rule-based prediction with exposure ratios, capacity constraints, and bounded functions
 * Prevents overestimation by using realistic exposure ratios and admin capacity limits
 */
function ruleBasedPrediction(data) {
  // Handle both object and string inputs
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  const {
    disaster_type,
    disaster_subtype,
    severity,
    affected_population,
    affected_area_km2,
    exposure_ratio,
    disruption_duration,
    terrain,
    admin_capacity
  } = parsed;

  // 1. Calculate exposure ratio if not provided
  const exposureRatios = {
    low: 0.20,      // 15-25% range, use 20%
    medium: 0.375,  // 30-45% range, use 37.5%
    high: 0.525,    // 45-60% range, use 52.5%
    critical: 0.70  // 60-80% range, use 70%
  };
  const effectiveExposureRatio = exposure_ratio || exposureRatios[severity] || exposureRatios.medium;

  // 2. Calculate disruption duration if not provided
  const durationBySeverity = {
    low: 1.5,      // 1-2 days
    medium: 3,     // 2-4 days
    high: 4.5,     // 3-6 days
    critical: 10.5 // 7-14 days
  };
  const duration = disruption_duration || durationBySeverity[severity] || durationBySeverity.medium;

  // 3. Calculate directly exposed population
  const totalAffected = affected_population || 2500;
  const directlyExposed = Math.round(totalAffected * effectiveExposureRatio);

  // 4. Disaster sub-type modifiers (for all disaster types)
  const subtypeModifiers = {
    flood: {
      urban: { food: 1.0, shelter: 0.3, medical: 1.0, water: 0.8 },
      riverine: { food: 1.2, shelter: 1.0, medical: 1.0, water: 1.2 },
      flash: { food: 1.5, shelter: 1.5, medical: 1.3, water: 1.0 },
      coastal: { food: 1.0, shelter: 0.7, medical: 0.9, water: 1.0 },
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    earthquake: {
      shallow: { food: 1.2, shelter: 1.3, medical: 1.4, water: 1.1 }, // <70km depth, more surface damage
      deep: { food: 0.9, shelter: 0.8, medical: 0.9, water: 0.9 }, // >70km depth, less surface impact
      tectonic: { food: 1.1, shelter: 1.2, medical: 1.2, water: 1.0 }, // Plate boundary, widespread
      volcanic: { food: 1.3, shelter: 1.4, medical: 1.5, water: 1.3 }, // Volcanic activity, high medical need
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    cyclone: {
      tropical: { food: 1.1, shelter: 1.2, medical: 1.1, water: 1.1 }, // Standard tropical cyclone
      extratropical: { food: 0.9, shelter: 0.9, medical: 0.9, water: 0.9 }, // Weaker, cooler
      super: { food: 1.5, shelter: 1.6, medical: 1.4, water: 1.3 }, // Category 4-5, extreme
      depression: { food: 0.7, shelter: 0.6, medical: 0.7, water: 0.8 }, // Weak system
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    landslide: {
      rockfall: { food: 0.8, shelter: 0.7, medical: 1.2, water: 0.8 }, // Localized, high trauma
      mudslide: { food: 1.3, shelter: 1.4, medical: 1.1, water: 1.2 }, // Widespread, high shelter need
      debris_flow: { food: 1.4, shelter: 1.5, medical: 1.3, water: 1.1 }, // Fast-moving, destructive
      rotational: { food: 1.1, shelter: 1.2, medical: 1.0, water: 1.0 }, // Slower, predictable
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    wildfire: {
      forest: { food: 1.2, shelter: 1.3, medical: 1.1, water: 1.4 }, // Large area, high water need
      grassland: { food: 0.9, shelter: 0.8, medical: 0.9, water: 1.2 }, // Smaller impact
      urban: { food: 1.4, shelter: 1.5, medical: 1.3, water: 1.3 }, // Urban interface, high density
      interface: { food: 1.3, shelter: 1.4, medical: 1.2, water: 1.3 }, // Wildland-urban interface
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    drought: {
      meteorological: { food: 1.0, shelter: 0.5, medical: 0.8, water: 1.5 }, // Low rainfall, high water need
      agricultural: { food: 1.3, shelter: 0.4, medical: 0.7, water: 1.6 }, // Crop failure, food crisis
      hydrological: { food: 1.2, shelter: 0.5, medical: 0.9, water: 1.8 }, // Water shortage, critical
      socioeconomic: { food: 1.4, shelter: 0.6, medical: 1.0, water: 1.7 }, // Economic impact, food aid
      default: { food: 1.0, shelter: 0.5, medical: 0.8, water: 1.5 }
    },
    tsunami: {
      tectonic: { food: 1.2, shelter: 1.3, medical: 1.4, water: 1.1 }, // Earthquake-triggered, widespread
      volcanic: { food: 1.3, shelter: 1.4, medical: 1.5, water: 1.2 }, // Volcanic activity, high medical
      landslide_triggered: { food: 1.1, shelter: 1.2, medical: 1.3, water: 1.0 }, // Localized but intense
      meteorite: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }, // Rare, standard response
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    },
    avalanche: {
      slab: { food: 0.9, shelter: 0.8, medical: 1.3, water: 0.7 }, // Large, high rescue need
      powder: { food: 0.7, shelter: 0.6, medical: 1.1, water: 0.6 }, // Fast, localized
      wet: { food: 1.0, shelter: 0.9, medical: 1.2, water: 0.8 }, // Heavy, slower
      icefall: { food: 0.8, shelter: 0.7, medical: 1.4, water: 0.7 }, // Very localized, high trauma
      default: { food: 1.0, shelter: 1.0, medical: 1.0, water: 1.0 }
    }
  };

  // Get appropriate modifier based on disaster type and sub-type
  const disasterModifiers = subtypeModifiers[disaster_type] || subtypeModifiers.flood;
  const subtypeMod = disaster_subtype && disasterModifiers[disaster_subtype]
    ? disasterModifiers[disaster_subtype]
    : disasterModifiers.default;

  // 5. Base requirements per exposed person per day (REALISTIC - not 3 meals!)
  const mealsPerDay = 1.75; // Realistic: 1.5-2 meals per day, not 3
  const baseRequirements = {
    flood: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 8, 
      medical_ratio: 0.008, 
      shelter_ratio: 0.35  // Only 30-40% need shelter, not 50%
    },
    earthquake: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 12, 
      medical_ratio: 0.015, 
      shelter_ratio: 0.65  // Higher shelter need
    },
    cyclone: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 10, 
      medical_ratio: 0.012, 
      shelter_ratio: 0.55
    },
    landslide: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 8, 
      medical_ratio: 0.020, 
      shelter_ratio: 0.45
    },
    wildfire: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 6, 
      medical_ratio: 0.010, 
      shelter_ratio: 0.30
    },
    drought: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 15, 
      medical_ratio: 0.004, 
      shelter_ratio: 0.08  // Very low shelter need
    },
    tsunami: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 12, 
      medical_ratio: 0.025, 
      shelter_ratio: 0.75
    },
    avalanche: { 
      food_ratio: mealsPerDay, 
      water_liters_per_day: 8, 
      medical_ratio: 0.015, 
      shelter_ratio: 0.40
    }
  };

  const base = baseRequirements[disaster_type] || baseRequirements.flood;

  // 6. Calculate raw demand
  const rawFoodPackets = Math.round(directlyExposed * base.food_ratio * duration * subtypeMod.food);
  const rawWaterLiters = Math.round(directlyExposed * base.water_liters_per_day * duration * subtypeMod.water);
  const rawMedicalTeams = Math.max(1, Math.round(directlyExposed * base.medical_ratio * subtypeMod.medical));
  const rawRescuePersonnel = Math.max(10, Math.round(directlyExposed * 0.015)); // 1.5% need rescue
  const rawShelters = Math.round(directlyExposed * base.shelter_ratio * subtypeMod.shelter / 50); // 50 people per shelter
  const rawFinancialAid = Math.round(directlyExposed * 20000); // ₹20k per exposed person (not per affected)

  // 7. District capacity constraints (realistic upper bounds)
  const capacityLimits = admin_capacity || {
    food_packets_per_day: 40000,      // 20k-60k range, use 40k
    water_liters_per_day: 1200000,    // 0.5-2M range, use 1.2M
    medical_teams_max: 200,            // 50-300 range, use 200
    rescue_personnel_max: 2000,        // 500-3000 range, use 2000
    relief_camps_max: 400              // 100-600 range, use 400
  };

  // 8. Calculate per-day requirements (before capacity constraints)
  const foodPacketsPerDay = Math.round(directlyExposed * base.food_ratio * subtypeMod.food);
  const waterLitersPerDay = Math.round(directlyExposed * base.water_liters_per_day * subtypeMod.water);
  
  // 9. Apply bounded functions: min(demand, capacity × duration)
  const foodPackets = Math.min(
    rawFoodPackets,
    capacityLimits.food_packets_per_day * duration
  );
  
  const waterLiters = Math.min(
    rawWaterLiters,
    capacityLimits.water_liters_per_day * duration
  );
  
  // Calculate per-day after capacity constraints
  const foodPacketsPerDayBounded = Math.min(
    foodPacketsPerDay,
    capacityLimits.food_packets_per_day
  );
  
  const waterLitersPerDayBounded = Math.min(
    waterLitersPerDay,
    capacityLimits.water_liters_per_day
  );
  
  // Generate per-day breakdown array
  const perDayBreakdown = [];
  for (let day = 1; day <= Math.ceil(duration); day++) {
    perDayBreakdown.push({
      day: day,
      food_packets: foodPacketsPerDayBounded,
      water_liters: waterLitersPerDayBounded,
      cumulative_food: Math.min(foodPacketsPerDayBounded * day, foodPackets),
      cumulative_water: Math.min(waterLitersPerDayBounded * day, waterLiters)
    });
  }
  
  const medicalTeams = Math.min(
    rawMedicalTeams,
    capacityLimits.medical_teams_max
  );
  
  const rescuePersonnel = Math.min(
    rawRescuePersonnel,
    capacityLimits.rescue_personnel_max
  );
  
  const temporaryShelters = Math.min(
    rawShelters,
    capacityLimits.relief_camps_max
  );

  // 9. Phased prediction breakdown
  const phases = {
    phase1_days_0_1: {
      food_packets: Math.round(foodPackets * 0.15),  // 15% in first 2 days
      water_liters: Math.round(waterLiters * 0.20),  // 20% in first 2 days
      rescue_personnel: Math.round(rescuePersonnel * 0.80), // 80% in first 2 days
      medical_teams: Math.round(medicalTeams * 0.30)  // 30% in first 2 days
    },
    phase2_days_2_4: {
      food_packets: Math.round(foodPackets * 0.40),  // 40% in days 2-4
      water_liters: Math.round(waterLiters * 0.45),  // 45% in days 2-4
      medical_teams: Math.round(medicalTeams * 0.50)  // 50% in days 2-4
    },
    phase3_days_5_7: {
      food_packets: Math.round(foodPackets * 0.30),  // 30% in days 5-7
      water_liters: Math.round(waterLiters * 0.25),  // 25% in days 5-7
      medical_teams: Math.round(medicalTeams * 0.20)  // 20% in days 5-7
    },
    phase4_days_7_plus: {
      food_packets: Math.round(foodPackets * 0.15),  // 15% after day 7
      financial_aid_inr: rawFinancialAid              // Financial aid peaks later
    }
  };

  // Calculation steps for display
  const calculationSteps = [
    {
      step: 1,
      description: 'Calculate Exposure Ratio',
      value: `${(effectiveExposureRatio * 100).toFixed(1)}%`,
      detail: `Based on ${severity} severity level`
    },
    {
      step: 2,
      description: 'Calculate Directly Exposed Population',
      value: directlyExposed.toLocaleString(),
      detail: `${totalAffected.toLocaleString()} affected × ${(effectiveExposureRatio * 100).toFixed(1)}% exposure`
    },
    {
      step: 3,
      description: 'Determine Disruption Duration',
      value: `${Math.round(duration)} days`,
      detail: `Based on ${severity} severity level`
    },
    {
      step: 4,
      description: 'Calculate Base Requirements',
      value: `${base.food_ratio} meals/day, ${base.water_liters_per_day}L water/day`,
      detail: `Per exposed person for ${disaster_type}`
    },
    {
      step: 5,
      description: 'Apply Sub-Type Modifiers',
      value: disaster_subtype || 'Standard',
      detail: `Food: ${subtypeMod.food}×, Shelter: ${subtypeMod.shelter}×, Medical: ${subtypeMod.medical}×, Water: ${subtypeMod.water}×`
    },
    {
      step: 6,
      description: 'Calculate Raw Demand',
      value: `${rawFoodPackets.toLocaleString()} food, ${rawWaterLiters.toLocaleString()}L water`,
      detail: `Before capacity constraints`
    },
    {
      step: 7,
      description: 'Apply Capacity Constraints',
      value: `${capacityLimits.food_packets_per_day.toLocaleString()}/day food, ${(capacityLimits.water_liters_per_day / 1000).toFixed(0)}kL/day water`,
      detail: `District capacity limits applied`
    },
    {
      step: 8,
      description: 'Generate Final Bounded Predictions',
      value: `${foodPackets.toLocaleString()} food, ${(waterLiters / 1000).toFixed(0)}kL water`,
      detail: `Final deployable quantities`
    }
  ];

  return {
    food_packets: foodPackets,
    water_liters: waterLiters,
    food_packets_per_day: foodPacketsPerDayBounded,
    water_liters_per_day: waterLitersPerDayBounded,
    per_day_breakdown: perDayBreakdown,
    medical_teams: medicalTeams,
    rescue_personnel: rescuePersonnel,
    temporary_shelters: temporaryShelters,
    financial_aid_inr: rawFinancialAid,
    confidence_score: 0.72, // Higher confidence with bounded functions
    method: 'rule_based_bounded',
    duration_days: Math.round(duration),
    exposure_ratio_used: effectiveExposureRatio,
    directly_exposed_population: directlyExposed,
    capacity_constraints_applied: true,
    calculation_steps: calculationSteps,
    phases: phases,
    metadata: {
      total_affected: totalAffected,
      exposure_ratio: effectiveExposureRatio,
      disaster_subtype: disaster_subtype || 'standard',
      terrain: terrain || 'unknown',
      raw_demand: {
        food_packets: rawFoodPackets,
        water_liters: rawWaterLiters
      },
      capacity_limits: capacityLimits
    }
  };
}

export default router;












