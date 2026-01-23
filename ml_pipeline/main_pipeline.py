"""
Main ML Pipeline
Orchestrates the entire ML workflow from data collection to model training
"""

import os
import sys
import pandas as pd
from datetime import datetime
import json

# Add paths to Python path
sys.path.append(os.path.dirname(__file__))

# Import modules
from data_collection.historical_data_collector import HistoricalDataCollector
from data_collection.weather_data_collector import WeatherDataCollector
from preprocessing.text_preprocessor import TextPreprocessor
from feature_engineering.feature_extractor import FeatureExtractor
from models.disaster_classifier import DisasterClassifier
from models.resource_predictor import ResourcePredictor

class DisasterReliefMLPipeline:
    def __init__(self, output_dir='../backend'):
        self.output_dir = output_dir
        self.raw_data_dir = os.path.join(output_dir, 'data', 'raw')
        self.processed_data_dir = os.path.join(output_dir, 'data', 'processed')
        self.model_dir = os.path.join(output_dir, 'ml_models')
        
        # Create directories
        os.makedirs(self.raw_data_dir, exist_ok=True)
        os.makedirs(self.processed_data_dir, exist_ok=True)
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Initialize components
        self.historical_collector = HistoricalDataCollector(self.raw_data_dir)
        self.weather_collector = WeatherDataCollector(output_dir=self.raw_data_dir)
        self.text_preprocessor = TextPreprocessor()
        self.feature_extractor = FeatureExtractor()
        self.disaster_classifier = None
        self.resource_predictor = None
    
    def step1_collect_data(self):
        """Step 1: Collect all necessary data"""
        print("\n" + "="*80)
        print("STEP 1: DATA COLLECTION")
        print("="*80)
        
        # Collect historical disaster data
        print("\n[1/2] Collecting historical disaster data...")
        historical_df = self.historical_collector.create_sample_disaster_dataset()
        
        # Collect weather-disaster correlation data
        print("\n[2/2] Collecting weather-disaster correlation data...")
        weather_df = self.weather_collector.create_sample_weather_disaster_data()
        
        print("\n✓ Data collection completed!")
        return historical_df, weather_df
    
    def step2_preprocess_data(self, df):
        """Step 2: Preprocess and clean data"""
        print("\n" + "="*80)
        print("STEP 2: DATA PREPROCESSING")
        print("="*80)
        
        # For historical data, create synthetic text descriptions
        if 'content' not in df.columns:
            print("\nCreating synthetic text descriptions...")
            df['content'] = df.apply(lambda row: 
                f"{row['disaster_type']} disaster in {row['location']} with {row['severity']} severity. "
                f"{row['people_affected']} people affected. "
                f"Urgent relief needed including food water medical shelter.",
                axis=1
            )
        
        # Process text
        print("\nProcessing text data...")
        processed_df = self.text_preprocessor.process_dataframe(
            df,
            text_column='content',
            output_dir=self.processed_data_dir
        )
        
        print("\n✓ Data preprocessing completed!")
        return processed_df
    
    def step3_engineer_features(self, df):
        """Step 3: Engineer features for ML models"""
        print("\n" + "="*80)
        print("STEP 3: FEATURE ENGINEERING")
        print("="*80)
        
        # Apply feature engineering
        features_df = self.feature_extractor.engineer_all_features(df)
        
        # Save engineered features
        filepath = self.feature_extractor.save_features(
            features_df,
            output_dir=self.processed_data_dir
        )
        
        print(f"\n✓ Feature engineering completed!")
        print(f"✓ Total features created: {len(features_df.columns)}")
        
        return features_df
    
    def step4_train_models(self, df):
        """Step 4: Train ML models"""
        print("\n" + "="*80)
        print("STEP 4: MODEL TRAINING")
        print("="*80)
        
        # Train disaster classifier
        print("\n[1/2] Training Disaster Classifier...")
        print("-" * 80)
        self.disaster_classifier = DisasterClassifier(model_type='random_forest')
        
        if 'disaster_type' in df.columns:
            classifier_metrics = self.disaster_classifier.train(
                df,
                target_column='disaster_type'
            )
            
            # Save classifier
            classifier_path = self.disaster_classifier.save_model(
                output_dir=self.model_dir
            )
        
        # Train resource predictor
        print("\n[2/2] Training Resource Predictor...")
        print("-" * 80)
        self.resource_predictor = ResourcePredictor(model_type='random_forest')
        
        predictor_metrics = self.resource_predictor.train(df)
        
        # Save predictor
        predictor_path = self.resource_predictor.save_model(
            output_dir=self.model_dir
        )
        
        print("\n✓ Model training completed!")
        
        return {
            'classifier_metrics': classifier_metrics if 'disaster_type' in df.columns else None,
            'predictor_metrics': predictor_metrics
        }
    
    def step5_evaluate_pipeline(self, df):
        """Step 5: Evaluate end-to-end pipeline"""
        print("\n" + "="*80)
        print("STEP 5: PIPELINE EVALUATION")
        print("="*80)
        
        # Test prediction on sample
        print("\nTesting predictions on sample data...")
        sample = df.sample(min(5, len(df)))
        
        # Classify disaster type
        if self.disaster_classifier and self.disaster_classifier.is_trained:
            print("\n[Disaster Classification]")
            disaster_predictions = self.disaster_classifier.predict_with_confidence(sample)
            print(disaster_predictions)
        
        # Predict resources
        print("\n[Resource Prediction]")
        resource_predictions = self.resource_predictor.predict(sample)
        print(resource_predictions)
        
        # Generate recommendations
        print("\n[Recommendations]")
        recommendations = self.resource_predictor.generate_recommendations(
            resource_predictions
        )
        
        for i, recs in enumerate(recommendations):
            print(f"\nSample {i+1} Recommendations:")
            for rec in recs:
                print(f"  • {rec}")
        
        print("\n✓ Pipeline evaluation completed!")
    
    def run_complete_pipeline(self):
        """Run the complete ML pipeline"""
        print("\n" + "="*80)
        print("DISASTER RELIEF AI - COMPLETE ML PIPELINE")
        print("="*80)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        start_time = datetime.now()
        
        try:
            # Step 1: Collect Data
            historical_df, weather_df = self.step1_collect_data()
            
            # Use historical data as main dataset
            main_df = historical_df
            
            # Step 2: Preprocess Data
            processed_df = self.step2_preprocess_data(main_df)
            
            # Step 3: Engineer Features
            features_df = self.step3_engineer_features(processed_df)
            
            # Step 4: Train Models
            metrics = self.step4_train_models(features_df)
            
            # Step 5: Evaluate Pipeline
            self.step5_evaluate_pipeline(features_df)
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            print("\n" + "="*80)
            print("PIPELINE COMPLETED SUCCESSFULLY!")
            print("="*80)
            print(f"Total duration: {duration:.2f} seconds")
            print(f"Completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*80)
            
            # Save pipeline summary
            summary = {
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': duration,
                'data_samples': len(features_df),
                'features_created': len(features_df.columns),
                'metrics': metrics,
                'status': 'SUCCESS'
            }
            
            summary_path = os.path.join(self.model_dir, f'pipeline_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2)
            
            print(f"\n✓ Pipeline summary saved to: {summary_path}")
            
            return summary
            
        except Exception as e:
            print(f"\n✗ Pipeline failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """Main entry point"""
    pipeline = DisasterReliefMLPipeline()
    summary = pipeline.run_complete_pipeline()
    
    if summary:
        print("\n✅ Pipeline executed successfully!")
    else:
        print("\n❌ Pipeline execution failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()














