"""
Feature Engineering Module
Combines signals from multiple sources to create features for ML models
"""

import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import json
import os

class FeatureExtractor:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100)
        
        # Severity encoding
        self.severity_mapping = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }
        
        # Disaster type encoding
        self.disaster_type_mapping = {
            'flood': 1,
            'cyclone': 2,
            'earthquake': 3,
            'drought': 4,
            'fire': 5,
            'landslide': 6,
            'tsunami': 7,
            'tornado': 8,
            'unknown': 0
        }
        
        # Population density mapping
        self.density_mapping = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        
    def encode_categorical_features(self, df, columns):
        """
        Encode categorical features using label encoding
        
        Args:
            df: Input DataFrame
            columns: List of column names to encode
        
        Returns:
            DataFrame with encoded columns
        """
        df_encoded = df.copy()
        
        for col in columns:
            if col in df_encoded.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df_encoded[f'{col}_encoded'] = self.label_encoders[col].fit_transform(
                        df_encoded[col].fillna('unknown')
                    )
                else:
                    df_encoded[f'{col}_encoded'] = self.label_encoders[col].transform(
                        df_encoded[col].fillna('unknown')
                    )
        
        return df_encoded
    
    def create_severity_features(self, df):
        """Create numerical features from severity indicators"""
        df_features = df.copy()
        
        if 'severity' in df_features.columns:
            df_features['severity_numeric'] = df_features['severity'].map(
                self.severity_mapping
            ).fillna(2)  # Default to medium
        
        return df_features
    
    def create_disaster_type_features(self, df):
        """Create features from disaster type"""
        df_features = df.copy()
        
        if 'disaster_type' in df_features.columns:
            df_features['disaster_type_numeric'] = df_features['disaster_type'].map(
                self.disaster_type_mapping
            ).fillna(0)
        
        # Create one-hot encoding for disaster types
        if 'disaster_types' in df_features.columns:
            # Handle list column from text extraction
            disaster_dummies = pd.get_dummies(
                df_features['disaster_types'].apply(lambda x: x[0] if isinstance(x, list) else x),
                prefix='disaster'
            )
            df_features = pd.concat([df_features, disaster_dummies], axis=1)
        
        return df_features
    
    def create_location_features(self, df):
        """Create features from location data"""
        df_features = df.copy()
        
        # Encode location as categorical
        if 'location' in df_features.columns:
            df_features = self.encode_categorical_features(df_features, ['location'])
        
        # If we have lat/lon, create distance-based features
        if 'latitude' in df_features.columns and 'longitude' in df_features.columns:
            # Distance from major city centers (example: Delhi)
            delhi_lat, delhi_lon = 28.7041, 77.1025
            
            df_features['distance_from_delhi'] = np.sqrt(
                (df_features['latitude'] - delhi_lat)**2 +
                (df_features['longitude'] - delhi_lon)**2
            )
        
        return df_features
    
    def create_temporal_features(self, df, date_column='date'):
        """Create temporal features from date information"""
        df_features = df.copy()
        
        if date_column in df_features.columns:
            # Convert to datetime
            df_features[date_column] = pd.to_datetime(df_features[date_column], errors='coerce')
            
            # Extract temporal components
            df_features['year'] = df_features[date_column].dt.year
            df_features['month'] = df_features[date_column].dt.month
            df_features['day_of_year'] = df_features[date_column].dt.dayofyear
            df_features['quarter'] = df_features[date_column].dt.quarter
            
            # Cyclical encoding for month (important for seasonal patterns)
            df_features['month_sin'] = np.sin(2 * np.pi * df_features['month'] / 12)
            df_features['month_cos'] = np.cos(2 * np.pi * df_features['month'] / 12)
            
            # Monsoon season indicator (June-September in India)
            df_features['is_monsoon'] = df_features['month'].isin([6, 7, 8, 9]).astype(int)
        
        return df_features
    
    def create_text_features(self, df, text_column='cleaned_text'):
        """Create features from text data using TF-IDF"""
        df_features = df.copy()
        
        if text_column in df_features.columns:
            # Fill NaN values
            text_data = df_features[text_column].fillna('')
            
            # Create TF-IDF features
            try:
                tfidf_matrix = self.tfidf_vectorizer.fit_transform(text_data)
                
                # Convert to DataFrame
                tfidf_df = pd.DataFrame(
                    tfidf_matrix.toarray(),
                    columns=[f'tfidf_{i}' for i in range(tfidf_matrix.shape[1])]
                )
                
                df_features = pd.concat([df_features.reset_index(drop=True), tfidf_df], axis=1)
            except Exception as e:
                print(f"Error creating TF-IDF features: {str(e)}")
        
        # Text length features
        if text_column in df_features.columns:
            df_features['text_length'] = df_features[text_column].str.len()
            df_features['word_count'] = df_features[text_column].str.split().str.len()
        
        return df_features
    
    def create_urgency_features(self, df):
        """Create features from urgency indicators"""
        df_features = df.copy()
        
        if 'urgency' in df_features.columns:
            urgency_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            df_features['urgency_numeric'] = df_features['urgency'].map(urgency_map).fillna(2)
        
        return df_features
    
    def create_social_media_features(self, df):
        """Create features from social media metrics"""
        df_features = df.copy()
        
        # Engagement metrics
        if 'retweet_count' in df_features.columns:
            df_features['retweet_count_log'] = np.log1p(df_features['retweet_count'])
        
        if 'like_count' in df_features.columns:
            df_features['like_count_log'] = np.log1p(df_features['like_count'])
        
        if 'reply_count' in df_features.columns:
            df_features['reply_count_log'] = np.log1p(df_features['reply_count'])
        
        # Total engagement score
        engagement_cols = ['retweet_count', 'like_count', 'reply_count']
        available_cols = [col for col in engagement_cols if col in df_features.columns]
        
        if available_cols:
            df_features['total_engagement'] = df_features[available_cols].fillna(0).sum(axis=1)
            df_features['total_engagement_log'] = np.log1p(df_features['total_engagement'])
        
        # Verified user indicator
        if 'verified' in df_features.columns:
            df_features['is_verified'] = df_features['verified'].astype(int)
        
        return df_features
    
    def create_weather_features(self, df):
        """Create features from weather data"""
        df_features = df.copy()
        
        weather_cols = [
            'temperature', 'humidity', 'wind_speed', 'pressure',
            'rainfall_mm', 'clouds', 'visibility'
        ]
        
        for col in weather_cols:
            if col in df_features.columns:
                # Normalize weather features
                df_features[f'{col}_normalized'] = (
                    df_features[col] - df_features[col].mean()
                ) / df_features[col].std()
        
        # Extreme weather indicators
        if 'rainfall_mm' in df_features.columns:
            df_features['heavy_rain'] = (df_features['rainfall_mm'] > 100).astype(int)
            df_features['extreme_rain'] = (df_features['rainfall_mm'] > 200).astype(int)
        
        if 'wind_speed' in df_features.columns:
            df_features['high_wind'] = (df_features['wind_speed'] > 50).astype(int)
            df_features['extreme_wind'] = (df_features['wind_speed'] > 100).astype(int)
        
        if 'temperature' in df_features.columns:
            df_features['heat_wave'] = (df_features['temperature'] > 40).astype(int)
        
        return df_features
    
    def create_population_features(self, df):
        """Create features from population data"""
        df_features = df.copy()
        
        if 'people_affected' in df_features.columns:
            df_features['people_affected_log'] = np.log1p(df_features['people_affected'])
        
        if 'populationDensity' in df_features.columns or 'population_density' in df_features.columns:
            density_col = 'populationDensity' if 'populationDensity' in df_features.columns else 'population_density'
            df_features['density_numeric'] = df_features[density_col].map(
                self.density_mapping
            ).fillna(2)
        
        return df_features
    
    def create_target_features(self, df):
        """
        Create target variables for prediction
        These are the relief demand quantities we want to predict
        """
        df_features = df.copy()
        
        # Ensure target columns exist
        target_columns = [
            'food_required_tons',
            'water_required_liters',
            'medical_aid_people',
            'shelter_families'
        ]
        
        for col in target_columns:
            if col not in df_features.columns:
                df_features[col] = 0
        
        return df_features
    
    def engineer_all_features(self, df, feature_types='all'):
        """
        Apply all feature engineering steps
        
        Args:
            df: Input DataFrame
            feature_types: 'all' or list of specific feature types
        
        Returns:
            DataFrame with engineered features
        """
        print("Engineering features...")
        
        df_features = df.copy()
        
        # Apply all feature engineering methods
        df_features = self.create_severity_features(df_features)
        print("✓ Severity features created")
        
        df_features = self.create_disaster_type_features(df_features)
        print("✓ Disaster type features created")
        
        df_features = self.create_location_features(df_features)
        print("✓ Location features created")
        
        if 'date' in df_features.columns or 'timestamp' in df_features.columns:
            date_col = 'date' if 'date' in df_features.columns else 'timestamp'
            df_features = self.create_temporal_features(df_features, date_col)
            print("✓ Temporal features created")
        
        if 'cleaned_text' in df_features.columns:
            df_features = self.create_text_features(df_features)
            print("✓ Text features created")
        
        df_features = self.create_urgency_features(df_features)
        print("✓ Urgency features created")
        
        if any(col in df_features.columns for col in ['retweet_count', 'like_count']):
            df_features = self.create_social_media_features(df_features)
            print("✓ Social media features created")
        
        if any(col in df_features.columns for col in ['temperature', 'rainfall_mm']):
            df_features = self.create_weather_features(df_features)
            print("✓ Weather features created")
        
        df_features = self.create_population_features(df_features)
        print("✓ Population features created")
        
        df_features = self.create_target_features(df_features)
        print("✓ Target features created")
        
        return df_features
    
    def save_features(self, df, output_dir='../backend/data/processed'):
        """Save engineered features to file"""
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'engineered_features_{timestamp}.csv'
        filepath = os.path.join(output_dir, filename)
        
        df.to_csv(filepath, index=False)
        print(f"\nSaved engineered features to {filepath}")
        
        return filepath

