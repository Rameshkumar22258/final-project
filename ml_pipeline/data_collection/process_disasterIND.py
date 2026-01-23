"""
Process disasterIND.csv (EM-DAT data) for ML training
Converts EM-DAT format to training-ready format
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json
from datetime import datetime

class DisasterINDProcessor:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.input_file = self.root_dir / 'disasterIND.csv'
        self.output_dir = Path(__file__).parent.parent / 'data' / 'historical'
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def load_disasterIND(self):
        """Load the disasterIND.csv file"""
        if not self.input_file.exists():
            print(f"❌ File not found: {self.input_file}")
            return None
        
        print(f"📂 Loading {self.input_file.name}...")
        df = pd.read_csv(self.input_file, encoding='utf-8', low_memory=False)
        print(f"✅ Loaded {len(df)} disaster records")
        return df
    
    def standardize_disaster_type(self, disaster_type, disaster_subtype):
        """Convert EM-DAT disaster types to our standard format"""
        type_str = str(disaster_type).lower() if pd.notna(disaster_type) else ''
        subtype_str = str(disaster_subtype).lower() if pd.notna(disaster_subtype) else ''
        
        # Map EM-DAT types to our types
        if 'flood' in type_str or 'flood' in subtype_str:
            return 'flood'
        elif 'earthquake' in type_str or 'ground movement' in subtype_str:
            return 'earthquake'
        elif 'cyclone' in type_str or 'tropical' in subtype_str:
            return 'cyclone'
        elif 'landslide' in type_str or 'landslide' in subtype_str:
            return 'landslide'
        elif 'drought' in type_str:
            return 'drought'
        elif 'wildfire' in type_str or 'fire' in type_str:
            return 'wildfire'
        elif 'tsunami' in type_str or 'tsunami' in subtype_str:
            return 'tsunami'
        elif 'avalanche' in type_str or 'avalanche' in subtype_str:
            return 'landslide'  # Group with landslides
        else:
            return None  # Filter out epidemics, biological, etc.
    
    def calculate_severity(self, deaths, affected):
        """Calculate severity from deaths and affected population"""
        deaths = float(deaths) if pd.notna(deaths) else 0
        affected = float(affected) if pd.notna(affected) else 0
        
        if deaths > 1000 or affected > 1000000:
            return 'critical'
        elif deaths > 100 or affected > 100000:
            return 'high'
        elif deaths > 10 or affected > 10000:
            return 'medium'
        else:
            return 'low'
    
    def estimate_relief_requirements(self, row):
        """Estimate relief requirements based on disaster characteristics"""
        disaster_type = row.get('disaster_type', 'flood')
        severity = row.get('severity', 'medium')
        affected = row.get('affected_population', 0) or 0
        deaths = row.get('casualties', 0) or 0
        
        # Use affected population, or estimate from deaths
        if affected == 0 and deaths > 0:
            affected = deaths * 50  # Estimate: 1 death affects 50 people
        
        if affected == 0:
            affected = 1000  # Minimum
        
        # Base requirements per person per day
        base_requirements = {
            'flood': {'food': 3, 'water': 10, 'medical_ratio': 0.01, 'shelter_ratio': 0.5},
            'earthquake': {'food': 3, 'water': 15, 'medical_ratio': 0.02, 'shelter_ratio': 0.8},
            'cyclone': {'food': 3, 'water': 12, 'medical_ratio': 0.015, 'shelter_ratio': 0.7},
            'landslide': {'food': 3, 'water': 10, 'medical_ratio': 0.025, 'shelter_ratio': 0.6},
            'wildfire': {'food': 3, 'water': 8, 'medical_ratio': 0.015, 'shelter_ratio': 0.5},
            'drought': {'food': 3, 'water': 20, 'medical_ratio': 0.005, 'shelter_ratio': 0.1},
            'tsunami': {'food': 3, 'water': 15, 'medical_ratio': 0.03, 'shelter_ratio': 0.9}
        }
        
        severity_multiplier = {
            'critical': 1.5,
            'high': 1.2,
            'medium': 1.0,
            'low': 0.7
        }
        
        base = base_requirements.get(disaster_type, base_requirements['flood'])
        multiplier = severity_multiplier.get(severity, 1.0)
        duration = 7  # 7 days relief period
        
        return {
            'relief_food_packets': int(affected * base['food'] * duration * multiplier),
            'relief_water_liters': int(affected * base['water'] * duration * multiplier),
            'relief_medical_teams': max(1, int(affected * base['medical_ratio'] * multiplier)),
            'relief_rescue_personnel': max(10, int(affected * 0.02 * multiplier)),
            'relief_shelters': max(1, int(affected * base['shelter_ratio'] * multiplier / 50)),
            'relief_financial_aid_inr': int(affected * 25000 * multiplier),
            'duration_days': duration
        }
    
    def extract_location_info(self, location_str):
        """Extract city and state from location string"""
        if pd.isna(location_str):
            return {'city': 'Unknown', 'state': 'Unknown'}
        
        location = str(location_str)
        
        # Common Indian states
        states = [
            'Maharashtra', 'Kerala', 'Assam', 'West Bengal', 'Gujarat',
            'Tamil Nadu', 'Karnataka', 'Odisha', 'Bihar', 'Uttar Pradesh',
            'Uttarakhand', 'Himachal Pradesh', 'Punjab', 'Rajasthan',
            'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Jharkhand',
            'Chhattisgarh', 'Haryana', 'Delhi', 'Goa', 'Manipur', 'Meghalaya',
            'Mizoram', 'Nagaland', 'Tripura', 'Sikkim', 'Arunachal Pradesh'
        ]
        
        city = 'Unknown'
        state = 'Unknown'
        
        # Try to find state
        for s in states:
            if s.lower() in location.lower():
                state = s
                # Extract city (usually before state or first part)
                parts = location.split(',')
                if len(parts) > 0:
                    city = parts[0].strip()
                break
        
        if state == 'Unknown' and len(location) > 0:
            city = location.split(',')[0].strip()
        
        return {'city': city, 'state': state}
    
    def process_data(self):
        """Main processing pipeline"""
        print("="*80)
        print("PROCESSING disasterIND.csv FOR ML TRAINING")
        print("="*80)
        
        # Load data
        df = self.load_disasterIND()
        if df is None:
            return None
        
        print(f"\n[1] Initial records: {len(df)}")
        
        # Filter: Only natural disasters, only India, recent data (2000+)
        df = df[df['Country'] == 'IND']
        df = df[df['Start Year'] >= 2000]  # Focus on recent data
        print(f"[2] After filtering (IND, 2000+): {len(df)} records")
        
        # Standardize disaster types
        print("\n[3] Standardizing disaster types...")
        df['disaster_type'] = df.apply(
            lambda row: self.standardize_disaster_type(
                row.get('Disaster Type', ''),
                row.get('Disaster Subtype', '')
            ),
            axis=1
        )
        
        # Filter out None types (non-natural disasters)
        df = df[df['disaster_type'].notna()]
        print(f"[4] After type filtering: {len(df)} records")
        
        # Extract key fields
        print("\n[5] Extracting and calculating features...")
        processed_data = []
        
        for idx, row in df.iterrows():
            # Extract location
            location_info = self.extract_location_info(row.get('Location', ''))
            
            # Get dates
            start_year = int(row.get('Start Year', 2000)) if pd.notna(row.get('Start Year')) else 2000
            start_month = int(row.get('Start Month', 7)) if pd.notna(row.get('Start Month')) else 7
            start_day = int(row.get('Start Day', 1)) if pd.notna(row.get('Start Day')) else 1
            
            # Create date string
            try:
                date_str = f"{start_year}-{int(start_month):02d}-{int(start_day):02d}"
            except:
                date_str = f"{start_year}-07-01"  # Default to mid-year
            
            # Get numeric values
            deaths = float(row.get('Total Deaths', 0)) if pd.notna(row.get('Total Deaths')) else 0
            affected = float(row.get('Total Affected', 0)) if pd.notna(row.get('Total Affected')) else 0
            homeless = float(row.get('No. Homeless', 0)) if pd.notna(row.get('No. Homeless')) else 0
            injured = float(row.get('No. Injured', 0)) if pd.notna(row.get('No. Injured')) else 0
            
            # Get coordinates
            lat = float(row.get('Latitude', 20.5937)) if pd.notna(row.get('Latitude')) else 20.5937
            lng = float(row.get('Longitude', 78.9629)) if pd.notna(row.get('Longitude')) else 78.9629
            
            # Get damage (convert from USD to INR, approximate)
            damage_usd = float(row.get('Total Damage, Adjusted (\'000 US$)', 0)) if pd.notna(row.get('Total Damage, Adjusted (\'000 US$)', 0)) else 0
            damage_inr = damage_usd * 83000  # Approximate conversion (1 USD = 83 INR, in thousands)
            
            # Calculate severity
            severity = self.calculate_severity(deaths, affected)
            
            # Estimate affected area (rough estimate)
            affected_area = max(10, affected / 1000) if affected > 0 else 50
            
            # Create record
            record = {
                'disaster_id': row.get('DisNo.', f'IND_{start_year}_{idx}'),
                'date': date_str,
                'disaster_type': row['disaster_type'],
                'location': row.get('Location', 'Unknown'),
                'city': location_info['city'],
                'state': location_info['state'],
                'latitude': lat,
                'longitude': lng,
                'severity': severity,
                'affected_area_km2': affected_area,
                'casualties': int(deaths),
                'injured': int(injured),
                'displaced': int(homeless) if homeless > 0 else int(affected * 0.1),  # Estimate 10% displaced
                'affected_population': int(affected),
                'financial_damage_inr': int(damage_inr),
                'event_name': row.get('Event Name', ''),
                'magnitude': row.get('Magnitude', ''),
                'magnitude_scale': row.get('Magnitude Scale', '')
            }
            
            # Estimate relief requirements
            relief = self.estimate_relief_requirements(record)
            record.update(relief)
            
            processed_data.append(record)
        
        # Create DataFrame
        df_processed = pd.DataFrame(processed_data)
        
        print(f"\n[6] Processed {len(df_processed)} disaster records")
        
        # Save to CSV
        output_file = self.output_dir / 'disasterIND_processed.csv'
        df_processed.to_csv(output_file, index=False)
        print(f"✅ Saved to: {output_file}")
        
        # Statistics
        print(f"\n📊 Statistics:")
        print(f"  Disaster types: {df_processed['disaster_type'].value_counts().to_dict()}")
        print(f"  Severity levels: {df_processed['severity'].value_counts().to_dict()}")
        print(f"  Year range: {df_processed['date'].str[:4].min()} - {df_processed['date'].str[:4].max()}")
        print(f"  Total affected: {df_processed['affected_population'].sum():,}")
        print(f"  Total casualties: {df_processed['casualties'].sum():,}")
        
        # Save as JSON for frontend
        json_file = self.output_dir / 'disasterIND_processed.json'
        df_processed.to_json(json_file, orient='records', date_format='iso')
        print(f"✅ Saved JSON to: {json_file}")
        
        return df_processed

def main():
    processor = DisasterINDProcessor()
    df = processor.process_data()
    
    if df is not None and len(df) > 0:
        print("\n" + "="*80)
        print("✅ PROCESSING COMPLETE!")
        print("="*80)
        print(f"\n📈 Ready for training with {len(df)} real historical disasters!")
        print("\nNext steps:")
        print("  1. Merge with other data sources (optional)")
        print("  2. Run: python ml_pipeline/train_relief_model.py")
    else:
        print("\n❌ Processing failed or no data processed")

if __name__ == '__main__':
    main()

