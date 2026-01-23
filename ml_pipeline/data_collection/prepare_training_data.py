"""
Prepare Training Data
Cleans and enriches historical data for ML model training
Estimates relief requirements where missing
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re

class TrainingDataPreparator:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / 'data' / 'historical'
    
    def load_merged_data(self):
        """Load merged historical data"""
        filepath = self.data_dir / 'merged_historical_disasters.csv'
        
        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            print("   Run historical_data_scraper.py first!")
            return None
        
        df = pd.read_csv(filepath)
        print(f"✓ Loaded {len(df)} disasters from merged data")
        return df
    
    def standardize_disaster_types(self, df):
        """Standardize disaster type names"""
        type_mapping = {
            'Flood': 'flood',
            'Flash Flood': 'flood',
            'Tropical Cyclone': 'cyclone',
            'Cyclone': 'cyclone',
            'Earthquake': 'earthquake',
            'Wild Fire': 'wildfire',
            'Wildfire': 'wildfire',
            'Landslide': 'landslide',
            'Drought': 'drought',
            'Storm Surge': 'tsunami',
            'Tsunami': 'tsunami',
            'Cold Wave': 'other',
            'Severe Local Storm': 'cyclone',
            'Epidemic': 'other',  # Filter out non-natural disasters
            'Technological Disaster': 'other',
            'Insect Infestation': 'other',
            'Volcano': 'other'
        }
        
        df['disaster_type'] = df['disaster_type'].map(type_mapping).fillna('other')
        
        # Filter out 'other' types (keep only natural disasters)
        df = df[df['disaster_type'] != 'other']
        
        print(f"✓ Standardized disaster types: {df['disaster_type'].nunique()} unique types")
        print(f"  After filtering: {len(df)} disasters")
        
        return df
    
    def extract_numbers_from_description(self, text):
        """Extract numbers from text description"""
        if pd.isna(text) or not isinstance(text, str):
            return {}
        
        numbers = {}
        
        # Extract casualties
        casualty_patterns = [
            r'(\d+(?:,\d+)?)\s+(?:killed|dead|deaths|casualties)',
            r'death\s+toll[:\s]+(\d+(?:,\d+)?)',
        ]
        for pattern in casualty_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                numbers['casualties'] = int(match.group(1).replace(',', ''))
                break
        
        # Extract injured
        injured_patterns = [
            r'(\d+(?:,\d+)?)\s+injured',
            r'(\d+(?:,\d+)?)\s+wounded',
        ]
        for pattern in injured_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                numbers['injured'] = int(match.group(1).replace(',', ''))
                break
        
        # Extract displaced/affected
        displaced_patterns = [
            r'(\d+(?:,\d+)?)\s+(?:displaced|evacuated|homeless)',
            r'(\d+(?:,\d+)?)\s+people\s+affected',
            r'affecting\s+(\d+(?:,\d+)?)',
        ]
        for pattern in displaced_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                numbers['displaced'] = int(match.group(1).replace(',', ''))
                break
        
        return numbers
    
    def estimate_severity(self, row):
        """Estimate severity level from casualties and displaced"""
        casualties = row.get('casualties', 0) or 0
        displaced = row.get('displaced', 0) or 0
        
        if casualties > 100 or displaced > 50000:
            return 'critical'
        elif casualties > 20 or displaced > 5000:
            return 'high'
        elif casualties > 5 or displaced > 500:
            return 'medium'
        else:
            return 'low'
    
    def estimate_relief_requirements(self, row):
        """
        Estimate relief requirements based on NDMA guidelines
        This is used when actual relief data is not available
        """
        disaster_type = row.get('disaster_type', 'flood')
        severity = row.get('severity', 'medium')
        displaced = row.get('displaced', 0) or 0
        casualties = row.get('casualties', 0) or 0
        
        # If displaced is 0, estimate from casualties
        if displaced == 0 and casualties > 0:
            displaced = casualties * 50  # Estimate: 1 casualty affects 50 people
        
        # If still 0, use minimum
        if displaced == 0:
            displaced = 500
        
        # Base requirements per person per day (NDMA guidelines)
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
        duration = 7  # Standard 7-day relief period
        
        return {
            'relief_food_packets': int(displaced * base['food'] * duration * multiplier),
            'relief_water_liters': int(displaced * base['water'] * duration * multiplier),
            'relief_medical_teams': max(1, int(displaced * base['medical_ratio'] * multiplier)),
            'relief_rescue_personnel': max(10, int(displaced * 0.02 * multiplier)),
            'relief_shelters': max(1, int(displaced * base['shelter_ratio'] * multiplier / 50)),
            'relief_financial_aid_inr': int(displaced * 25000 * multiplier),  # ₹25k per family
            'duration_days': duration
        }
    
    def prepare_for_training(self):
        """Main preparation pipeline"""
        print("="*80)
        print("PREPARING DATA FOR ML TRAINING")
        print("="*80)
        
        # Load data
        df = self.load_merged_data()
        if df is None:
            return None
        
        print(f"\n[1] Initial data: {len(df)} records")
        
        # Standardize disaster types
        df = self.standardize_disaster_types(df)
        print(f"[2] After filtering: {len(df)} records")
        
        # Extract numbers from descriptions
        print("\n[3] Extracting casualties and displaced from descriptions...")
        for idx, row in df.iterrows():
            if 'description' in df.columns:
                numbers = self.extract_numbers_from_description(row.get('description', ''))
                for key, value in numbers.items():
                    if key in df.columns and (pd.isna(df.at[idx, key]) or df.at[idx, key] == 0):
                        df.at[idx, key] = value
        
        # Fill missing casualties and displaced with 0
        df['casualties'] = df.get('casualties', 0).fillna(0).astype(int)
        df['displaced'] = df.get('displaced', 0).fillna(0).astype(int)
        df['injured'] = df.get('injured', 0).fillna(0).astype(int)
        
        # Estimate severity
        print("\n[4] Estimating severity levels...")
        df['severity'] = df.apply(self.estimate_severity, axis=1)
        
        # Estimate relief requirements
        print("\n[5] Estimating relief requirements...")
        relief_estimates = df.apply(self.estimate_relief_requirements, axis=1, result_type='expand')
        
        # Add relief columns to dataframe
        for col in relief_estimates.columns:
            df[col] = relief_estimates[col]
        
        # Add geographic defaults if missing
        if 'latitude' not in df.columns:
            df['latitude'] = 20.5937  # India center
        if 'longitude' not in df.columns:
            df['longitude'] = 78.9629
        
        if 'affected_area_km2' not in df.columns:
            df['affected_area_km2'] = 50  # Default
        
        # Fill missing values
        df['affected_area_km2'] = df['affected_area_km2'].fillna(50).astype(float)
        df['latitude'] = df['latitude'].fillna(20.5937).astype(float)
        df['longitude'] = df['longitude'].fillna(78.9629).astype(float)
        
        # Select final columns for training
        training_columns = [
            'disaster_id', 'date', 'disaster_type', 'location',
            'city', 'state', 'latitude', 'longitude',
            'severity', 'affected_area_km2',
            'casualties', 'injured', 'displaced',
            'relief_food_packets', 'relief_water_liters',
            'relief_medical_teams', 'relief_rescue_personnel',
            'relief_shelters', 'relief_financial_aid_inr',
            'duration_days'
        ]
        
        # Keep only available columns
        available_cols = [col for col in training_columns if col in df.columns]
        df_training = df[available_cols].copy()
        
        # Save prepared data
        output_file = self.data_dir / 'training_data_prepared.csv'
        df_training.to_csv(output_file, index=False)
        
        print(f"\n✅ Training data prepared: {len(df_training)} records")
        print(f"✓ Saved to: {output_file}")
        print(f"\nFeatures:")
        print(f"  Disaster types: {df_training['disaster_type'].value_counts().to_dict()}")
        print(f"  Severity levels: {df_training['severity'].value_counts().to_dict()}")
        print(f"  Date range: {df_training['date'].min()} to {df_training['date'].max()}")
        
        # Statistics
        print(f"\nRelief Statistics (averages):")
        for col in ['relief_food_packets', 'relief_water_liters', 'relief_medical_teams', 'relief_shelters']:
            if col in df_training.columns:
                avg = df_training[col].mean()
                print(f"  {col}: {avg:,.0f}")
        
        return df_training

def main():
    preparator = TrainingDataPreparator()
    df_prepared = preparator.prepare_for_training()
    
    if df_prepared is not None and len(df_prepared) >= 50:
        print("\n" + "="*80)
        print("✅ DATA READY FOR TRAINING!")
        print("="*80)
        print("\nNext step: Run training script")
        print("  cd ../")
        print("  python train_relief_model.py")
    else:
        print("\n⚠️  Not enough data for training")
        print(f"   Current: {len(df_prepared) if df_prepared is not None else 0} records")
        print("   Minimum: 50 records")
        print("   Recommended: 500+ records")

if __name__ == '__main__':
    main()












