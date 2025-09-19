#!/usr/bin/env python3
"""
Dataset Management Script for SDSS Flood Prediction
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_model import FloodPredictionModel
import pandas as pd
import json
from datetime import datetime

def main():
    print("🌊 SDSS Dataset Management Tool")
    print("=" * 50)
    
    # Initialize model
    model = FloodPredictionModel()
    
    while True:
        print("\nOptions:")
        print("1. Generate synthetic dataset")
        print("2. Train model")
        print("3. Test model")
        print("4. View model info")
        print("5. Export dataset")
        print("6. Exit")
        
        choice = input("\nSelect option (1-6): ").strip()
        
        if choice == "1":
            generate_dataset(model)
        elif choice == "2":
            train_model(model)
        elif choice == "3":
            test_model(model)
        elif choice == "4":
            view_model_info(model)
        elif choice == "5":
            export_dataset(model)
        elif choice == "6":
            print("Goodbye! 👋")
            break
        else:
            print("Invalid option. Please try again.")

def generate_dataset(model):
    """Generate a synthetic dataset"""
    try:
        n_samples = int(input("Number of samples to generate (default 10000): ") or "10000")
        print(f"Generating {n_samples} samples...")
        
        df = model.generate_synthetic_dataset(n_samples)
        
        # Save dataset
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"datasets/flood_dataset_{timestamp}.csv"
        os.makedirs("datasets", exist_ok=True)
        df.to_csv(filename, index=False)
        
        print(f"✅ Dataset generated and saved to {filename}")
        print(f"📊 Dataset info:")
        print(f"   - Samples: {len(df)}")
        print(f"   - Features: {len(df.columns)}")
        print(f"   - Flood risk range: {df['flood_risk'].min():.3f} - {df['flood_risk'].max():.3f}")
        print(f"   - Risk levels: {df['flood_level'].value_counts().to_dict()}")
        
    except Exception as e:
        print(f"❌ Error generating dataset: {e}")

def train_model(model):
    """Train the flood prediction model"""
    try:
        print("Training flood prediction model...")
        results = model.train_models()
        
        print("✅ Model training completed!")
        print(f"📈 Training results:")
        print(f"   - MSE: {results['mse']:.4f}")
        print(f"   - R²: {results['r2']:.4f}")
        print(f"   - Samples used: {results['n_samples']}")
        
        print("\n🔍 Feature importance:")
        for feature, importance in sorted(results['feature_importance'].items(), 
                                        key=lambda x: x[1], reverse=True):
            print(f"   - {feature}: {importance:.3f}")
            
    except Exception as e:
        print(f"❌ Error training model: {e}")

def test_model(model):
    """Test the model with sample data"""
    try:
        if not model.is_trained:
            print("❌ Model not trained. Please train the model first.")
            return
        
        print("Testing model with sample conditions...")
        
        # Test with different scenarios
        test_cases = [
            {
                "name": "Normal Conditions",
                "conditions": {
                    "rainfall_24h": 5,
                    "river_level": 2.0,
                    "soil_moisture": 0.4,
                    "temperature": 25,
                    "humidity": 60
                }
            },
            {
                "name": "Heavy Rain",
                "conditions": {
                    "rainfall_24h": 45,
                    "river_level": 3.5,
                    "soil_moisture": 0.8,
                    "temperature": 22,
                    "humidity": 85
                }
            },
            {
                "name": "Critical Conditions",
                "conditions": {
                    "rainfall_24h": 60,
                    "river_level": 4.5,
                    "soil_moisture": 0.9,
                    "temperature": 20,
                    "humidity": 90
                }
            }
        ]
        
        for test_case in test_cases:
            prediction = model.predict_flood_risk(test_case["conditions"])
            print(f"\n🧪 {test_case['name']}:")
            print(f"   - Risk: {prediction['flood_risk']:.3f}")
            print(f"   - Level: {prediction['level']}")
            print(f"   - Confidence: {prediction['confidence']:.3f}")
            print(f"   - Recommendations: {len(prediction['recommendations'])} items")
            
    except Exception as e:
        print(f"❌ Error testing model: {e}")

def view_model_info(model):
    """View model information"""
    try:
        print("📋 Model Information:")
        print(f"   - Trained: {'Yes' if model.is_trained else 'No'}")
        print(f"   - Model type: {'GradientBoostingRegressor' if model.is_trained else 'Simple'}")
        print(f"   - Model path: {model.model_path}")
        
        if model.is_trained and hasattr(model, 'flood_risk_model'):
            print(f"   - Features: {model.flood_risk_model.n_features_in_}")
            print(f"   - Estimators: {model.flood_risk_model.n_estimators}")
        
        # Check for saved models
        model_files = []
        if os.path.exists(model.model_path):
            for file in os.listdir(model.model_path):
                if file.endswith('.pkl') or file.endswith('.json'):
                    model_files.append(file)
        
        if model_files:
            print(f"   - Saved files: {', '.join(model_files)}")
        else:
            print("   - No saved model files found")
            
    except Exception as e:
        print(f"❌ Error viewing model info: {e}")

def export_dataset(model):
    """Export dataset to different formats"""
    try:
        n_samples = int(input("Number of samples to export (default 1000): ") or "1000")
        format_type = input("Export format (csv/json) [csv]: ").strip().lower() or "csv"
        
        print(f"Generating {n_samples} samples...")
        df = model.generate_synthetic_dataset(n_samples)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("datasets", exist_ok=True)
        
        if format_type == "json":
            filename = f"datasets/flood_dataset_{timestamp}.json"
            df.to_json(filename, orient='records', indent=2)
        else:
            filename = f"datasets/flood_dataset_{timestamp}.csv"
            df.to_csv(filename, index=False)
        
        print(f"✅ Dataset exported to {filename}")
        print(f"📊 Export info:")
        print(f"   - Format: {format_type.upper()}")
        print(f"   - Samples: {len(df)}")
        print(f"   - Size: {os.path.getsize(filename) / 1024:.1f} KB")
        
    except Exception as e:
        print(f"❌ Error exporting dataset: {e}")

if __name__ == "__main__":
    main()
