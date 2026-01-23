"""
Relief Predictor with Actual Data Support
Uses actual relief data when available, predicts when missing
Integrates actual data patterns to improve predictions
"""

import sys
import json
import pickle
import numpy as np
import os
import pandas as pd
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

class ReliefPredictorWithActualData:
    def __init__(self):
        self.models_loaded = False
        self.models = {}
        self.actual_data = {}
        self.load_models()
        self.load_actual_data()
    
    def load_actual_data(self):
        """Load actual relief data from processed file"""
        try:
            data_file = Path(__file__).parent.parent / 'data' / 'historical' / 'disasters_with_relief_processed.json'
            if data_file.exists():
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Create lookup by disaster name and year
                    for disaster in data:
                        key = f"{disaster.get('disaster_name', '').lower()}_{disaster.get('year', 0)}"
                        self.actual_data[key] = disaster
                    print(f"✓ Loaded {len(self.actual_data)} disasters with actual relief data", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Could not load actual data: {e}", file=sys.stderr)
            self.actual_data = {}
    
    def find_similar_disaster(self, disaster_name, disaster_type, year, people_affected):
        """Find similar disaster with actual relief data"""
        # Try exact match first
        for key, data in self.actual_data.items():
            if disaster_name.lower() in key.lower() or key.lower() in disaster_name.lower():
                if abs(data.get('year', 0) - year) <= 2:  # Within 2 years
                    return data
        
        # Try by type and similar affected population
        best_match = None
        best_score = 0
        
        for key, data in self.actual_data.items():
            if data.get('disaster_type') == disaster_type:
                # Calculate similarity score
                actual_affected = data.get('people_affected', 0)
                if actual_affected > 0 and people_affected > 0:
                    ratio = min(actual_affected, people_affected) / max(actual_affected, people_affected)
                    if ratio > best_score:
                        best_score = ratio
                        best_match = data
        
        if best_score > 0.5:  # At least 50% similar
            return best_match
        
        return None
    
    def get_actual_relief_ratios(self, similar_disaster):
        """Extract relief ratios from actual data"""
        if not similar_disaster:
            return None
        
        people_affected = similar_disaster.get('people_affected', 1)
        if people_affected == 0:
            return None
        
        ratios = {}
        
        # Food packets ratio
        food = similar_disaster.get('relief_food_packets')
        if food and food > 0:
            ratios['food'] = food / people_affected
        
        # Water liters ratio
        water = similar_disaster.get('relief_water_liters')
        if water and water > 0:
            ratios['water'] = water / people_affected
        
        # Medical teams ratio
        medical = similar_disaster.get('relief_medical_teams')
        if medical and medical > 0:
            ratios['medical'] = medical / people_affected
        
        # Rescue personnel ratio
        rescue = similar_disaster.get('relief_rescue_personnel')
        if rescue and rescue > 0:
            ratios['rescue'] = rescue / people_affected
        
        # Financial aid ratio
        financial = similar_disaster.get('relief_financial_aid_inr')
        if financial and financial > 0:
            ratios['financial'] = financial / people_affected
        
        return ratios if len(ratios) > 0 else None
    
    def load_models(self):
        """Load trained models or use fallback"""
        try:
            import joblib
            
            model_dir = Path(__file__).parent / 'trained'
            if model_dir.exists():
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
                
                scaler_path = model_dir / 'feature_scaler.pkl'
                if scaler_path.exists():
                    self.scaler = joblib.load(scaler_path)
                
                if len(self.models) > 0:
                    self.models_loaded = True
                    print(f"✓ Loaded {len(self.models)} trained ML models", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Failed to load models: {e}", file=sys.stderr)
            self.models_loaded = False
            self.scaler = None
    
    def predict_with_actual_data(self, data):
        """Predict relief requirements using actual data when available"""
        disaster_name = data.get('disaster_name', data.get('title', ''))
        disaster_type = data.get('disaster_type', 'flood')
        year = data.get('year', 2020)
        people_affected = data.get('affected_population', data.get('displaced', 0)) or 0
        
        # Try to find similar disaster with actual data
        similar = self.find_similar_disaster(disaster_name, disaster_type, year, people_affected)
        ratios = self.get_actual_relief_ratios(similar) if similar else None
        
        # Predict using ML models or rule-based
        if self.models_loaded:
            prediction = self.predict_with_ml(data)
            method = 'ml_model'
            confidence = 0.93
        else:
            prediction = self.predict_rule_based(data)
            method = 'rule_based'
            confidence = 0.65
        
        # If we have actual data ratios, adjust predictions
        if ratios and people_affected > 0:
            # Use actual ratios for resources we have data for
            if 'food' in ratios and prediction.get('food_packets'):
                # Blend: 70% actual ratio, 30% ML prediction
                actual_food = int(people_affected * ratios['food'])
                ml_food = prediction['food_packets']
                prediction['food_packets'] = int(actual_food * 0.7 + ml_food * 0.3)
                prediction['food_source'] = 'actual_data_adjusted'
                confidence = min(0.98, confidence + 0.05)  # Higher confidence with actual data
            
            if 'water' in ratios and prediction.get('water_liters'):
                actual_water = int(people_affected * ratios['water'])
                ml_water = prediction['water_liters']
                prediction['water_liters'] = int(actual_water * 0.7 + ml_water * 0.3)
                prediction['water_source'] = 'actual_data_adjusted'
            
            if 'medical' in ratios and prediction.get('medical_teams'):
                actual_medical = int(people_affected * ratios['medical'])
                ml_medical = prediction['medical_teams']
                prediction['medical_teams'] = max(1, int(actual_medical * 0.7 + ml_medical * 0.3))
                prediction['medical_source'] = 'actual_data_adjusted'
            
            if 'rescue' in ratios and prediction.get('rescue_personnel'):
                actual_rescue = int(people_affected * ratios['rescue'])
                ml_rescue = prediction['rescue_personnel']
                prediction['rescue_personnel'] = max(10, int(actual_rescue * 0.7 + ml_rescue * 0.3))
                prediction['rescue_source'] = 'actual_data_adjusted'
            
            if 'financial' in ratios and prediction.get('financial_aid_inr'):
                actual_financial = int(people_affected * ratios['financial'])
                ml_financial = prediction['financial_aid_inr']
                prediction['financial_aid_inr'] = int(actual_financial * 0.7 + ml_financial * 0.3)
                prediction['financial_source'] = 'actual_data_adjusted'
        
        prediction['method'] = method
        prediction['confidence_score'] = confidence
        if similar:
            prediction['similar_disaster_used'] = similar.get('disaster_name')
            prediction['data_quality'] = 'enhanced_with_actual'
        else:
            prediction['data_quality'] = 'predicted_only'
        
        return prediction
    
    def predict_with_ml(self, data):
        """Predict using ML models"""
        # Extract features (same as training)
        features = self.extract_features(data)
        
        # Scale features
        if self.scaler:
            features_scaled = self.scaler.transform([features])
        else:
            features_scaled = [features]
        
        prediction = {}
        
        # Predict each resource
        if 'food' in self.models:
            prediction['food_packets'] = max(1, int(self.models['food'].predict(features_scaled)[0]))
        if 'water' in self.models:
            prediction['water_liters'] = max(1, int(self.models['water'].predict(features_scaled)[0]))
        if 'medical' in self.models:
            prediction['medical_teams'] = max(1, int(self.models['medical'].predict(features_scaled)[0]))
        if 'shelter' in self.models:
            prediction['temporary_shelters'] = max(1, int(self.models['shelter'].predict(features_scaled)[0]))
        if 'financial' in self.models:
            prediction['financial_aid_inr'] = max(1, int(self.models['financial'].predict(features_scaled)[0]))
        
        # Default rescue personnel (not in models)
        prediction['rescue_personnel'] = max(10, int(features['displaced'] * 0.05))
        
        return prediction
    
    def predict_rule_based(self, data):
        """Rule-based prediction fallback"""
        disaster_type = data.get('disaster_type', 'flood')
        severity = data.get('severity', 'medium')
        people_affected = data.get('affected_population', data.get('displaced', 2500)) or 2500
        
        base_requirements = {
            'flood': {'food': 7.5, 'water': 0.5, 'medical': 0.006},
            'earthquake': {'food': 9.0, 'water': 0.7, 'medical': 0.010},
            'cyclone': {'food': 8.0, 'water': 0.6, 'medical': 0.008},
            'landslide': {'food': 6.0, 'water': 0.4, 'medical': 0.005},
            'tsunami': {'food': 10.0, 'water': 0.8, 'medical': 0.012}
        }
        
        severity_multiplier = {
            'critical': 1.5,
            'high': 1.2,
            'medium': 1.0,
            'low': 0.7
        }
        
        base = base_requirements.get(disaster_type, base_requirements['flood'])
        multiplier = severity_multiplier.get(severity, 1.0)
        duration = 7
        
        return {
            'food_packets': int(people_affected * base['food'] * multiplier),
            'water_liters': int(people_affected * base['water'] * 1000 * multiplier),
            'medical_teams': max(1, int(people_affected * base['medical'] * multiplier)),
            'rescue_personnel': max(10, int(people_affected * 0.05 * multiplier)),
            'temporary_shelters': max(1, int(people_affected * 0.5 * multiplier / 50)),
            'financial_aid_inr': int(people_affected * 25000 * multiplier)
        }
    
    def extract_features(self, data):
        """Extract features for prediction"""
        disaster_types = ['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche']
        severity_map = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        
        import datetime
        month = data.get('month', datetime.datetime.now().month)
        
        if month in [12, 1, 2]:
            season = 0
        elif month in [3, 4, 5]:
            season = 1
        elif month in [6, 7, 8, 9]:
            season = 2
        else:
            season = 3
        
        return [
            disaster_types.index(data.get('disaster_type', 'flood')) if data.get('disaster_type') in disaster_types else 0,
            severity_map.get(data.get('severity', 'medium'), 1),
            data.get('affected_area_km2', 50),
            data.get('affected_population', data.get('displaced', 2500)) or 2500,
            data.get('casualties', 0),
            data.get('latitude', 20.0),
            data.get('longitude', 75.0),
            month,
            season
        ]

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python relief_predictor_with_actual_data.py <json_data_or_file>")
        sys.exit(1)
    
    try:
        arg = sys.argv[1]
        
        # Check if argument is a file path
        if os.path.exists(arg) and os.path.isfile(arg):
            # Read from file (more reliable on Windows)
            # Use utf-8-sig to handle BOM if present
            with open(arg, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
        else:
            # Parse as JSON string (backward compatibility)
            data = json.loads(arg)
        
        predictor = ReliefPredictorWithActualData()
        prediction = predictor.predict_with_actual_data(data)
        print(json.dumps(prediction, indent=2))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'success': False
        }), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

