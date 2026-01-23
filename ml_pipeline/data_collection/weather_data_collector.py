"""
Weather Data Collector
Collects weather data from OpenWeatherMap and other weather APIs
"""

import requests
import pandas as pd
from datetime import datetime, timedelta
import json
import os

class WeatherDataCollector:
    def __init__(self, api_key=None, output_dir='../backend/data/raw'):
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY', 'demo_key')
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
        # Major cities in India prone to disasters
        self.indian_cities = [
            {'name': 'Mumbai', 'lat': 19.0760, 'lon': 72.8777},
            {'name': 'Delhi', 'lat': 28.7041, 'lon': 77.1025},
            {'name': 'Chennai', 'lat': 13.0827, 'lon': 80.2707},
            {'name': 'Kolkata', 'lat': 22.5726, 'lon': 88.3639},
            {'name': 'Ahmedabad', 'lat': 23.0225, 'lon': 72.5714},
            {'name': 'Bhubaneswar', 'lat': 20.2961, 'lon': 85.8245},
            {'name': 'Guwahati', 'lat': 26.1445, 'lon': 91.7362},
            {'name': 'Srinagar', 'lat': 34.0837, 'lon': 74.7973},
        ]
    
    def get_current_weather(self, lat, lon, city_name="Unknown"):
        """Get current weather for a location"""
        try:
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(f"{self.base_url}/weather", params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                weather_data = {
                    'city': city_name,
                    'timestamp': datetime.now(),
                    'latitude': lat,
                    'longitude': lon,
                    'temperature': data['main']['temp'],
                    'feels_like': data['main']['feels_like'],
                    'temp_min': data['main']['temp_min'],
                    'temp_max': data['main']['temp_max'],
                    'pressure': data['main']['pressure'],
                    'humidity': data['main']['humidity'],
                    'wind_speed': data['wind']['speed'],
                    'wind_deg': data['wind'].get('deg'),
                    'clouds': data['clouds']['all'],
                    'weather': data['weather'][0]['main'],
                    'weather_description': data['weather'][0]['description'],
                    'visibility': data.get('visibility'),
                    'rain_1h': data.get('rain', {}).get('1h', 0),
                    'rain_3h': data.get('rain', {}).get('3h', 0),
                }
                
                return weather_data
            else:
                print(f"Error fetching weather for {city_name}: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Exception fetching weather for {city_name}: {str(e)}")
            return None
    
    def collect_all_cities_weather(self):
        """Collect current weather for all predefined cities"""
        print("Collecting weather data for major Indian cities...")
        
        weather_records = []
        
        for city in self.indian_cities:
            print(f"Fetching weather for {city['name']}...")
            weather = self.get_current_weather(
                city['lat'],
                city['lon'],
                city['name']
            )
            
            if weather:
                weather_records.append(weather)
        
        if weather_records:
            df = pd.DataFrame(weather_records)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'current_weather_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            
            df.to_csv(filepath, index=False)
            print(f"\nSaved weather data for {len(df)} cities to {filepath}")
            
            return df
        
        return None
    
    def create_sample_weather_disaster_data(self):
        """
        Create sample weather data associated with disaster conditions
        This simulates historical weather patterns during disasters
        """
        print("Creating sample weather-disaster correlation data...")
        
        weather_disaster_data = []
        
        # Flood conditions
        flood_weather = [
            {
                'disaster_type': 'flood',
                'location': 'Mumbai',
                'date': '2021-07-15',
                'rainfall_mm': 350,
                'temperature': 28,
                'humidity': 95,
                'wind_speed': 45,
                'pressure': 998,
                'severity': 'high',
                'duration_hours': 48
            },
            {
                'disaster_type': 'flood',
                'location': 'Chennai',
                'date': '2015-12-01',
                'rainfall_mm': 490,
                'temperature': 26,
                'humidity': 98,
                'wind_speed': 35,
                'pressure': 995,
                'severity': 'critical',
                'duration_hours': 72
            },
        ]
        
        # Cyclone conditions
        cyclone_weather = [
            {
                'disaster_type': 'cyclone',
                'location': 'Odisha',
                'date': '2019-05-03',
                'rainfall_mm': 280,
                'temperature': 30,
                'humidity': 88,
                'wind_speed': 180,
                'pressure': 932,
                'severity': 'critical',
                'cyclone_name': 'Fani',
                'duration_hours': 36
            },
            {
                'disaster_type': 'cyclone',
                'location': 'Gujarat',
                'date': '2023-06-15',
                'rainfall_mm': 150,
                'temperature': 32,
                'humidity': 82,
                'wind_speed': 120,
                'pressure': 960,
                'severity': 'high',
                'cyclone_name': 'Biparjoy',
                'duration_hours': 24
            },
        ]
        
        # Heat wave conditions
        heatwave_weather = [
            {
                'disaster_type': 'heatwave',
                'location': 'Delhi',
                'date': '2022-05-15',
                'rainfall_mm': 0,
                'temperature': 49,
                'humidity': 15,
                'wind_speed': 25,
                'pressure': 1005,
                'severity': 'critical',
                'duration_hours': 168
            },
        ]
        
        weather_disaster_data.extend(flood_weather)
        weather_disaster_data.extend(cyclone_weather)
        weather_disaster_data.extend(heatwave_weather)
        
        df = pd.DataFrame(weather_disaster_data)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'weather_disaster_correlation_{timestamp}.csv'
        filepath = os.path.join(self.output_dir, filename)
        
        df.to_csv(filepath, index=False)
        print(f"Created weather-disaster correlation data with {len(df)} records")
        print(f"Saved to {filepath}")
        
        return df

def main():
    """Main execution function"""
    collector = WeatherDataCollector()
    
    # Create sample weather-disaster correlation data
    print("\n" + "="*60)
    print("Creating Weather-Disaster Correlation Data")
    print("="*60)
    weather_disaster_df = collector.create_sample_weather_disaster_data()
    print(f"\nSample data:\n{weather_disaster_df.head()}")
    
    # Note: Uncomment below to collect real-time weather data
    # Requires valid OpenWeatherMap API key
    # print("\n" + "="*60)
    # print("Collecting Current Weather Data")
    # print("="*60)
    # current_weather_df = collector.collect_all_cities_weather()

if __name__ == "__main__":
    main()














