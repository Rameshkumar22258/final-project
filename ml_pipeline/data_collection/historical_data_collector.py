"""
Historical Disaster Data Collector
Collects data from Kaggle, ReliefWeb, and other open data portals
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime
import time

class HistoricalDataCollector:
    def __init__(self, output_dir='../backend/data/raw'):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # API endpoints for various data sources
        self.reliefweb_api = "https://api.reliefweb.int/v1/disasters"
        self.usgs_earthquake_api = "https://earthquake.usgs.gov/fdsnws/event/1/query"
        
    def collect_reliefweb_disasters(self, limit=500):
        """
        Collect disaster data from ReliefWeb API
        
        Args:
            limit: Maximum number of disaster records to fetch
        
        Returns:
            DataFrame with disaster data
        """
        print(f"Fetching disasters from ReliefWeb...")
        
        disasters = []
        offset = 0
        batch_size = 100
        
        while offset < limit:
            params = {
                'appname': 'disaster-relief-ai',
                'limit': batch_size,
                'offset': offset,
                'preset': 'latest',
                'profile': 'full'
            }
            
            try:
                response = requests.get(self.reliefweb_api, params=params, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                
                if 'data' in data and data['data']:
                    for item in data['data']:
                        fields = item.get('fields', {})
                        
                        disaster_record = {
                            'id': item.get('id'),
                            'name': fields.get('name'),
                            'glide': fields.get('glide'),
                            'date': fields.get('date', {}).get('created'),
                            'country': ', '.join([c.get('name', '') for c in fields.get('country', [])]),
                            'disaster_type': ', '.join([t.get('name', '') for t in fields.get('type', [])]),
                            'status': fields.get('status'),
                            'description': fields.get('description'),
                            'url': fields.get('url'),
                        }
                        
                        disasters.append(disaster_record)
                    
                    offset += batch_size
                    print(f"Fetched {len(disasters)} disasters...")
                    time.sleep(1)  # Rate limiting
                else:
                    break
                    
            except Exception as e:
                print(f"Error fetching ReliefWeb data: {str(e)}")
                break
        
        df = pd.DataFrame(disasters)
        
        if not df.empty:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'reliefweb_disasters_{timestamp}.csv'
            filepath = os.path.join(self.output_dir, filename)
            df.to_csv(filepath, index=False)
            print(f"Saved {len(df)} disasters to {filepath}")
        
        return df
    
    def collect_earthquake_data(self, days_back=365, min_magnitude=4.0):
        """
        Collect earthquake data from USGS
        
        Args:
            days_back: Number of days to look back
            min_magnitude: Minimum earthquake magnitude
        
        Returns:
            DataFrame with earthquake data
        """
        print(f"Fetching earthquake data from USGS...")
        
        end_date = datetime.now()
        start_date = end_date - pd.Timedelta(days=days_back)
        
        params = {
            'format': 'geojson',
            'starttime': start_date.strftime('%Y-%m-%d'),
            'endtime': end_date.strftime('%Y-%m-%d'),
            'minmagnitude': min_magnitude
        }
        
        try:
            response = requests.get(self.usgs_earthquake_api, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            earthquakes = []
            for feature in data.get('features', []):
                props = feature.get('properties', {})
                coords = feature.get('geometry', {}).get('coordinates', [])
                
                earthquake = {
                    'id': feature.get('id'),
                    'magnitude': props.get('mag'),
                    'place': props.get('place'),
                    'time': datetime.fromtimestamp(props.get('time', 0) / 1000),
                    'latitude': coords[1] if len(coords) > 1 else None,
                    'longitude': coords[0] if len(coords) > 0 else None,
                    'depth': coords[2] if len(coords) > 2 else None,
                    'alert': props.get('alert'),
                    'tsunami': props.get('tsunami'),
                    'sig': props.get('sig'),
                    'felt': props.get('felt'),
                    'url': props.get('url')
                }
                
                earthquakes.append(earthquake)
            
            df = pd.DataFrame(earthquakes)
            
            if not df.empty:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f'earthquakes_{timestamp}.csv'
                filepath = os.path.join(self.output_dir, filename)
                df.to_csv(filepath, index=False)
                print(f"Saved {len(df)} earthquakes to {filepath}")
            
            return df
            
        except Exception as e:
            print(f"Error fetching earthquake data: {str(e)}")
            return pd.DataFrame()
    
    def create_sample_disaster_dataset(self):
        """
        Create a sample disaster dataset with relief demand information
        This simulates historical disaster data with resource requirements
        """
        print("Creating sample historical disaster dataset...")
        
        # Sample data structure
        disasters = []
        
        # Flood disasters
        flood_events = [
            {'location': 'Kerala, India', 'year': 2018, 'severity': 'critical', 'affected': 5400000, 'deaths': 483},
            {'location': 'Assam, India', 'year': 2020, 'severity': 'high', 'affected': 4800000, 'deaths': 102},
            {'location': 'Mumbai, India', 'year': 2021, 'severity': 'medium', 'affected': 320000, 'deaths': 32},
            {'location': 'Uttarakhand, India', 'year': 2013, 'severity': 'critical', 'affected': 600000, 'deaths': 5700},
            {'location': 'Chennai, India', 'year': 2015, 'severity': 'high', 'affected': 1800000, 'deaths': 422},
        ]
        
        # Cyclone disasters
        cyclone_events = [
            {'location': 'Odisha, India', 'year': 2019, 'severity': 'critical', 'affected': 10000000, 'deaths': 64, 'name': 'Fani'},
            {'location': 'West Bengal, India', 'year': 2020, 'severity': 'critical', 'affected': 5000000, 'deaths': 128, 'name': 'Amphan'},
            {'location': 'Gujarat, India', 'year': 2023, 'severity': 'high', 'affected': 800000, 'deaths': 8, 'name': 'Biparjoy'},
            {'location': 'Andhra Pradesh, India', 'year': 2014, 'severity': 'critical', 'affected': 2400000, 'deaths': 53, 'name': 'Hudhud'},
        ]
        
        # Earthquake disasters
        earthquake_events = [
            {'location': 'Nepal', 'year': 2015, 'severity': 'critical', 'affected': 8000000, 'deaths': 8964, 'magnitude': 7.8},
            {'location': 'Gujarat, India', 'year': 2001, 'severity': 'critical', 'affected': 400000, 'deaths': 20005, 'magnitude': 7.7},
            {'location': 'Kashmir', 'year': 2005, 'severity': 'critical', 'affected': 5200000, 'deaths': 86000, 'magnitude': 7.6},
        ]
        
        severity_multipliers = {
            'low': 0.5,
            'medium': 1.0,
            'high': 2.0,
            'critical': 3.5
        }
        
        # Process flood events
        for event in flood_events:
            mult = severity_multipliers[event['severity']]
            disasters.append({
                'disaster_id': f"FLOOD_{event['year']}_{event['location'].replace(' ', '_').replace(',', '')}",
                'disaster_type': 'flood',
                'location': event['location'],
                'year': event['year'],
                'severity': event['severity'],
                'people_affected': event['affected'],
                'deaths': event['deaths'],
                'food_required_tons': int(event['affected'] * 0.002 * mult),
                'water_required_liters': int(event['affected'] * 20 * mult),
                'medical_aid_people': int(event['affected'] * 0.1 * mult),
                'shelter_families': int(event['affected'] * 0.15 * mult),
                'duration_days': int(30 * mult),
                'response_time_hours': int(24 / mult),
                'total_cost_usd': int(event['affected'] * 50 * mult)
            })
        
        # Process cyclone events
        for event in cyclone_events:
            mult = severity_multipliers[event['severity']]
            disasters.append({
                'disaster_id': f"CYCLONE_{event['year']}_{event.get('name', 'Unknown')}",
                'disaster_type': 'cyclone',
                'location': event['location'],
                'year': event['year'],
                'severity': event['severity'],
                'people_affected': event['affected'],
                'deaths': event['deaths'],
                'food_required_tons': int(event['affected'] * 0.0015 * mult),
                'water_required_liters': int(event['affected'] * 25 * mult),
                'medical_aid_people': int(event['affected'] * 0.12 * mult),
                'shelter_families': int(event['affected'] * 0.2 * mult),
                'duration_days': int(20 * mult),
                'response_time_hours': int(12 / mult),
                'total_cost_usd': int(event['affected'] * 75 * mult)
            })
        
        # Process earthquake events
        for event in earthquake_events:
            mult = severity_multipliers[event['severity']]
            disasters.append({
                'disaster_id': f"EARTHQUAKE_{event['year']}_{event['location'].replace(' ', '_').replace(',', '')}",
                'disaster_type': 'earthquake',
                'location': event['location'],
                'year': event['year'],
                'severity': event['severity'],
                'magnitude': event['magnitude'],
                'people_affected': event['affected'],
                'deaths': event['deaths'],
                'food_required_tons': int(event['affected'] * 0.0025 * mult),
                'water_required_liters': int(event['affected'] * 30 * mult),
                'medical_aid_people': int(event['affected'] * 0.15 * mult),
                'shelter_families': int(event['affected'] * 0.25 * mult),
                'duration_days': int(45 * mult),
                'response_time_hours': int(6 / mult),
                'total_cost_usd': int(event['affected'] * 100 * mult)
            })
        
        df = pd.DataFrame(disasters)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'historical_disasters_{timestamp}.csv'
        filepath = os.path.join(self.output_dir, filename)
        df.to_csv(filepath, index=False)
        
        print(f"Created sample dataset with {len(df)} disaster records")
        print(f"Saved to {filepath}")
        
        return df

def main():
    """Main execution function"""
    collector = HistoricalDataCollector()
    
    # Create sample historical dataset
    print("\n" + "="*60)
    print("Creating Sample Historical Dataset")
    print("="*60)
    historical_df = collector.create_sample_disaster_dataset()
    print(f"\nSample data:\n{historical_df.head()}")
    
    # Collect ReliefWeb data
    print("\n" + "="*60)
    print("Collecting ReliefWeb Data")
    print("="*60)
    reliefweb_df = collector.collect_reliefweb_disasters(limit=200)
    
    # Collect earthquake data
    print("\n" + "="*60)
    print("Collecting USGS Earthquake Data")
    print("="*60)
    earthquake_df = collector.collect_earthquake_data(days_back=365, min_magnitude=5.0)

if __name__ == "__main__":
    main()














