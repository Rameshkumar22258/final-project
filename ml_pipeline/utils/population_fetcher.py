"""
Population Fetcher
Dynamically fetches population data for Indian cities
Uses APIs with fallback to local database
"""

import requests
import json
import sys
from pathlib import Path

class PopulationFetcher:
    def __init__(self):
        # Fallback database for major Indian cities
        self.city_database = self.load_city_database()
    
    def load_city_database(self):
        """Load pre-populated database of Indian cities"""
        return {
            # Metros
            'Mumbai': 20411000,
            'Delhi': 16787000,
            'Bangalore': 12326000,
            'Hyderabad': 9746000,
            'Chennai': 8917000,
            'Kolkata': 4631000,
            'Pune': 6430000,
            'Ahmedabad': 8450000,
            'Surat': 6081000,
            
            # Tier 1 Cities
            'Jaipur': 3046000,
            'Lucknow': 2817000,
            'Kanpur': 2823000,
            'Nagpur': 2405000,
            'Indore': 2170000,
            'Thane': 1890000,
            'Bhopal': 1798000,
            'Visakhapatnam': 1730000,
            'Patna': 1684000,
            'Vadodara': 1670000,
            'Ghaziabad': 1636000,
            'Ludhiana': 1613000,
            'Agra': 1585000,
            'Nashik': 1486000,
            'Faridabad': 1414000,
            'Meerut': 1309000,
            'Rajkot': 1286000,
            'Varanasi': 1198000,
            'Srinagar': 1180000,
            'Amritsar': 1132000,
            'Allahabad': 1117000,
            'Howrah': 1077000,
            'Ranchi': 1073000,
            'Jabalpur': 1054000,
            'Coimbatore': 1050000,
            
            # Tier 2 Cities
            'Gwalior': 1053000,
            'Vijayawada': 1048000,
            'Jodhpur': 1033000,
            'Madurai': 1017000,
            'Raipur': 1010000,
            'Kota': 1001000,
            'Guwahati': 963000,
            'Chandigarh': 960000,
            'Solapur': 951000,
            'Hubli-Dharwad': 943000,
            'Mysore': 920000,
            'Bareilly': 898000,
            'Moradabad': 889000,
            'Gurgaon': 877000,
            'Aligarh': 874000,
            'Jalandhar': 862000,
            'Tiruchirappalli': 847000,
            'Bhubaneswar': 837000,
            'Salem': 826000,
            'Warangal': 811000,
            'Thiruvananthapuram': 743000,
            'Bhiwandi': 707000,
            'Saharanpur': 705000,
            'Guntur': 670000,
            'Amravati': 646000,
            'Bikaner': 644000,
            'Noida': 642000,
            'Jamshedpur': 629000,
            'Bhilai': 625000,
            'Cuttack': 606000,
            'Firozabad': 603000,
            'Kochi': 602000,
            'Bhavnagar': 605000,
            'Dehradun': 578000,
            'Durgapur': 566000,
            'Asansol': 563000,
            'Nanded': 550000,
            'Kolhapur': 549000,
            
            # Hill stations and smaller cities
            'Shimla': 170000,
            'Manali': 8100,
            'Darjeeling': 118000,
            'Nainital': 41000,
            'Mussoorie': 30000,
            'Ooty': 88000,
            'Gangtok': 100000,
            'Shillong': 143000,
            'Imphal': 268000,
            'Itanagar': 44000,
            'Kohima': 99000,
            'Aizawl': 293000,
            'Agartala': 400000,
            
            # Disaster-prone cities
            'Chamoli': 14000,
            'Kedarnath': 1500,
            'Kullu': 18000,
            'Uttarkashi': 16000,
            'Pithoragarh': 12000,
            'Leh': 30000,
            'Rishikesh': 102000,
            'Haridwar': 228000,
        }
    
    def get_population(self, city_name, state='', use_api=True):
        """
        Get population for a city
        
        Args:
            city_name: Name of the city
            state: State name (optional)
            use_api: Whether to try API first (default: True)
            
        Returns:
            int: Population count
        """
        # Normalize city name
        city_normalized = self.normalize_name(city_name)
        
        # Try local database first
        if city_normalized in self.city_database:
            return self.city_database[city_normalized]
        
        # Try API if enabled
        if use_api:
            api_population = self.fetch_from_api(city_name, state)
            if api_population:
                return api_population
        
        # Fallback: Estimate based on size/type
        return self.estimate_population(city_name, state)
    
    def normalize_name(self, name):
        """Normalize city name for matching"""
        # Remove common suffixes
        normalized = name.strip().title()
        normalized = normalized.replace(' City', '')
        normalized = normalized.replace(' District', '')
        return normalized
    
    def fetch_from_api(self, city_name, state=''):
        """
        Fetch from Geonames or similar API
        NOTE: Requires API key - set GEONAMES_USERNAME env variable
        """
        try:
            import os
            username = os.getenv('GEONAMES_USERNAME')
            
            if not username:
                return None
            
            # Geonames API
            url = 'http://api.geonames.org/searchJSON'
            params = {
                'q': f'{city_name},{state}',
                'country': 'IN',
                'maxRows': 1,
                'username': username
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if 'geonames' in data and len(data['geonames']) > 0:
                    return int(data['geonames'][0].get('population', 0))
        except Exception as e:
            print(f"API fetch error: {e}", file=sys.stderr)
        
        return None
    
    def estimate_population(self, city_name, state=''):
        """
        Estimate population based on city type and state
        """
        state_lower = state.lower()
        
        # Population estimates based on state averages
        state_avg_city_population = {
            'maharashtra': 500000,
            'delhi': 800000,
            'karnataka': 400000,
            'tamil nadu': 350000,
            'telangana': 300000,
            'west bengal': 350000,
            'gujarat': 400000,
            'rajasthan': 250000,
            'uttar pradesh': 300000,
            'madhya pradesh': 250000,
            'bihar': 200000,
            'punjab': 200000,
            'haryana': 250000,
            'kerala': 300000,
            'odisha': 200000,
            'jharkhand': 180000,
            'assam': 150000,
            'uttarakhand': 100000,
            'himachal pradesh': 80000,
            'jammu and kashmir': 120000,
        }
        
        # Get state average or default
        estimated = state_avg_city_population.get(state_lower, 100000)
        
        # Adjust based on keywords
        city_lower = city_name.lower()
        if 'nagar' in city_lower or 'pur' in city_lower:
            estimated = int(estimated * 0.6)  # Smaller towns
        elif 'ganj' in city_lower:
            estimated = int(estimated * 0.4)  # Even smaller
        
        return estimated
    
    def get_population_by_area(self, area_km2, density='medium'):
        """
        Estimate population based on area and density
        
        Args:
            area_km2: Area in square kilometers
            density: 'low', 'medium', 'high', 'metro'
            
        Returns:
            int: Estimated population
        """
        density_per_km2 = {
            'low': 200,
            'medium': 1000,
            'high': 5000,
            'metro': 20000
        }
        
        people_per_km2 = density_per_km2.get(density, 1000)
        return int(area_km2 * people_per_km2)

def main():
    """CLI usage"""
    try:
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'Usage: python population_fetcher.py <city> [state]'}))
            sys.exit(1)
        
        city = sys.argv[1]
        state = sys.argv[2] if len(sys.argv) > 2 else ''
        
        fetcher = PopulationFetcher()
        population = fetcher.get_population(city, state)
        
        result = {
            'city': city,
            'state': state,
            'population': population,
            'source': 'database' if city in fetcher.city_database else 'estimated'
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()












