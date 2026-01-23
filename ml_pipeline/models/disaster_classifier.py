"""
Disaster Classification Model
Stage 1: Classify whether a tweet/data point indicates a disaster and its type
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime

class DisasterClassifier:
    def __init__(self, model_type='random_forest'):
        """
        Initialize disaster classifier
        
        Args:
            model_type: 'random_forest' or 'gradient_boosting'
        """
        self.model_type = model_type
        
        if model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        self.label_encoder = LabelEncoder()
        self.feature_columns = None
        self.is_trained = False
    
    def prepare_features(self, df):
        """
        Prepare features for classification
        
        Args:
            df: DataFrame with engineered features
        
        Returns:
            Feature matrix X
        """
        # Select relevant feature columns
        feature_cols = []
        
        # Numeric features
        numeric_features = [
            'severity_numeric', 'urgency_numeric', 'people_affected_log',
            'month', 'is_monsoon', 'text_length', 'word_count',
            'total_engagement_log', 'month_sin', 'month_cos'
        ]
        
        # Add available numeric features
        for col in numeric_features:
            if col in df.columns:
                feature_cols.append(col)
        
        # Add TF-IDF features if available
        tfidf_cols = [col for col in df.columns if col.startswith('tfidf_')]
        feature_cols.extend(tfidf_cols[:50])  # Limit to top 50
        
        # Add disaster type one-hot features
        disaster_cols = [col for col in df.columns if col.startswith('disaster_')]
        feature_cols.extend(disaster_cols)
        
        # Add weather features if available
        weather_features = [
            'heavy_rain', 'extreme_rain', 'high_wind',
            'extreme_wind', 'heat_wave'
        ]
        for col in weather_features:
            if col in df.columns:
                feature_cols.append(col)
        
        # Store feature columns for later use
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
    
    def train(self, df, target_column='disaster_type', test_size=0.2):
        """
        Train the disaster classification model
        
        Args:
            df: DataFrame with features and target
            target_column: Name of target column
            test_size: Proportion of test set
        
        Returns:
            Dictionary with training metrics
        """
        print(f"Training {self.model_type} disaster classifier...")
        
        # Prepare features
        X = self.prepare_features(df)
        
        # Prepare target
        y = self.label_encoder.fit_transform(df[target_column])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"Training set size: {len(X_train)}")
        print(f"Test set size: {len(X_test)}")
        print(f"Number of features: {X_train.shape[1]}")
        
        # Train model
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        train_accuracy = accuracy_score(y_train, y_pred_train)
        test_accuracy = accuracy_score(y_test, y_pred_test)
        
        print(f"\nTraining Accuracy: {train_accuracy:.4f}")
        print(f"Test Accuracy: {test_accuracy:.4f}")
        
        # Classification report
        print("\nClassification Report (Test Set):")
        print(classification_report(
            y_test,
            y_pred_test,
            target_names=self.label_encoder.classes_
        ))
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\nTop 10 Important Features:")
            print(feature_importance.head(10))
        
        metrics = {
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'num_features': X_train.shape[1],
            'num_classes': len(self.label_encoder.classes_),
            'classes': self.label_encoder.classes_.tolist()
        }
        
        return metrics
    
    def predict(self, df):
        """
        Predict disaster type for new data
        
        Args:
            df: DataFrame with features
        
        Returns:
            Predicted disaster types
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        X = self.prepare_features(df)
        y_pred = self.model.predict(X)
        
        # Decode predictions
        predictions = self.label_encoder.inverse_transform(y_pred)
        
        # Get prediction probabilities
        probabilities = self.model.predict_proba(X)
        
        return predictions, probabilities
    
    def predict_with_confidence(self, df):
        """
        Predict disaster type with confidence scores
        
        Args:
            df: DataFrame with features
        
        Returns:
            DataFrame with predictions and confidence
        """
        predictions, probabilities = self.predict(df)
        
        # Get max probability (confidence)
        confidence = np.max(probabilities, axis=1)
        
        results = pd.DataFrame({
            'predicted_disaster_type': predictions,
            'confidence': confidence
        })
        
        return results
    
    def save_model(self, output_dir='../backend/ml_models'):
        """Save trained model to disk"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_filename = f'disaster_classifier_{self.model_type}_{timestamp}.pkl'
        encoder_filename = f'label_encoder_{timestamp}.pkl'
        
        model_path = os.path.join(output_dir, model_filename)
        encoder_path = os.path.join(output_dir, encoder_filename)
        
        # Save model and encoder
        joblib.dump(self.model, model_path)
        joblib.dump(self.label_encoder, encoder_path)
        
        # Save metadata
        metadata = {
            'model_type': self.model_type,
            'feature_columns': self.feature_columns,
            'classes': self.label_encoder.classes_.tolist(),
            'timestamp': timestamp
        }
        
        metadata_filename = f'model_metadata_{timestamp}.json'
        metadata_path = os.path.join(output_dir, metadata_filename)
        
        import json
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\nModel saved to {model_path}")
        print(f"Label encoder saved to {encoder_path}")
        print(f"Metadata saved to {metadata_path}")
        
        return model_path
    
    def load_model(self, model_path, encoder_path):
        """Load trained model from disk"""
        self.model = joblib.load(model_path)
        self.label_encoder = joblib.load(encoder_path)
        self.is_trained = True
        
        print(f"Model loaded from {model_path}")
        print(f"Label encoder loaded from {encoder_path}")

def main():
    """Test disaster classifier"""
    # Create sample training data
    np.random.seed(42)
    
    n_samples = 1000
    sample_data = {
        'disaster_type': np.random.choice(
            ['flood', 'cyclone', 'earthquake', 'fire', 'drought'],
            n_samples
        ),
        'severity_numeric': np.random.randint(1, 5, n_samples),
        'urgency_numeric': np.random.randint(1, 5, n_samples),
        'people_affected_log': np.random.uniform(5, 15, n_samples),
        'month': np.random.randint(1, 13, n_samples),
        'text_length': np.random.randint(50, 500, n_samples),
        'word_count': np.random.randint(10, 100, n_samples),
        'total_engagement_log': np.random.uniform(0, 10, n_samples),
    }
    
    # Add computed features
    df = pd.DataFrame(sample_data)
    df['is_monsoon'] = df['month'].isin([6, 7, 8, 9]).astype(int)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    print("Sample Training Data:")
    print(df.head())
    print(f"\nData shape: {df.shape}")
    print(f"Disaster type distribution:\n{df['disaster_type'].value_counts()}")
    
    # Train classifier
    print("\n" + "="*60)
    classifier = DisasterClassifier(model_type='random_forest')
    metrics = classifier.train(df, target_column='disaster_type')
    
    # Test prediction
    print("\n" + "="*60)
    print("Testing Predictions:")
    test_sample = df.head(5)
    predictions = classifier.predict_with_confidence(test_sample)
    print(predictions)
    
    # Save model
    print("\n" + "="*60)
    model_path = classifier.save_model()

if __name__ == "__main__":
    main()


