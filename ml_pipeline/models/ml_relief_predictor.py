"""
ML-Based Relief Predictor with Geographic Matching
Primary: ML models trained on actual relief data
Fallback: Geographic matching for unknown locations
Last resort: Rule-based formulas
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

try:
    from .geographic_matcher import GeographicMatcher
except ImportError:
    try:
        # If relative import fails, try absolute
        sys.path.insert(0, str(Path(__file__).parent))
        from geographic_matcher import GeographicMatcher
    except ImportError:
        # If still fails, create a minimal matcher
        GeographicMatcher = None
        print("⚠️ Geographic matcher not available", file=sys.stderr)

class MLReliefPredictor:
    def __init__(self):
        self.models_loaded = False
        self.models = {}
        self.scaler = None
        self.encoders = {}
        self.geographic_matcher = None
        self.known_locations = set()  # Locations with actual relief data
        
        self.load_models()
        self.load_geographic_matcher()
        self.load_known_locations()
    
    def load_models(self):
        """Load trained ML models"""
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
                    print(f"⚠️ No trained models found", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Failed to load models: {e}", file=sys.stderr)
            self.models_loaded = False
    
    def load_geographic_matcher(self):
        """Load geographic similarity matcher"""
        if GeographicMatcher is None:
            self.geographic_matcher = None
            return
            
        try:
            self.geographic_matcher = GeographicMatcher()
            print("✓ Geographic matcher loaded", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Failed to load geographic matcher: {e}", file=sys.stderr)
            self.geographic_matcher = None
    
    def load_known_locations(self):
        """Load list of locations with actual relief data (for fallback)"""
        try:
            data_file = Path(__file__).parent.parent / 'data' / 'historical' / 'disasters_with_relief_data.json'
            if data_file.exists():
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                disasters = data.get('india_disasters_with_relief_data', [])
                for disaster in disasters:
                    location = disaster.get('location', {})
                    city = location.get('city', '')
                    state = location.get('state', '')
                    if city:
                        self.known_locations.add(f"{city.lower()},{state.lower()}")
                
                print(f"✓ Loaded {len(self.known_locations)} known locations with actual data", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Could not load known locations: {e}", file=sys.stderr)
    
    def extract_features(self, data):
        """Extract features for ML prediction"""
        features = {}
        
        # Disaster type encoding
        if self.encoders.get('disaster_type'):
            try:
                features['disaster_type_encoded'] = int(self.encoders['disaster_type'].transform([data.get('disaster_type', 'flood')])[0])
            except:
                disaster_types = ['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche']
                features['disaster_type_encoded'] = disaster_types.index(data.get('disaster_type', 'flood')) if data.get('disaster_type', 'flood') in disaster_types else 0
        else:
            disaster_types = ['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche']
            features['disaster_type_encoded'] = disaster_types.index(data.get('disaster_type', 'flood')) if data.get('disaster_type', 'flood') in disaster_types else 0
        
        # Severity encoding
        severity_map = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}
        features['severity_encoded'] = severity_map.get(data.get('severity', 'medium'), 1)
        
        # Area and population
        features['affected_area_km2'] = data.get('affected_area_km2', 50)
        features['displaced'] = data.get('affected_population', data.get('displaced', 2500))
        features['casualties'] = data.get('casualties', 0)
        
        # Location (lat/lng for geographic features)
        location = data.get('location', {})
        if isinstance(location, dict):
            features['latitude'] = location.get('coordinates', {}).get('latitude') or location.get('latitude') or data.get('latitude', 20.0)
            features['longitude'] = location.get('coordinates', {}).get('longitude') or location.get('longitude') or data.get('longitude', 75.0)
        else:
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
    
    def predict_with_ml(self, features):
        """ML-based prediction using trained models"""
        try:
            # Convert features to array (must match training order!)
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
                'food_packets': predictions.get('food', 0),
                'water_liters': predictions.get('water', 0),
                'medical_teams': predictions.get('medical', 0),
                'rescue_personnel': max(10, int(features['displaced'] * 0.02)),
                'temporary_shelters': predictions.get('shelter', 0),
                'financial_aid_inr': predictions.get('financial', 0),
                'confidence_score': 0.93,
                'method': 'ml_model'
            }
        except Exception as e:
            print(f"ML prediction error: {e}", file=sys.stderr)
            raise
    
    def predict_with_geographic_matching(self, data):
        """Use geographic matching to find similar locations and predict"""
        if not self.geographic_matcher:
            raise Exception("Geographic matcher not available")
        
        location = data.get('location', {})
        city = location.get('city', '') if isinstance(location, dict) else str(location)
        state = location.get('state', '') if isinstance(location, dict) else data.get('state', '')
        
        # Estimate geographic features for the location
        target_features = self.geographic_matcher.estimate_features_from_name(city, state)
        
        # Find similar cities
        similar_cities = self.geographic_matcher.find_similar_cities(target_features, k=3)
        
        if not similar_cities:
            raise Exception("No similar cities found")
        
        # Use ML prediction but adjust based on geographic similarity
        features = self.extract_features(data)
        ml_prediction = self.predict_with_ml(features)
        
        # Weight prediction by geographic similarity
        avg_similarity = sum(city['similarity'] for city in similar_cities) / len(similar_cities)
        
        # Adjust predictions based on similarity (if similarity is low, reduce confidence)
        if avg_similarity < 0.7:
            # Low similarity - reduce predictions slightly
            adjustment = 0.85
            ml_prediction['food_packets'] = int(ml_prediction['food_packets'] * adjustment)
            ml_prediction['water_liters'] = int(ml_prediction['water_liters'] * adjustment)
            ml_prediction['confidence_score'] = 0.75
        
        ml_prediction['method'] = 'ml_with_geographic_matching'
        ml_prediction['similar_cities'] = [{'city': c['city'], 'similarity': c['similarity']} for c in similar_cities]
        
        return ml_prediction
    
    def is_known_location(self, data):
        """Check if location has actual relief data"""
        location = data.get('location', {})
        city = location.get('city', '') if isinstance(location, dict) else str(location)
        state = location.get('state', '') if isinstance(location, dict) else data.get('state', '')
        
        key = f"{city.lower()},{state.lower()}"
        return key in self.known_locations
    
    def predict(self, data):
        """
        Main prediction method
        Priority: ML > Geographic Matching > Rules
        """
        # Extract features
        features = self.extract_features(data)
        
        # PRIORITY 1: Use ML if models are loaded
        if self.models_loaded:
            try:
                # Check if known location (has actual data) - use ML directly
                if self.is_known_location(data):
                    prediction = self.predict_with_ml(features)
                    prediction['method'] = 'ml_model_known_location'
                    return prediction
                
                # Unknown location - use geographic matching + ML
                if self.geographic_matcher:
                    try:
                        prediction = self.predict_with_geographic_matching(data)
                        return prediction
                    except Exception as e:
                        print(f"Geographic matching failed: {e}, using ML directly", file=sys.stderr)
                
                # Fallback to ML only
                prediction = self.predict_with_ml(features)
                return prediction
                
            except Exception as e:
                print(f"ML prediction failed: {e}, falling back to rules", file=sys.stderr)
        
        # PRIORITY 2: Rule-based fallback (only if ML fails)
        return self.rule_based_fallback(data)
    
    def rule_based_fallback(self, data):
        """Rule-based prediction (fallback only)"""
        # Import rule-based prediction
        from .relief_predictor import ReliefPredictor
        fallback_predictor = ReliefPredictor()
        return fallback_predictor.rule_based_prediction(data)


def main():
    """CLI interface for prediction"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python ml_relief_predictor.py <json_data_file>'}))
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        predictor = MLReliefPredictor()
        prediction = predictor.predict(data)
        
        print(json.dumps(prediction))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
