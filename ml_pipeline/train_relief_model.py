"""
Train Relief Prediction Models
Uses historical disaster data to train high-accuracy ML models
Target: R² > 0.85, MAPE < 15%
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_absolute_percentage_error, mean_squared_error
import xgboost as xgb
import joblib
import os
from pathlib import Path
import json
from datetime import datetime

class ReliefModelTrainer:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_names = []
        self.model_dir = Path(__file__).parent / 'models' / 'trained'
        self.model_dir.mkdir(parents=True, exist_ok=True)
    
    def load_historical_data(self):
        """Load prepared training disaster data - PRIORITIZES ACTUAL RELIEF DATA"""
        data_dir = Path(__file__).parent / 'data' / 'historical'
        
        # STEP 1: Load ACTUAL relief data (highest priority - real government data)
        actual_data_path = data_dir / 'disasters_with_relief_data.json'
        actual_data_list = []
        
        if actual_data_path.exists():
            print("\n[PRIORITY] Loading ACTUAL relief data from government reports...")
            with open(actual_data_path, 'r', encoding='utf-8') as f:
                actual_data = json.load(f)
            
            disasters = actual_data.get('india_disasters_with_relief_data', [])
            for disaster in disasters:
                # Convert actual data to training format
                record = {
                    'disaster_name': disaster.get('disaster_name', ''),
                    'year': disaster.get('year', 2020),
                    'date': f"{disaster.get('year', 2020)}-01-01",
                    'disaster_type': disaster.get('disaster_type', 'flood'),
                    'city': disaster.get('location', {}).get('city', ''),
                    'state': disaster.get('location', {}).get('state', ''),
                    'people_affected': disaster.get('people_affected', 0),
                    'displaced': disaster.get('people_affected', 0),
                    'casualties': 0,  # Will be filled if available
                    'affected_area_km2': 0,  # Will be estimated
                    # ACTUAL RELIEF DATA (not calculated!)
                    'relief_food_packets': disaster.get('food_packets_distributed') or 0,
                    'relief_water_liters': disaster.get('water_liters') or 0,
                    'relief_medical_teams': disaster.get('medical_teams_deployed') or 0,
                    'relief_rescue_personnel': disaster.get('rescue_teams_deployed') or 0,
                    'relief_shelters': 0,  # Not always available
                    'relief_financial_aid_inr': disaster.get('government_financial_aid') or 0,
                    'data_source': 'actual_relief_data'  # Mark as actual data
                }
                
                # Only add if has actual relief data
                if (record['relief_food_packets'] > 0 or 
                    record['relief_water_liters'] > 0 or 
                    record['relief_medical_teams'] > 0):
                    actual_data_list.append(record)
            
            print(f"[OK] Loaded {len(actual_data_list)} disasters with ACTUAL relief data")
        
        # STEP 2: Load other data sources (calculated/estimated)
        data_sources = [
            'training_data_prepared.csv',
            'recent_indian_disasters_processed.csv',
            'disasterIND_processed.csv',
            'merged_historical_disasters.csv'
        ]
        
        df = None
        loaded_sources = []
        
        for source in data_sources:
            data_path = data_dir / source
            if data_path.exists():
                df_source = pd.read_csv(data_path)
                print(f"[OK] Loaded {len(df_source)} disasters from {source}")
                
                if df is None:
                    df = df_source
                else:
                    df = pd.concat([df, df_source], ignore_index=True)
                    print(f"[OK] Merged with {source}: Total {len(df)} records")
                
                loaded_sources.append(source)
        
        # STEP 3: Combine actual data with other sources
        if actual_data_list:
            df_actual = pd.DataFrame(actual_data_list)
            if df is not None:
                df = pd.concat([df_actual, df], ignore_index=True)
                print(f"[OK] Combined actual data with other sources: Total {len(df)} records")
            else:
                df = df_actual
                print(f"[OK] Using only actual relief data: {len(df)} records")
        
        if df is None:
            print(f"⚠️  Historical data not found in {data_dir}")
            print("   Run process_recent_disasters.py or process_disasterIND.py first!")
            return None
        
        # Remove duplicates - prioritize actual data
        if 'disaster_name' in df.columns:
            initial_count = len(df)
            # Mark actual data
            if 'data_source' not in df.columns:
                df['data_source'] = 'calculated'
            
            # Remove duplicates, keeping actual data first
            df = df.sort_values('data_source', ascending=True)  # 'actual' < 'calculated'
            df = df.drop_duplicates(subset=['disaster_name', 'year'], keep='first')
            if len(df) < initial_count:
                print(f"[OK] Removed {initial_count - len(df)} duplicate records (kept actual data)")
        
        actual_count = len(df[df.get('data_source', '') == 'actual_relief_data']) if 'data_source' in df.columns else 0
        print(f"\n[SUMMARY] Total unique disasters: {len(df)}")
        print(f"  ✅ Actual relief data: {actual_count} disasters (from government reports)")
        print(f"  📊 Calculated/estimated: {len(df) - actual_count} disasters")
        print(f"  Sources: {', '.join(loaded_sources)}")
        
        return df
    
    def prepare_features(self, df):
        """
        Extract and engineer features for training
        """
        print("\n" + "="*80)
        print("FEATURE ENGINEERING")
        print("="*80)
        
        # Initialize encoders
        disaster_type_encoder = LabelEncoder()
        severity_encoder = LabelEncoder()
        
        # Encode categorical variables
        df['disaster_type_encoded'] = disaster_type_encoder.fit_transform(df['disaster_type'])
        self.encoders['disaster_type'] = disaster_type_encoder
        
        if 'severity' in df.columns:
            df['severity_encoded'] = severity_encoder.fit_transform(df['severity'])
            self.encoders['severity'] = severity_encoder
        else:
            # Create severity from casualties and displaced
            df['severity_encoded'] = df.apply(self.calculate_severity_from_data, axis=1)
        
        # Extract temporal features
        df['date'] = pd.to_datetime(df['date'], format='ISO8601', errors='coerce')
        
        # Drop rows with invalid dates or fill with median month
        if df['date'].isna().any():
            print(f"   ⚠️  {df['date'].isna().sum()} rows have invalid dates, using default month")
            df['month'] = df['date'].dt.month.fillna(7)  # Default to July (monsoon)
        else:
            df['month'] = df['date'].dt.month
        
        df['season'] = df['month'].apply(self.get_season)
        
        # Geographic features
        if 'latitude' not in df.columns:
            df['latitude'] = 20.0  # Default India center
        if 'longitude' not in df.columns:
            df['longitude'] = 78.0
        
        # Feature selection
        self.feature_names = [
            'disaster_type_encoded',
            'severity_encoded',
            'affected_area_km2',
            'displaced',
            'casualties',
            'latitude',
            'longitude',
            'month',
            'season'
        ]
        
        # Fill missing values
        for col in self.feature_names:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median() if df[col].dtype in ['float64', 'int64'] else 0)
        
        # Extract features
        X = df[self.feature_names].copy()
        
        # Target variables (relief requirements)
        target_columns = [
            'relief_food_packets',
            'relief_water_liters',
            'relief_medical_teams',
            'relief_shelters',
            'relief_financial_aid_inr'
        ]
        
        # Ensure target columns exist
        for col in target_columns:
            if col not in df.columns:
                print(f"⚠️  Missing target column: {col}")
                df[col] = 0
        
        y = df[target_columns].copy()
        
        print(f"[OK] Features prepared: {len(self.feature_names)} features")
        print(f"[OK] Target variables: {len(target_columns)} outputs")
        print(f"[OK] Training samples: {len(X)}")
        
        return X, y
    
    def calculate_severity_from_data(self, row):
        """Calculate severity level from casualties and displaced"""
        casualties = row.get('casualties', 0) or 0
        displaced = row.get('displaced', 0) or 0
        
        if casualties > 100 or displaced > 50000:
            return 3  # critical
        elif casualties > 20 or displaced > 5000:
            return 2  # high
        elif casualties > 0 or displaced > 500:
            return 1  # medium
        else:
            return 0  # low
    
    def get_season(self, month):
        """Get season from month (India)"""
        if month in [12, 1, 2]:
            return 0  # Winter
        elif month in [3, 4, 5]:
            return 1  # Summer
        elif month in [6, 7, 8, 9]:
            return 2  # Monsoon
        else:
            return 3  # Post-monsoon
    
    def train_models(self, X, y):
        """
        Train separate models for each relief type
        Uses XGBoost for best accuracy
        """
        print("\n" + "="*80)
        print("TRAINING ML MODELS")
        print("="*80)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        self.scalers['features'] = scaler
        
        # Train model for each target variable
        results = {}
        
        for target_col in y.columns:
            print(f"\n{'='*80}")
            print(f"Training model for: {target_col}")
            print(f"{'='*80}")
            
            # Prepare target
            y_train_target = y_train[target_col]
            y_test_target = y_test[target_col]
            
            # Try XGBoost (best for tabular data)
            print("\n[1] Training XGBoost...")
            xgb_model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=7,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            xgb_model.fit(X_train_scaled, y_train_target)
            
            # Evaluate
            y_pred = xgb_model.predict(X_test_scaled)
            r2 = r2_score(y_test_target, y_pred)
            mae = mean_absolute_error(y_test_target, y_pred)
            mape = mean_absolute_percentage_error(y_test_target, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test_target, y_pred))
            
            # Cross-validation
            cv_scores = cross_val_score(xgb_model, X_train_scaled, y_train_target, cv=5, scoring='r2')
            cv_mean = cv_scores.mean()
            cv_std = cv_scores.std()
            
            print(f"\nXGBoost Results:")
            print(f"  R2 Score: {r2:.4f} {'[PASS]' if r2 > 0.85 else '[WARN]'} (Target: > 0.85)")
            print(f"  MAPE: {mape*100:.2f}% {'[PASS]' if mape < 0.15 else '[WARN]'} (Target: < 15%)")
            print(f"  MAE: {mae:.2f}")
            print(f"  RMSE: {rmse:.2f}")
            print(f"  CV R2 Score: {cv_mean:.4f} +/- {cv_std:.4f}")
            
            # Save best model
            self.models[target_col] = xgb_model
            results[target_col] = {
                'r2': float(r2),
                'mape': float(mape),
                'mae': float(mae),
                'rmse': float(rmse),
                'cv_mean': float(cv_mean),
                'cv_std': float(cv_std),
                'passed': bool(r2 > 0.85 and mape < 0.15)
            }
            
            # Try Random Forest as backup
            if r2 < 0.85:
                print("\n[2] Trying Random Forest...")
                rf_model = RandomForestRegressor(
                    n_estimators=200,
                    max_depth=15,
                    min_samples_split=5,
                    random_state=42,
                    n_jobs=-1
                )
                rf_model.fit(X_train_scaled, y_train_target)
                
                y_pred_rf = rf_model.predict(X_test_scaled)
                r2_rf = r2_score(y_test_target, y_pred_rf)
                mape_rf = mean_absolute_percentage_error(y_test_target, y_pred_rf)
                
                print(f"\nRandom Forest Results:")
                print(f"  R2 Score: {r2_rf:.4f}")
                print(f"  MAPE: {mape_rf*100:.2f}%")
                
                if r2_rf > r2:
                    print("  [OK] Random Forest performs better, using it")
                    self.models[target_col] = rf_model
                    results[target_col]['r2'] = float(r2_rf)
                    results[target_col]['mape'] = float(mape_rf)
                    results[target_col]['passed'] = bool(r2_rf > 0.85 and mape_rf < 0.15)
        
        return results, X_test_scaled, y_test
    
    def save_models(self):
        """Save trained models to disk"""
        print("\n" + "="*80)
        print("SAVING MODELS")
        print("="*80)
        
        # Save each model
        for name, model in self.models.items():
            model_file = self.model_dir / f'{name}_model.pkl'
            joblib.dump(model, model_file)
            print(f"[OK] Saved: {model_file}")
        
        # Save scaler
        scaler_file = self.model_dir / 'feature_scaler.pkl'
        joblib.dump(self.scalers['features'], scaler_file)
        print(f"[OK] Saved: {scaler_file}")
        
        # Save encoders
        encoders_file = self.model_dir / 'encoders.pkl'
        joblib.dump(self.encoders, encoders_file)
        print(f"[OK] Saved: {encoders_file}")
        
        # Save feature names
        features_file = self.model_dir / 'feature_names.json'
        with open(features_file, 'w') as f:
            json.dump(self.feature_names, f)
        print(f"[OK] Saved: {features_file}")
    
    def generate_evaluation_report(self, results, X_test, y_test):
        """Generate detailed evaluation report"""
        print("\n" + "="*80)
        print("MODEL EVALUATION REPORT")
        print("="*80)
        
        report = {
            'training_date': datetime.now().isoformat(),
            'n_samples': len(X_test),
            'n_features': len(self.feature_names),
            'models': {}
        }
        
        overall_r2 = []
        overall_mape = []
        
        for target, metrics in results.items():
            report['models'][target] = metrics
            overall_r2.append(metrics['r2'])
            overall_mape.append(metrics['mape'])
            
            status = "[PASSED]" if metrics['passed'] else "[NEEDS IMPROVEMENT]"
            print(f"\n{target}:")
            print(f"  R²: {metrics['r2']:.4f} | MAPE: {metrics['mape']*100:.2f}% | {status}")
        
        # Overall metrics
        avg_r2 = np.mean(overall_r2)
        avg_mape = np.mean(overall_mape)
        
        report['overall'] = {
            'average_r2': float(avg_r2),
            'average_mape': float(avg_mape),
            'passed': bool(avg_r2 > 0.85 and avg_mape < 0.15)
        }
        
        print(f"\n{'='*80}")
        print("OVERALL PERFORMANCE")
        print(f"{'='*80}")
        print(f"Average R² Score: {avg_r2:.4f} {'✅' if avg_r2 > 0.85 else '⚠️'}")
        print(f"Average MAPE: {avg_mape*100:.2f}% {'✅' if avg_mape < 0.15 else '⚠️'}")
        print(f"\nTarget Achieved: {'✅ YES' if report['overall']['passed'] else '⚠️  NOT YET'}")
        
        # Save report (convert numpy types to native Python types)
        report_file = self.model_dir / 'evaluation_report.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=lambda x: float(x) if hasattr(x, 'item') else str(x))
        print(f"\n[OK] Report saved to: {report_file}")
        
        return report

def main():
    print("="*80)
    print("RELIEF PREDICTION MODEL TRAINING")
    print("Target: R² > 0.85, MAPE < 15%")
    print("="*80)
    
    trainer = ReliefModelTrainer()
    
    # Load data
    print("\n[1] Loading historical disaster data...")
    df = trainer.load_historical_data()
    
    if df is None or len(df) < 50:
        print("\n❌ ERROR: Not enough historical data for training")
        print("   Minimum required: 50 disasters")
        print("   Recommended: 500+ disasters")
        print("\n   Run: python data_collection/historical_data_scraper.py")
        return
    
    # Prepare features
    print("\n[2] Preparing features...")
    X, y = trainer.prepare_features(df)
    
    if len(X) == 0:
        print("❌ ERROR: No valid data after feature preparation")
        return
    
    # Train models
    print("\n[3] Training models...")
    results, X_test, y_test = trainer.train_models(X, y)
    
    # Save models
    print("\n[4] Saving models...")
    trainer.save_models()
    
    # Generate report
    print("\n[5] Generating evaluation report...")
    report = trainer.generate_evaluation_report(results, X_test, y_test)
    
    # Final summary
    print("\n" + "="*80)
    print("✅ TRAINING COMPLETE")
    print("="*80)
    print(f"Models trained: {len(trainer.models)}")
    print(f"Models saved to: {trainer.model_dir}")
    print(f"\nTo use trained models:")
    print("  1. Restart backend server")
    print("  2. Models will automatically load")
    print("  3. Predictions will now use ML instead of rules")
    print("\n" + "="*80)

if __name__ == '__main__':
    main()

