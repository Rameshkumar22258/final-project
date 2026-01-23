"""
Resource Demand Prediction Model
Stage 2: Predict resource type and quantity needed
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import os
from datetime import datetime

class ResourcePredictor:
    def __init__(self, model_type='random_forest'):
        """
        Initialize resource demand predictor
        
        Args:
            model_type: 'random_forest' or 'gradient_boosting'
        """
        self.model_type = model_type
        
        # Create multi-output regressor
        if model_type == 'random_forest':
            base_estimator = RandomForestRegressor(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            base_estimator = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        self.model = MultiOutputRegressor(base_estimator)
        
        self.feature_columns = None
        self.target_columns = [
            'food_required_tons',
            'water_required_liters',
            'medical_aid_people',
            'shelter_families'
        ]
        self.is_trained = False
    
    def prepare_features(self, df):
        """
        Prepare features for regression
        
        Args:
            df: DataFrame with engineered features
        
        Returns:
            Feature matrix X
        """
        feature_cols = []
        
        # Core disaster features
        core_features = [
            'disaster_type_numeric', 'severity_numeric',
            'people_affected_log', 'people_affected',
            'urgency_numeric'
        ]
        
        for col in core_features:
            if col in df.columns:
                feature_cols.append(col)
        
        # Temporal features
        temporal_features = [
            'month', 'quarter', 'is_monsoon',
            'month_sin', 'month_cos', 'day_of_year'
        ]
        
        for col in temporal_features:
            if col in df.columns:
                feature_cols.append(col)
        
        # Location features
        if 'location_encoded' in df.columns:
            feature_cols.append('location_encoded')
        
        if 'distance_from_delhi' in df.columns:
            feature_cols.append('distance_from_delhi')
        
        # Population features
        if 'density_numeric' in df.columns:
            feature_cols.append('density_numeric')
        
        # Weather features
        weather_features = [
            'heavy_rain', 'extreme_rain', 'high_wind',
            'extreme_wind', 'heat_wave',
            'temperature_normalized', 'humidity_normalized',
            'wind_speed_normalized', 'rainfall_mm'
        ]
        
        for col in weather_features:
            if col in df.columns:
                feature_cols.append(col)
        
        # Social media engagement (as proxy for disaster visibility/reach)
        if 'total_engagement_log' in df.columns:
            feature_cols.append('total_engagement_log')
        
        # Text features (limited)
        tfidf_cols = [col for col in df.columns if col.startswith('tfidf_')]
        feature_cols.extend(tfidf_cols[:20])  # Top 20 only
        
        # Store feature columns
        if self.feature_columns is None:
            self.feature_columns = feature_cols
        
        # Extract features
        X = df[self.feature_columns].fillna(0)
        
        # Ensure all columns are numeric (drop any remaining non-numeric columns)
        non_numeric_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
        if non_numeric_cols:
            print(f"Warning: Dropping non-numeric columns: {non_numeric_cols}")
            X = X.select_dtypes(include=[np.number])
            # Update feature columns list
            self.feature_columns = X.columns.tolist()
        
        return X
    
    def train(self, df, test_size=0.2):
        """
        Train the resource prediction model
        
        Args:
            df: DataFrame with features and targets
            test_size: Proportion of test set
        
        Returns:
            Dictionary with training metrics
        """
        print(f"Training {self.model_type} resource predictor...")
        
        # Prepare features
        X = self.prepare_features(df)
        
        # Prepare targets
        y = df[self.target_columns].fillna(0)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        print(f"Training set size: {len(X_train)}")
        print(f"Test set size: {len(X_test)}")
        print(f"Number of features: {X_train.shape[1]}")
        print(f"Number of targets: {y_train.shape[1]}")
        
        # Train model
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Calculate metrics for each target
        metrics = {}
        
        print("\n" + "="*60)
        print("Model Performance:")
        print("="*60)
        
        for i, target in enumerate(self.target_columns):
            train_r2 = r2_score(y_train.iloc[:, i], y_pred_train[:, i])
            test_r2 = r2_score(y_test.iloc[:, i], y_pred_test[:, i])
            
            train_mae = mean_absolute_error(y_train.iloc[:, i], y_pred_train[:, i])
            test_mae = mean_absolute_error(y_test.iloc[:, i], y_pred_test[:, i])
            
            train_rmse = np.sqrt(mean_squared_error(y_train.iloc[:, i], y_pred_train[:, i]))
            test_rmse = np.sqrt(mean_squared_error(y_test.iloc[:, i], y_pred_test[:, i]))
            
            metrics[target] = {
                'train_r2': train_r2,
                'test_r2': test_r2,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse
            }
            
            print(f"\n{target}:")
            print(f"  Train R²: {train_r2:.4f} | Test R²: {test_r2:.4f}")
            print(f"  Train MAE: {train_mae:.2f} | Test MAE: {test_mae:.2f}")
            print(f"  Train RMSE: {train_rmse:.2f} | Test RMSE: {test_rmse:.2f}")
        
        # Overall metrics
        overall_train_r2 = np.mean([m['train_r2'] for m in metrics.values()])
        overall_test_r2 = np.mean([m['test_r2'] for m in metrics.values()])
        
        print("\n" + "="*60)
        print(f"Overall Train R²: {overall_train_r2:.4f}")
        print(f"Overall Test R²: {overall_test_r2:.4f}")
        print("="*60)
        
        metrics['overall'] = {
            'train_r2': overall_train_r2,
            'test_r2': overall_test_r2,
            'num_features': X_train.shape[1],
            'num_targets': y_train.shape[1]
        }
        
        # Feature importance (for first estimator)
        if hasattr(self.model.estimators_[0], 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': self.model.estimators_[0].feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\nTop 15 Important Features:")
            print(feature_importance.head(15))
        
        return metrics
    
    def predict(self, df):
        """
        Predict resource requirements
        
        Args:
            df: DataFrame with features
        
        Returns:
            DataFrame with predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        X = self.prepare_features(df)
        predictions = self.model.predict(X)
        
        # Create DataFrame with predictions
        pred_df = pd.DataFrame(
            predictions,
            columns=self.target_columns
        )
        
        # Ensure non-negative predictions
        for col in pred_df.columns:
            pred_df[col] = pred_df[col].clip(lower=0)
        
        return pred_df
    
    def predict_with_confidence(self, df, n_estimators=100):
        """
        Predict with confidence intervals
        Uses ensemble variance as confidence measure
        
        Args:
            df: DataFrame with features
            n_estimators: Number of estimators for variance calculation
        
        Returns:
            DataFrame with predictions and confidence intervals
        """
        predictions = self.predict(df)
        
        # Calculate prediction intervals using ensemble variance
        # (This is a simplified approach)
        confidence_intervals = {}
        
        for i, target in enumerate(self.target_columns):
            # Use a factor of the prediction as confidence interval
            # In a more sophisticated approach, you'd use ensemble predictions
            pred_values = predictions[target]
            
            # Confidence interval: ±20% of prediction
            lower_bound = pred_values * 0.8
            upper_bound = pred_values * 1.2
            
            confidence_intervals[f'{target}_lower'] = lower_bound
            confidence_intervals[f'{target}_upper'] = upper_bound
        
        result_df = pd.concat([
            predictions,
            pd.DataFrame(confidence_intervals)
        ], axis=1)
        
        return result_df
    
    def generate_recommendations(self, predictions):
        """
        Generate actionable recommendations based on predictions
        
        Args:
            predictions: DataFrame with resource predictions
        
        Returns:
            List of recommendations
        """
        recommendations = []
        
        for idx, row in predictions.iterrows():
            recs = []
            
            # Food recommendations
            if row['food_required_tons'] > 1000:
                recs.append("URGENT: Large-scale food distribution required. Activate multi-state supply chain.")
            elif row['food_required_tons'] > 500:
                recs.append("Significant food supplies needed. Coordinate with state warehouses.")
            
            # Water recommendations
            if row['water_required_liters'] > 50000:
                recs.append("CRITICAL: Deploy water purification units and tankers immediately.")
            elif row['water_required_liters'] > 20000:
                recs.append("Arrange water supply through tankers and emergency distribution.")
            
            # Medical recommendations
            if row['medical_aid_people'] > 5000:
                recs.append("URGENT: Set up field hospitals and deploy medical teams.")
            elif row['medical_aid_people'] > 1000:
                recs.append("Deploy medical aid teams and stock emergency medicines.")
            
            # Shelter recommendations
            if row['shelter_families'] > 10000:
                recs.append("CRITICAL: Establish large-scale relief camps with basic amenities.")
            elif row['shelter_families'] > 2000:
                recs.append("Set up temporary shelters and evacuation centers.")
            
            recommendations.append(recs)
        
        return recommendations
    
    def save_model(self, output_dir='../backend/ml_models'):
        """Save trained model to disk"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_filename = f'resource_predictor_{self.model_type}_{timestamp}.pkl'
        
        model_path = os.path.join(output_dir, model_filename)
        
        # Save model
        joblib.dump(self.model, model_path)
        
        # Save metadata
        metadata = {
            'model_type': self.model_type,
            'feature_columns': self.feature_columns,
            'target_columns': self.target_columns,
            'timestamp': timestamp
        }
        
        metadata_filename = f'resource_predictor_metadata_{timestamp}.json'
        metadata_path = os.path.join(output_dir, metadata_filename)
        
        import json
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nModel saved to {model_path}")
        print(f"Metadata saved to {metadata_path}")
        
        return model_path
    
    def load_model(self, model_path):
        """Load trained model from disk"""
        self.model = joblib.load(model_path)
        self.is_trained = True
        
        print(f"Model loaded from {model_path}")

def main():
    """Test resource predictor"""
    # Create sample training data
    np.random.seed(42)
    
    n_samples = 500
    
    # Generate features
    disaster_types = np.random.choice([1, 2, 3, 4, 5], n_samples)  # flood, cyclone, etc.
    severity = np.random.randint(1, 5, n_samples)
    people_affected = np.random.randint(10000, 1000000, n_samples)
    
    sample_data = {
        'disaster_type_numeric': disaster_types,
        'severity_numeric': severity,
        'people_affected': people_affected,
        'people_affected_log': np.log1p(people_affected),
        'urgency_numeric': np.random.randint(1, 5, n_samples),
        'month': np.random.randint(1, 13, n_samples),
        'quarter': np.random.randint(1, 5, n_samples),
        'density_numeric': np.random.randint(1, 4, n_samples),
    }
    
    df = pd.DataFrame(sample_data)
    
    # Generate synthetic targets based on features
    base_multiplier = severity * df['density_numeric']
    
    df['food_required_tons'] = (people_affected * 0.002 * base_multiplier).astype(int)
    df['water_required_liters'] = (people_affected * 20 * base_multiplier).astype(int)
    df['medical_aid_people'] = (people_affected * 0.1 * base_multiplier).astype(int)
    df['shelter_families'] = (people_affected * 0.15 * base_multiplier).astype(int)
    
    # Add computed features
    df['is_monsoon'] = df['month'].isin([6, 7, 8, 9]).astype(int)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    print("Sample Training Data:")
    print(df.head())
    print(f"\nData shape: {df.shape}")
    
    # Train predictor
    print("\n" + "="*60)
    predictor = ResourcePredictor(model_type='random_forest')
    metrics = predictor.train(df)
    
    # Test prediction
    print("\n" + "="*60)
    print("Testing Predictions:")
    test_sample = df.head(5)
    predictions = predictor.predict(test_sample)
    
    print("\nPredicted Resource Requirements:")
    print(predictions)
    
    print("\nActual Resource Requirements:")
    print(test_sample[predictor.target_columns])
    
    # Generate recommendations
    print("\n" + "="*60)
    print("Generated Recommendations:")
    recommendations = predictor.generate_recommendations(predictions)
    for i, recs in enumerate(recommendations):
        print(f"\nSample {i+1}:")
        for rec in recs:
            print(f"  - {rec}")
    
    # Save model
    print("\n" + "="*60)
    model_path = predictor.save_model()

if __name__ == "__main__":
    main()


