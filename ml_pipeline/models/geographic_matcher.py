"""
Geographic Similarity Matcher
Finds geographically similar locations for unknown cities
Uses KNN to match based on topography, climate, elevation, etc.
"""

import numpy as np
from sklearn.neighbors import NearestNeighbors
import json
import sys

class GeographicMatcher:
    def __init__(self):
        # Geographic features database for Indian cities
        # In production, this would be loaded from a database
        self.trained_cities = self.get_trained_cities_features()
        self.knn = None
        self.train_matcher()
    
    def get_trained_cities_features(self):
        """
        Database of geographic features for trained cities
        Format: {city: {features}}
        """
        return {
            # North India - Himalayan
            'Chamoli': {
                'topography': 4,  # 1=coastal, 2=plains, 3=hills, 4=mountains
                'climate_zone': 3,  # 1=tropical, 2=subtropical, 3=temperate, 4=arid
                'elevation_m': 1050,
                'rainfall_mm': 1100,
                'distance_to_water': 1,  # proximity to rivers (1=close, 5=far)
                'population_density': 2  # 1=rural, 2=semi-urban, 3=urban, 4=metro
            },
            'Kullu': {
                'topography': 4,
                'climate_zone': 3,
                'elevation_m': 1200,
                'rainfall_mm': 1150,
                'distance_to_water': 1,
                'population_density': 2
            },
            'Darjeeling': {
                'topography': 3,
                'climate_zone': 3,
                'elevation_m': 2050,
                'rainfall_mm': 3100,
                'distance_to_water': 2,
                'population_density': 2
            },
            
            # Coastal - West
            'Mumbai': {
                'topography': 1,
                'climate_zone': 1,
                'elevation_m': 14,
                'rainfall_mm': 2200,
                'distance_to_water': 1,
                'population_density': 4
            },
            'Goa': {
                'topography': 1,
                'climate_zone': 1,
                'elevation_m': 20,
                'rainfall_mm': 2900,
                'distance_to_water': 1,
                'population_density': 3
            },
            
            # Coastal - East
            'Kolkata': {
                'topography': 2,
                'climate_zone': 1,
                'elevation_m': 9,
                'rainfall_mm': 1600,
                'distance_to_water': 1,
                'population_density': 4
            },
            'Bhubaneswar': {
                'topography': 2,
                'climate_zone': 1,
                'elevation_m': 45,
                'rainfall_mm': 1450,
                'distance_to_water': 2,
                'population_density': 3
            },
            
            # South India
            'Kerala': {
                'topography': 1,
                'climate_zone': 1,
                'elevation_m': 50,
                'rainfall_mm': 3000,
                'distance_to_water': 1,
                'population_density': 3
            },
            'Chennai': {
                'topography': 1,
                'climate_zone': 1,
                'elevation_m': 7,
                'rainfall_mm': 1200,
                'distance_to_water': 1,
                'population_density': 4
            },
            
            # Plains
            'Delhi': {
                'topography': 2,
                'climate_zone': 2,
                'elevation_m': 216,
                'rainfall_mm': 790,
                'distance_to_water': 2,
                'population_density': 4
            },
            'Lucknow': {
                'topography': 2,
                'climate_zone': 2,
                'elevation_m': 123,
                'rainfall_mm': 1010,
                'distance_to_water': 2,
                'population_density': 3
            },
            
            # Arid/Semi-arid
            'Rajasthan': {
                'topography': 2,
                'climate_zone': 4,
                'elevation_m': 350,
                'rainfall_mm': 550,
                'distance_to_water': 5,
                'population_density': 2
            },
            'Gujarat': {
                'topography': 1,
                'climate_zone': 4,
                'elevation_m': 100,
                'rainfall_mm': 650,
                'distance_to_water': 3,
                'population_density': 3
            }
        }
    
    def features_to_array(self, features):
        """Convert feature dict to numpy array"""
        return np.array([
            features['topography'],
            features['climate_zone'],
            features['elevation_m'] / 1000,  # Normalize
            features['rainfall_mm'] / 1000,  # Normalize
            features['distance_to_water'],
            features['population_density']
        ])
    
    def train_matcher(self):
        """Train KNN matcher on trained cities"""
        cities = list(self.trained_cities.keys())
        features_array = np.array([
            self.features_to_array(self.trained_cities[city])
            for city in cities
        ])
        
        # Use K=3 for finding 3 most similar cities
        self.knn = NearestNeighbors(n_neighbors=3, metric='euclidean')
        self.knn.fit(features_array)
        
        self.city_names = cities
    
    def find_similar_cities(self, target_features, k=3):
        """
        Find k most similar cities to target
        
        Args:
            target_features: dict with geographic features
            k: number of similar cities to return
            
        Returns:
            list of tuples: [(city_name, similarity_score), ...]
        """
        target_array = self.features_to_array(target_features).reshape(1, -1)
        
        distances, indices = self.knn.kneighbors(target_array, n_neighbors=k)
        
        # Convert distance to similarity score (0-1)
        # Lower distance = higher similarity
        max_distance = distances[0][-1] if len(distances[0]) > 0 else 1
        similarities = 1 - (distances[0] / (max_distance + 1))  # Normalize
        
        results = []
        for idx, similarity in zip(indices[0], similarities):
            city_name = self.city_names[idx]
            results.append({
                'city': city_name,
                'similarity': float(similarity),
                'features': self.trained_cities[city_name]
            })
        
        return results
    
    def estimate_features_from_name(self, location_name, state=''):
        """
        Estimate features for unknown city based on name/state
        This is a heuristic approach - in production, use geocoding APIs
        """
        location_lower = location_name.lower()
        state_lower = state.lower()
        
        # Heuristic rules based on common patterns
        features = {
            'topography': 2,  # Default: plains
            'climate_zone': 2,  # Default: subtropical
            'elevation_m': 200,
            'rainfall_mm': 1000,
            'distance_to_water': 3,
            'population_density': 2
        }
        
        # Himalayan regions
        if any(word in location_lower or word in state_lower for word in ['uttarakhand', 'himachal', 'kashmir', 'sikkim']):
            features.update({
                'topography': 4,
                'climate_zone': 3,
                'elevation_m': 1500,
                'rainfall_mm': 1200,
                'distance_to_water': 1,
                'population_density': 2
            })
        
        # Coastal regions
        elif any(word in state_lower for word in ['kerala', 'goa', 'maharashtra', 'gujarat', 'tamil', 'odisha']):
            features.update({
                'topography': 1,
                'climate_zone': 1,
                'elevation_m': 20,
                'rainfall_mm': 2000,
                'distance_to_water': 1,
                'population_density': 3
            })
        
        # Arid regions
        elif any(word in state_lower for word in ['rajasthan', 'gujarat']):
            features.update({
                'topography': 2,
                'climate_zone': 4,
                'elevation_m': 300,
                'rainfall_mm': 600,
                'distance_to_water': 5,
                'population_density': 2
            })
        
        # North-east hilly
        elif any(word in state_lower for word in ['assam', 'meghalaya', 'nagaland', 'manipur']):
            features.update({
                'topography': 3,
                'climate_zone': 1,
                'elevation_m': 800,
                'rainfall_mm': 2500,
                'distance_to_water': 1,
                'population_density': 2
            })
        
        return features

def main():
    """Main function for CLI usage"""
    try:
        if len(sys.argv) < 3:
            print(json.dumps({'error': 'Usage: python geographic_matcher.py <location> <state>'}))
            sys.exit(1)
        
        location = sys.argv[1]
        state = sys.argv[2] if len(sys.argv) > 2 else ''
        
        matcher = GeographicMatcher()
        
        # Estimate features for unknown location
        features = matcher.estimate_features_from_name(location, state)
        
        # Find similar cities
        similar_cities = matcher.find_similar_cities(features, k=3)
        
        result = {
            'location': location,
            'state': state,
            'estimated_features': features,
            'similar_cities': similar_cities
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()












