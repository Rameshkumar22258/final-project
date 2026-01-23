"""
Process Recent Indian Disasters JSON
Converts the recent disasters data to training-ready format
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime
import re

class RecentDisastersProcessor:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.input_file = self.root_dir / 'data' / 'historical' / 'recent_indian_disasters.json'
        self.output_dir = self.root_dir / 'data' / 'historical'
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def load_data(self):
        """Load the recent disasters JSON file"""
        if not self.input_file.exists():
            print(f"[ERROR] File not found: {self.input_file}")
            return None
        
        print(f"[OK] Loading {self.input_file.name}...")
        with open(self.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"[OK] Loaded disaster data")
        return data
    
    def parse_date(self, date_str):
        """Parse date string to year, month, day"""
        if not date_str:
            return 2020, 7, 1
        
        # Handle date ranges like "Jun–Sep 2025"
        if '–' in date_str or '-' in date_str:
            parts = date_str.split()
            year = None
            for part in parts:
                if part.isdigit() and len(part) == 4:
                    year = int(part)
                    break
            if year:
                return year, 7, 1  # Default to mid-year
            return 2020, 7, 1
        
        # Handle DD-MM-YYYY format
        if re.match(r'\d{2}-\d{2}-\d{4}', date_str):
            try:
                dt = datetime.strptime(date_str, '%d-%m-%Y')
                return dt.year, dt.month, dt.day
            except:
                pass
        
        # Handle "Aug 2018" format
        month_map = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }
        parts = date_str.lower().split()
        year = None
        month = 7
        for part in parts:
            if part in month_map:
                month = month_map[part]
            elif part.isdigit() and len(part) == 4:
                year = int(part)
        if year:
            return year, month, 1
        return 2020, 7, 1
    
    def standardize_disaster_type(self, disaster_type):
        """Convert to standard disaster type"""
        type_str = str(disaster_type).lower()
        
        if 'flood' in type_str or 'cloudburst' in type_str:
            return 'flood'
        elif 'cyclone' in type_str:
            return 'cyclone'
        elif 'landslide' in type_str or 'subsidence' in type_str:
            return 'landslide'
        elif 'earthquake' in type_str:
            return 'earthquake'
        elif 'drought' in type_str:
            return 'drought'
        elif 'wildfire' in type_str or 'fire' in type_str:
            return 'wildfire'
        elif 'tsunami' in type_str:
            return 'tsunami'
        else:
            return 'other'
    
    def calculate_severity(self, deaths, missing, severity_str):
        """Calculate severity level"""
        # Try to parse deaths
        deaths_num = 0
        if isinstance(deaths, int):
            deaths_num = deaths
        elif isinstance(deaths, str):
            # Extract number from strings like "Hundreds", "Thousands"
            if 'hundred' in deaths.lower():
                deaths_num = 200
            elif 'thousand' in deaths.lower():
                deaths_num = 2000
            else:
                try:
                    deaths_num = int(re.search(r'\d+', deaths).group())
                except:
                    deaths_num = 0
        
        # Check severity string
        severity_lower = str(severity_str).lower()
        if 'extreme' in severity_lower or deaths_num > 100:
            return 'critical'
        elif 'very high' in severity_lower or 'high' in severity_lower or deaths_num > 10:
            return 'high'
        elif 'moderate' in severity_lower or deaths_num > 0:
            return 'medium'
        else:
            return 'low'
    
    def extract_location_info(self, affected_places):
        """Extract city and state from affected places"""
        if not affected_places or len(affected_places) == 0:
            return {'city': 'Unknown', 'state': 'Unknown'}
        
        # Get first place
        place = affected_places[0]
        
        # Common Indian states
        states = [
            'Maharashtra', 'Kerala', 'Assam', 'West Bengal', 'Gujarat',
            'Tamil Nadu', 'Karnataka', 'Odisha', 'Bihar', 'Uttar Pradesh',
            'Uttarakhand', 'Himachal Pradesh', 'Punjab', 'Rajasthan',
            'Madhya Pradesh', 'Andhra Pradesh', 'Telangana', 'Jharkhand',
            'Chhattisgarh', 'Haryana', 'Delhi', 'Goa', 'Manipur', 'Meghalaya',
            'Mizoram', 'Nagaland', 'Tripura', 'Sikkim', 'Arunachal Pradesh',
            'Puducherry'
        ]
        
        city = 'Unknown'
        state = 'Unknown'
        
        # Try to find state
        for s in states:
            if s.lower() in place.lower():
                state = s
                # Extract city (usually before state or first part)
                parts = place.split(',')
                if len(parts) > 0:
                    city = parts[0].strip()
                break
        
        if state == 'Unknown' and len(place) > 0:
            city = place.split(',')[0].strip()
            # Try to infer state from city
            city_state_map = {
                'Mumbai': 'Maharashtra',
                'Kolkata': 'West Bengal',
                'Chennai': 'Tamil Nadu',
                'Delhi': 'Delhi',
                'Bangalore': 'Karnataka',
                'Hyderabad': 'Telangana',
                'Visakhapatnam': 'Andhra Pradesh',
                'Uttarkashi': 'Uttarakhand',
                'Joshimath': 'Uttarakhand'
            }
            if city in city_state_map:
                state = city_state_map[city]
        
        return {'city': city, 'state': state}
    
    def get_coordinates(self, city, state):
        """Get coordinates for location"""
        coords_db = {
            'Mumbai': (19.0760, 72.8777),
            'Kolkata': (22.5726, 88.3639),
            'Chennai': (13.0827, 80.2707),
            'Visakhapatnam': (17.6868, 83.2185),
            'Uttarkashi': (30.7268, 78.4354),
            'Joshimath': (30.5556, 79.5667),
            'Kerala': (10.8505, 76.2711),
            'Odisha': (20.9517, 85.0985),
            'West Bengal': (22.9868, 87.8550),
            'Himachal Pradesh': (31.1048, 77.1734),
            'Assam': (26.2006, 92.9376),
            'Bihar': (25.0961, 85.3131),
            'Uttar Pradesh': (26.8467, 80.9462),
            'Maharashtra': (19.7515, 75.7139),
            'Andhra Pradesh': (15.9129, 79.7400),
            'Telangana': (18.1124, 79.0193),
            'Tamil Nadu': (11.1271, 78.6569),
            'Puducherry': (11.9416, 79.8083)
        }
        
        if city in coords_db:
            lat, lng = coords_db[city]
            return lat, lng
        elif state in coords_db:
            lat, lng = coords_db[state]
            return lat, lng
        else:
            return 20.5937, 78.9629  # India center
    
    def parse_number(self, value):
        """Parse number from string or int"""
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            if value.lower() in ['unknown', 'several', 'dozens', 'hundreds', 'thousands']:
                # Estimate based on context
                if 'hundred' in value.lower():
                    return 200
                elif 'thousand' in value.lower():
                    return 2000
                elif 'dozen' in value.lower():
                    return 24
                elif 'several' in value.lower():
                    return 5
                else:
                    return 0
            # Try to extract number
            match = re.search(r'\d+', value)
            if match:
                return int(match.group())
        return 0
    
    def estimate_affected_population(self, deaths, missing, severity):
        """Estimate affected population"""
        deaths_num = self.parse_number(deaths)
        missing_num = self.parse_number(missing)
        
        # Base estimate: 1 death affects ~50 people, 1 missing affects ~20 people
        base_affected = (deaths_num * 50) + (missing_num * 20)
        
        # Adjust by severity
        severity_multiplier = {
            'critical': 10,
            'high': 5,
            'medium': 2,
            'low': 1
        }
        
        multiplier = severity_multiplier.get(severity, 2)
        affected = base_affected * multiplier
        
        # Minimum affected
        if affected < 100:
            affected = 1000
        
        return int(affected)
    
    def process_data(self):
        """Main processing pipeline"""
        print("="*80)
        print("PROCESSING RECENT INDIAN DISASTERS")
        print("="*80)
        
        data = self.load_data()
        if data is None:
            return None
        
        processed_data = []
        
        # Process last 10 years disasters
        if 'natural_disasters_india_last_10_years' in data:
            print(f"\n[1] Processing {len(data['natural_disasters_india_last_10_years'])} disasters from last 10 years...")
            for disaster in data['natural_disasters_india_last_10_years']:
                record = self.process_disaster(disaster)
                if record:
                    processed_data.append(record)
        
        # Process 2025 disasters
        if 'natural_disasters_2025_india' in data:
            print(f"\n[2] Processing {len(data['natural_disasters_2025_india'])} disasters from 2025...")
            for disaster in data['natural_disasters_2025_india']:
                record = self.process_disaster(disaster)
                if record:
                    processed_data.append(record)
        
        # Remove duplicates (same disaster might appear in both lists)
        seen = set()
        unique_data = []
        for record in processed_data:
            key = (record['disaster_name'], record['date'])
            if key not in seen:
                seen.add(key)
                unique_data.append(record)
        
        print(f"\n[3] Total unique disasters: {len(unique_data)}")
        
        # Create DataFrame
        df = pd.DataFrame(unique_data)
        
        # Save to CSV
        output_file = self.output_dir / 'recent_indian_disasters_processed.csv'
        df.to_csv(output_file, index=False)
        print(f"[OK] Saved to: {output_file}")
        
        # Save as JSON
        json_file = self.output_dir / 'recent_indian_disasters_processed.json'
        df.to_json(json_file, orient='records', date_format='iso')
        print(f"[OK] Saved JSON to: {json_file}")
        
        # Statistics
        print(f"\n[STATS]")
        print(f"  Disaster types: {df['disaster_type'].value_counts().to_dict()}")
        print(f"  Severity levels: {df['severity'].value_counts().to_dict()}")
        print(f"  Year range: {df['year'].min()} - {df['year'].max()}")
        print(f"  Total deaths: {df['casualties'].sum():,}")
        print(f"  Total affected: {df['affected_population'].sum():,}")
        
        return df
    
    def process_disaster(self, disaster):
        """Process a single disaster record"""
        try:
            # Parse date
            year, month, day = self.parse_date(disaster.get('date', ''))
            date_str = f"{year}-{month:02d}-{day:02d}"
            
            # Extract location
            affected_places = disaster.get('affected_places', [])
            location_info = self.extract_location_info(affected_places)
            coords = self.get_coordinates(location_info['city'], location_info['state'])
            
            # Standardize disaster type
            disaster_type = self.standardize_disaster_type(disaster.get('disaster_type', ''))
            
            # Calculate severity
            deaths = disaster.get('deaths', 0)
            missing = disaster.get('missing', 0)
            severity_str = disaster.get('severity', 'medium')
            severity = self.calculate_severity(deaths, missing, severity_str)
            
            # Parse numbers
            casualties = self.parse_number(deaths)
            injured = self.parse_number(disaster.get('injured', 0))
            missing_count = self.parse_number(missing)
            
            # Estimate affected population
            affected_population = self.estimate_affected_population(deaths, missing, severity)
            
            # Estimate affected area
            affected_area = max(10, affected_population / 1000) if affected_population > 0 else 50
            
            # Create record
            record = {
                'disaster_id': f"RECENT_{year}_{disaster.get('disaster_name', '').replace(' ', '_').upper()[:20]}",
                'disaster_name': disaster.get('disaster_name', 'Unknown Disaster'),
                'date': date_str,
                'year': year,
                'month': month,
                'day': day,
                'disaster_type': disaster_type,
                'location': ', '.join(affected_places) if affected_places else 'Unknown',
                'city': location_info['city'],
                'state': location_info['state'],
                'latitude': coords[0],
                'longitude': coords[1],
                'severity': severity,
                'affected_area_km2': affected_area,
                'casualties': casualties,
                'injured': injured,
                'missing': missing_count,
                'affected_population': affected_population,
                'major_impacts': '; '.join(disaster.get('major_impacts', [])),
                'magnitude': disaster.get('magnitude_or_intensity', ''),
                'source': 'recent_indian_disasters.json'
            }
            
            return record
            
        except Exception as e:
            print(f"[WARN] Error processing disaster {disaster.get('disaster_name', 'Unknown')}: {e}")
            return None

def main():
    processor = RecentDisastersProcessor()
    df = processor.process_data()
    
    if df is not None and len(df) > 0:
        print("\n" + "="*80)
        print("✅ PROCESSING COMPLETE!")
        print("="*80)
        print(f"\n📈 Processed {len(df)} recent Indian disasters!")
        print("\nFiles created:")
        print("  - ml_pipeline/data/historical/recent_indian_disasters_processed.csv")
        print("  - ml_pipeline/data/historical/recent_indian_disasters_processed.json")
        print("\nThis data can now be used for:")
        print("  - ML model training")
        print("  - Historical trends analysis")
        print("  - Disaster pattern recognition")
    else:
        print("\n❌ Processing failed or no data processed")

if __name__ == '__main__':
    main()

