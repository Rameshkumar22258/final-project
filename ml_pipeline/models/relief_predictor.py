"""
Relief Prediction Model
Predicts relief requirements using trained ML models
"""

import sys
import json
import pickle
import numpy as np
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

class ReliefPredictor:
    def __init__(self):
        self.models_loaded = False
        self.models = {}
        self.load_models()
    
    def load_models(self):
        """Load trained models or use fallback"""
        try:
            import joblib
            
            model_dir = Path(__file__).parent / 'trained'
            if model_dir.exists():
                # Load trained models for each resource type
                model_files = {
                    'food': 'relief_food_packets_model.pkl',
                    'water': 'relief_water_liters_model.pkl',
                    'medical': 'relief_medical_teams_model.pkl',
                    'shelter': 'relief_shelters_model.pkl',
                    'financial': 'relief_financial_aid_inr_model.pkl'
                }
                
                for resource, filename in model_files.items():
                    model_path = model_dir / filename
                    if model_path.exists():
                        self.models[resource] = joblib.load(model_path)
                
                # Load scaler and encoders
                scaler_path = model_dir / 'feature_scaler.pkl'
                if scaler_path.exists():
                    self.scaler = joblib.load(scaler_path)
                
                encoders_path = model_dir / 'encoders.pkl'
                if encoders_path.exists():
                    self.encoders = joblib.load(encoders_path)
                
                if len(self.models) > 0:
                    self.models_loaded = True
                    print(f"✓ Loaded {len(self.models)} trained ML models", file=sys.stderr)
                else:
                    print(f"⚠️ No trained models found, using rule-based", file=sys.stderr)
                    self.scaler = None
                    self.encoders = {}
        except Exception as e:
            print(f"⚠️ Failed to load models: {e}", file=sys.stderr)
            self.models_loaded = False
            self.scaler = None
            self.encoders = {}
    
    def extract_features(self, data):
        """Extract features for prediction (must match training features!)"""
        features = {}
        
        # Disaster type encoding
        disaster_types = ['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche']
        features['disaster_type_encoded'] = disaster_types.index(data['disaster_type']) if data['disaster_type'] in disaster_types else 0
        
        # Severity encoding
        severity_map = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        features['severity_encoded'] = severity_map.get(data['severity'], 1)
        
        # Area
        features['affected_area_km2'] = data.get('affected_area_km2', 50)
        
        # Population metrics
        features['displaced'] = data.get('affected_population', 2500)
        features['casualties'] = data.get('casualties', 0)
        
        # Location (lat/lng for geographic features)
        features['latitude'] = data.get('latitude', 20.0)
        features['longitude'] = data.get('longitude', 75.0)
        
        # Temporal features
        import datetime
        month = data.get('month', datetime.datetime.now().month)
        features['month'] = month
        
        # Season (India): 0=Winter, 1=Summer, 2=Monsoon, 3=Post-monsoon
        if month in [12, 1, 2]:
            features['season'] = 0
        elif month in [3, 4, 5]:
            features['season'] = 1
        elif month in [6, 7, 8, 9]:
            features['season'] = 2
        else:
            features['season'] = 3
        
        return features
    
    def predict(self, data):
        """Generate relief prediction"""
        features = self.extract_features(data)
        
        if self.models_loaded:
            # Use ML models
            return self.ml_prediction(features)
        else:
            # Use rule-based fallback
            return self.rule_based_prediction(data)
    
    def ml_prediction(self, features):
        """ML-based prediction using trained models"""
        try:
            # Convert features to array (must match training order!)
            # Order: disaster_type_encoded, severity_encoded, affected_area_km2, 
            #        displaced, casualties, latitude, longitude, month, season
            feature_array = np.array([[
                features['disaster_type_encoded'],
                features['severity_encoded'],
                features['affected_area_km2'],
                features['displaced'],
                features['casualties'],
                features['latitude'],
                features['longitude'],
                features['month'],
                features['season']
            ]])
            
            # Scale features if scaler available
            if self.scaler is not None:
                feature_array = self.scaler.transform(feature_array)
            
            predictions = {}
            for resource, model in self.models.items():
                pred_value = model.predict(feature_array)[0]
                predictions[resource] = int(max(0, pred_value))  # Ensure non-negative
            
            return {
                'food_packets': predictions.get('relief_food_packets', predictions.get('food', 0)),
                'water_liters': predictions.get('relief_water_liters', predictions.get('water', 0)),
                'medical_teams': predictions.get('relief_medical_teams', predictions.get('medical', 0)),
                'rescue_personnel': max(10, int(features['displaced'] * 0.02)),
                'temporary_shelters': predictions.get('relief_shelters', predictions.get('shelter', 0)),
                'financial_aid_inr': predictions.get('relief_financial_aid_inr', predictions.get('financial', 0)),
                'confidence_score': 0.93,  # Updated based on training results
                'method': 'ml_model'
            }
        except Exception as e:
            print(f"ML prediction error: {e}", file=sys.stderr)
            return self.rule_based_prediction({'affected_population': features['displaced']})
    
    def rule_based_prediction(self, data):
        """Rule-based prediction with exposure ratios and capacity constraints"""
        disaster_type = data.get('disaster_type', 'flood')
        disaster_subtype = data.get('disaster_subtype')
        severity = data.get('severity', 'medium')
        total_affected = data.get('affected_population', 2500)
        exposure_ratio = data.get('exposure_ratio')
        disruption_duration = data.get('disruption_duration')
        admin_capacity = data.get('admin_capacity')
        
        # 1. Calculate exposure ratio if not provided
        exposure_ratios = {
            'low': 0.20,
            'medium': 0.375,
            'high': 0.525,
            'critical': 0.70
        }
        effective_exposure = exposure_ratio or exposure_ratios.get(severity, 0.375)
        
        # 2. Calculate disruption duration if not provided
        duration_by_severity = {
            'low': 1.5,
            'medium': 3.0,
            'high': 4.5,
            'critical': 10.5
        }
        duration = disruption_duration or duration_by_severity.get(severity, 3.0)
        
        # 3. Calculate directly exposed population
        directly_exposed = int(total_affected * effective_exposure)
        
        # 4. Disaster sub-type modifiers (for all disaster types)
        subtype_modifiers = {
            'flood': {
                'urban': {'food': 1.0, 'shelter': 0.3, 'medical': 1.0, 'water': 0.8},
                'riverine': {'food': 1.2, 'shelter': 1.0, 'medical': 1.0, 'water': 1.2},
                'flash': {'food': 1.5, 'shelter': 1.5, 'medical': 1.3, 'water': 1.0},
                'coastal': {'food': 1.0, 'shelter': 0.7, 'medical': 0.9, 'water': 1.0},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'earthquake': {
                'shallow': {'food': 1.2, 'shelter': 1.3, 'medical': 1.4, 'water': 1.1},
                'deep': {'food': 0.9, 'shelter': 0.8, 'medical': 0.9, 'water': 0.9},
                'tectonic': {'food': 1.1, 'shelter': 1.2, 'medical': 1.2, 'water': 1.0},
                'volcanic': {'food': 1.3, 'shelter': 1.4, 'medical': 1.5, 'water': 1.3},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'cyclone': {
                'tropical': {'food': 1.1, 'shelter': 1.2, 'medical': 1.1, 'water': 1.1},
                'extratropical': {'food': 0.9, 'shelter': 0.9, 'medical': 0.9, 'water': 0.9},
                'super': {'food': 1.5, 'shelter': 1.6, 'medical': 1.4, 'water': 1.3},
                'depression': {'food': 0.7, 'shelter': 0.6, 'medical': 0.7, 'water': 0.8},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'landslide': {
                'rockfall': {'food': 0.8, 'shelter': 0.7, 'medical': 1.2, 'water': 0.8},
                'mudslide': {'food': 1.3, 'shelter': 1.4, 'medical': 1.1, 'water': 1.2},
                'debris_flow': {'food': 1.4, 'shelter': 1.5, 'medical': 1.3, 'water': 1.1},
                'rotational': {'food': 1.1, 'shelter': 1.2, 'medical': 1.0, 'water': 1.0},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'wildfire': {
                'forest': {'food': 1.2, 'shelter': 1.3, 'medical': 1.1, 'water': 1.4},
                'grassland': {'food': 0.9, 'shelter': 0.8, 'medical': 0.9, 'water': 1.2},
                'urban': {'food': 1.4, 'shelter': 1.5, 'medical': 1.3, 'water': 1.3},
                'interface': {'food': 1.3, 'shelter': 1.4, 'medical': 1.2, 'water': 1.3},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'drought': {
                'meteorological': {'food': 1.0, 'shelter': 0.5, 'medical': 0.8, 'water': 1.5},
                'agricultural': {'food': 1.3, 'shelter': 0.4, 'medical': 0.7, 'water': 1.6},
                'hydrological': {'food': 1.2, 'shelter': 0.5, 'medical': 0.9, 'water': 1.8},
                'socioeconomic': {'food': 1.4, 'shelter': 0.6, 'medical': 1.0, 'water': 1.7},
                'default': {'food': 1.0, 'shelter': 0.5, 'medical': 0.8, 'water': 1.5}
            },
            'tsunami': {
                'tectonic': {'food': 1.2, 'shelter': 1.3, 'medical': 1.4, 'water': 1.1},
                'volcanic': {'food': 1.3, 'shelter': 1.4, 'medical': 1.5, 'water': 1.2},
                'landslide_triggered': {'food': 1.1, 'shelter': 1.2, 'medical': 1.3, 'water': 1.0},
                'meteorite': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            },
            'avalanche': {
                'slab': {'food': 0.9, 'shelter': 0.8, 'medical': 1.3, 'water': 0.7},
                'powder': {'food': 0.7, 'shelter': 0.6, 'medical': 1.1, 'water': 0.6},
                'wet': {'food': 1.0, 'shelter': 0.9, 'medical': 1.2, 'water': 0.8},
                'icefall': {'food': 0.8, 'shelter': 0.7, 'medical': 1.4, 'water': 0.7},
                'default': {'food': 1.0, 'shelter': 1.0, 'medical': 1.0, 'water': 1.0}
            }
        }
        
        disaster_mods = subtype_modifiers.get(disaster_type, subtype_modifiers['flood'])
        subtype_mod = disaster_mods.get(disaster_subtype, disaster_mods['default']) if disaster_subtype else disaster_mods['default']
        
        # 5. Base requirements per exposed person per day (REALISTIC)
        meals_per_day = 1.75
        base_requirements = {
            'flood': {'food_ratio': meals_per_day, 'water_per_day': 8, 'medical_ratio': 0.008, 'shelter_ratio': 0.35},
            'earthquake': {'food_ratio': meals_per_day, 'water_per_day': 12, 'medical_ratio': 0.015, 'shelter_ratio': 0.65},
            'cyclone': {'food_ratio': meals_per_day, 'water_per_day': 10, 'medical_ratio': 0.012, 'shelter_ratio': 0.55},
            'landslide': {'food_ratio': meals_per_day, 'water_per_day': 8, 'medical_ratio': 0.020, 'shelter_ratio': 0.45},
            'wildfire': {'food_ratio': meals_per_day, 'water_per_day': 6, 'medical_ratio': 0.010, 'shelter_ratio': 0.30},
            'drought': {'food_ratio': meals_per_day, 'water_per_day': 15, 'medical_ratio': 0.004, 'shelter_ratio': 0.08},
            'tsunami': {'food_ratio': meals_per_day, 'water_per_day': 12, 'medical_ratio': 0.025, 'shelter_ratio': 0.75},
            'avalanche': {'food_ratio': meals_per_day, 'water_per_day': 8, 'medical_ratio': 0.015, 'shelter_ratio': 0.40}
        }
        
        base = base_requirements.get(disaster_type, base_requirements['flood'])
        
        # 6. Calculate raw demand
        raw_food = int(directly_exposed * base['food_ratio'] * duration * subtype_mod['food'])
        raw_water = int(directly_exposed * base['water_per_day'] * duration * subtype_mod['water'])
        raw_medical = max(1, int(directly_exposed * base['medical_ratio'] * subtype_mod['medical']))
        raw_rescue = max(10, int(directly_exposed * 0.015))
        raw_shelters = int(directly_exposed * base['shelter_ratio'] * subtype_mod['shelter'] / 50)
        raw_financial = int(directly_exposed * 20000)
        
        # 7. Capacity constraints
        capacity_limits = admin_capacity or {
            'food_packets_per_day': 40000,
            'water_liters_per_day': 1200000,
            'medical_teams_max': 200,
            'rescue_personnel_max': 2000,
            'relief_camps_max': 400
        }
        
        # 8. Apply bounded functions
        food_packets = min(raw_food, int(capacity_limits['food_packets_per_day'] * duration))
        water_liters = min(raw_water, int(capacity_limits['water_liters_per_day'] * duration))
        medical_teams = min(raw_medical, capacity_limits['medical_teams_max'])
        rescue_personnel = min(raw_rescue, capacity_limits['rescue_personnel_max'])
        temporary_shelters = min(raw_shelters, capacity_limits['relief_camps_max'])
        
        return {
            'food_packets': food_packets,
            'water_liters': water_liters,
            'medical_teams': medical_teams,
            'rescue_personnel': rescue_personnel,
            'temporary_shelters': temporary_shelters,
            'financial_aid_inr': raw_financial,
            'confidence_score': 0.72,
            'method': 'rule_based_bounded',
            'duration_days': int(duration),
            'exposure_ratio_used': effective_exposure,
            'directly_exposed_population': directly_exposed,
            'capacity_constraints_applied': True
        }

def main():
    """Main function called from Node.js"""
    try:
        # Read input from command line or file
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'No input data provided'}))
            sys.exit(1)
        
        arg = sys.argv[1]
        
        # Check if argument is a file path
        if os.path.exists(arg) and os.path.isfile(arg):
            # Read from file (more reliable on Windows)
            # Use utf-8-sig to handle BOM if present
            with open(arg, 'r', encoding='utf-8-sig') as f:
                input_data = json.load(f)
        else:
            # Parse as JSON string (backward compatibility)
            input_data = json.loads(arg)
        
        # Create predictor
        predictor = ReliefPredictor()
        
        # Generate prediction
        prediction = predictor.predict(input_data)
        
        # Output as JSON
        print(json.dumps(prediction))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