def main():
    """Test feature engineering"""
    # Create sample data
    sample_data = {
        'disaster_type': ['flood', 'cyclone', 'earthquake'],
        'location': ['Mumbai', 'Gujarat', 'Nepal'],
        'severity': ['high', 'critical', 'critical'],
        'people_affected': [100000, 500000, 800000],
        'date': ['2023-07-15', '2023-06-15', '2015-04-25'],
        'cleaned_text': [
            'flood mumbai urgent help needed',
            'cyclone biparjoy gujarat evacuation shelter',
            'earthquake nepal rescue medical emergency'
        ],
        'urgency': ['high', 'critical', 'critical'],
        'retweet_count': [1500, 5000, 10000],
        'like_count': [2000, 7000, 15000]
    }
    
    df = pd.DataFrame(sample_data)
    
    print("Sample Input Data:")
    print(df)
    print("\n" + "="*60 + "\n")
    
    # Apply feature engineering
    extractor = FeatureExtractor()
    df_engineered = extractor.engineer_all_features(df)
    
    print("\n" + "="*60)
    print(f"Original columns: {len(df.columns)}")
    print(f"Engineered columns: {len(df_engineered.columns)}")
    print(f"\nNew feature columns created: {len(df_engineered.columns) - len(df.columns)}")
    print(f"\nSample engineered features:")
    print(df_engineered[[
        'disaster_type_numeric', 'severity_numeric',
        'urgency_numeric', 'people_affected_log', 'month', 'is_monsoon'
    ]].head())

if __name__ == "__main__":
    main()














