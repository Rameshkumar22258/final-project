"""
Historical Disaster Data Scraper
Collects disaster data from various sources for ML training
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime
import os
import json

class HistoricalDataScraper:
    def __init__(self):
        self.output_dir = '../data/historical'
        os.makedirs(self.output_dir, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_reliefweb(self, limit=100):
        """
        Scrape disaster data from ReliefWeb API (FREE!)
        https://reliefweb.int/
        """
        print("\n" + "="*80)
        print("SCRAPING RELIEFWEB - INTERNATIONAL DISASTER DATABASE")
        print("="*80)
        
        base_url = 'https://api.reliefweb.int/v1/disasters'
        
        all_disasters = []
        offset = 0
        
        while offset < limit:
            try:
                params = {
                    'appname': 'swasthyasetu',
                    'profile': 'full',
                    'limit': 100,
                    'offset': offset,
                    'filter': {
                        'field': 'country.iso3',
                        'value': 'IND'  # India only
                    }
                }
                
                response = self.session.get(base_url, params={'appname': 'swasthyasetu', 'profile': 'full', 'limit': 100, 'offset': offset}, timeout=30)
                
                if response.status_code != 200:
                    print(f"⚠️  API returned {response.status_code}")
                    break
                
                data = response.json()
                disasters = data.get('data', [])
                
                if not disasters:
                    break
                
                for item in disasters:
                    fields = item.get('fields', {})
                    
                    disaster_data = {
                        'source': 'reliefweb',
                        'disaster_id': item.get('id'),
                        'name': fields.get('name', ''),
                        'disaster_type': fields.get('type', [{}])[0].get('name', '') if fields.get('type') else '',
                        'date': fields.get('date', {}).get('created', ''),
                        'country': 'India',
                        'description': fields.get('description', ''),
                        'status': fields.get('status', ''),
                        'url': fields.get('url', '')
                    }
                    
                    all_disasters.append(disaster_data)
                
                print(f"✓ Scraped {len(disasters)} disasters (offset: {offset})")
                offset += 100
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                print(f"❌ Error scraping ReliefWeb: {e}")
                break
        
        df = pd.DataFrame(all_disasters)
        if not df.empty:
            filename = f'reliefweb_india_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            filepath = os.path.join(self.output_dir, filename)
            df.to_csv(filepath, index=False)
            print(f"\n✅ Saved {len(df)} disasters to {filepath}")
        
        return df
    
    def scrape_gdelt_disasters(self, days_back=30):
        """
        Scrape GDELT (Global Database of Events, Language, and Tone)
        Free API with disaster data
        """
        print("\n" + "="*80)
        print("SCRAPING GDELT - GLOBAL EVENT DATABASE")
        print("="*80)
        
        # GDELT 2.0 Event Database
        # Query for Indian disasters
        
        all_events = []
        
        # This is a simplified version - GDELT has complex API
        # In production, use proper GDELT API client
        
        print("⚠️  GDELT scraping requires complex API - placeholder for now")
        print("   For production: Use GDELT BigQuery or API")
        
        return pd.DataFrame(all_events)
    
    def create_sample_historical_data(self):
        """
        Create sample historical disaster data for training
        Based on known Indian disasters 2015-2025
        """
        print("\n" + "="*80)
        print("CREATING SAMPLE HISTORICAL DATA")
        print("="*80)
        
        sample_disasters = [
            # Kerala Floods 2018
            {
                'disaster_id': 'IND_2018_001',
                'date': '2018-08-15',
                'disaster_type': 'flood',
                'location': 'Kerala',
                'city': 'Kochi',
                'state': 'Kerala',
                'latitude': 9.9312,
                'longitude': 76.2673,
                'severity': 'critical',
                'affected_area_km2': 15000,
                'casualties': 483,
                'injured': 1500,
                'displaced': 1400000,
                'buildings_damaged': 15000,
                'economic_loss_inr': 400000000000,  # 40,000 Crore
                'relief_food_packets': 4200000,
                'relief_water_liters': 14000000,
                'relief_medical_teams': 2800,
                'relief_rescue_personnel': 5600,
                'relief_shelters': 28000,
                'relief_financial_aid_inr': 35000000000,
                'duration_days': 14,
                'response_time_hours': 24
            },
            # Uttarakhand Flash Floods 2013
            {
                'disaster_id': 'IND_2013_001',
                'date': '2013-06-16',
                'disaster_type': 'flood',
                'location': 'Uttarakhand',
                'city': 'Kedarnath',
                'state': 'Uttarakhand',
                'latitude': 30.7346,
                'longitude': 79.0669,
                'severity': 'critical',
                'affected_area_km2': 4200,
                'casualties': 5700,
                'injured': 3000,
                'displaced': 110000,
                'buildings_damaged': 5000,
                'economic_loss_inr': 120000000000,
                'relief_food_packets': 330000,
                'relief_water_liters': 1100000,
                'relief_medical_teams': 220,
                'relief_rescue_personnel': 1100,
                'relief_shelters': 2200,
                'relief_financial_aid_inr': 10000000000,
                'duration_days': 21,
                'response_time_hours': 12
            },
            # Chennai Floods 2015
            {
                'disaster_id': 'IND_2015_001',
                'date': '2015-12-01',
                'disaster_type': 'flood',
                'location': 'Chennai',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'latitude': 13.0827,
                'longitude': 80.2707,
                'severity': 'high',
                'affected_area_km2': 1800,
                'casualties': 422,
                'injured': 1200,
                'displaced': 1800000,
                'buildings_damaged': 12000,
                'economic_loss_inr': 200000000000,
                'relief_food_packets': 5400000,
                'relief_water_liters': 18000000,
                'relief_medical_teams': 3600,
                'relief_rescue_personnel': 7200,
                'relief_shelters': 36000,
                'relief_financial_aid_inr': 45000000000,
                'duration_days': 10,
                'response_time_hours': 18
            },
            # Cyclone Fani 2019
            {
                'disaster_id': 'IND_2019_001',
                'date': '2019-05-03',
                'disaster_type': 'cyclone',
                'location': 'Odisha',
                'city': 'Puri',
                'state': 'Odisha',
                'latitude': 19.8135,
                'longitude': 85.8312,
                'severity': 'critical',
                'affected_area_km2': 25000,
                'casualties': 89,
                'injured': 450,
                'displaced': 1500000,
                'buildings_damaged': 50000,
                'economic_loss_inr': 240000000000,
                'relief_food_packets': 4500000,
                'relief_water_liters': 15000000,
                'relief_medical_teams': 3000,
                'relief_rescue_personnel': 6000,
                'relief_shelters': 30000,
                'relief_financial_aid_inr': 37500000000,
                'duration_days': 12,
                'response_time_hours': 6
            },
            # Mumbai Floods 2005
            {
                'disaster_id': 'IND_2005_001',
                'date': '2005-07-26',
                'disaster_type': 'flood',
                'location': 'Mumbai',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'severity': 'critical',
                'affected_area_km2': 600,
                'casualties': 1094,
                'injured': 2500,
                'displaced': 2000000,
                'buildings_damaged': 30000,
                'economic_loss_inr': 85000000000,
                'relief_food_packets': 6000000,
                'relief_water_liters': 20000000,
                'relief_medical_teams': 4000,
                'relief_rescue_personnel': 8000,
                'relief_shelters': 40000,
                'relief_financial_aid_inr': 50000000000,
                'duration_days': 7,
                'response_time_hours': 24
            },
            # Gujarat Earthquake 2001
            {
                'disaster_id': 'IND_2001_001',
                'date': '2001-01-26',
                'disaster_type': 'earthquake',
                'location': 'Gujarat',
                'city': 'Bhuj',
                'state': 'Gujarat',
                'latitude': 23.2420,
                'longitude': 69.6669,
                'severity': 'critical',
                'affected_area_km2': 30000,
                'casualties': 20000,
                'injured': 167000,
                'displaced': 6000000,
                'buildings_damaged': 370000,
                'economic_loss_inr': 200000000000,
                'relief_food_packets': 18000000,
                'relief_water_liters': 60000000,
                'relief_medical_teams': 12000,
                'relief_rescue_personnel': 24000,
                'relief_shelters': 120000,
                'relief_financial_aid_inr': 150000000000,
                'duration_days': 60,
                'response_time_hours': 12
            },
        ]
        
        # Add more recent disasters (2020-2025)
        recent_disasters = [
            {
                'disaster_id': 'IND_2023_001',
                'date': '2023-07-10',
                'disaster_type': 'flood',
                'location': 'Himachal Pradesh',
                'city': 'Shimla',
                'state': 'Himachal Pradesh',
                'latitude': 31.1048,
                'longitude': 77.1734,
                'severity': 'high',
                'affected_area_km2': 2500,
                'casualties': 78,
                'injured': 250,
                'displaced': 15000,
                'buildings_damaged': 850,
                'economic_loss_inr': 12000000000,
                'relief_food_packets': 45000,
                'relief_water_liters': 150000,
                'relief_medical_teams': 30,
                'relief_rescue_personnel': 150,
                'relief_shelters': 300,
                'relief_financial_aid_inr': 3750000000,
                'duration_days': 10,
                'response_time_hours': 8
            },
            {
                'disaster_id': 'IND_2024_001',
                'date': '2024-09-15',
                'disaster_type': 'landslide',
                'location': 'Wayanad',
                'city': 'Wayanad',
                'state': 'Kerala',
                'latitude': 11.6854,
                'longitude': 76.1320,
                'severity': 'high',
                'affected_area_km2': 150,
                'casualties': 156,
                'injured': 350,
                'displaced': 8000,
                'buildings_damaged': 420,
                'economic_loss_inr': 8000000000,
                'relief_food_packets': 24000,
                'relief_water_liters': 80000,
                'relief_medical_teams': 16,
                'relief_rescue_personnel': 80,
                'relief_shelters': 160,
                'relief_financial_aid_inr': 2000000000,
                'duration_days': 14,
                'response_time_hours': 6
            }
        ]
        
        sample_disasters.extend(recent_disasters)
        
        df = pd.DataFrame(sample_disasters)
        
        # Save to CSV
        filename = f'historical_disasters_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        filepath = os.path.join(self.output_dir, filename)
        df.to_csv(filepath, index=False)
        
        print(f"✅ Created {len(df)} sample historical disasters")
        print(f"✓ Saved to: {filepath}")
        print(f"\nDisaster types: {df['disaster_type'].value_counts().to_dict()}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
        
        return df
    
    def merge_all_sources(self):
        """
        Merge data from all sources
        """
        print("\n" + "="*80)
        print("MERGING ALL DATA SOURCES")
        print("="*80)
        
        all_data = []
        
        # Read all CSV files in the historical directory
        if os.path.exists(self.output_dir):
            csv_files = [f for f in os.listdir(self.output_dir) if f.endswith('.csv')]
            
            for csv_file in csv_files:
                filepath = os.path.join(self.output_dir, csv_file)
                try:
                    df = pd.read_csv(filepath)
                    all_data.append(df)
                    print(f"✓ Loaded: {csv_file} ({len(df)} records)")
                except Exception as e:
                    print(f"❌ Error loading {csv_file}: {e}")
        
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            
            # Remove duplicates
            combined_df = combined_df.drop_duplicates(subset=['disaster_id'], keep='first')
            
            # Save merged data
            merged_file = os.path.join(self.output_dir, 'merged_historical_disasters.csv')
            combined_df.to_csv(merged_file, index=False)
            
            print(f"\n✅ Merged {len(combined_df)} unique disasters")
            print(f"✓ Saved to: {merged_file}")
            
            return combined_df
        
        return pd.DataFrame()

def main():
    scraper = HistoricalDataScraper()
    
    print("="*80)
    print("HISTORICAL DISASTER DATA COLLECTION")
    print("="*80)
    
    # Create sample data first (for immediate testing)
    print("\n[1] Creating sample historical data...")
    sample_df = scraper.create_sample_historical_data()
    
    # Try to scrape ReliefWeb
    print("\n[2] Attempting to scrape ReliefWeb...")
    try:
        reliefweb_df = scraper.scrape_reliefweb(limit=200)
    except Exception as e:
        print(f"⚠️  ReliefWeb scraping failed: {e}")
        reliefweb_df = pd.DataFrame()
    
    # Merge all sources
    print("\n[3] Merging all sources...")
    merged_df = scraper.merge_all_sources()
    
    print("\n" + "="*80)
    print(f"✅ TOTAL HISTORICAL DISASTERS COLLECTED: {len(merged_df)}")
    print("="*80)
    
    if not merged_df.empty:
        print("\nData Summary:")
        print(f"  Date range: {merged_df['date'].min()} to {merged_df['date'].max()}")
        print(f"  Disaster types: {merged_df['disaster_type'].nunique()}")
        print(f"  States covered: {merged_df['state'].nunique() if 'state' in merged_df.columns else 'N/A'}")
        print(f"\nDisaster type breakdown:")
        if 'disaster_type' in merged_df.columns:
            print(merged_df['disaster_type'].value_counts().to_string())

if __name__ == '__main__':
    main()












