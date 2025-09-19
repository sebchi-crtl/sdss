#!/usr/bin/env python3
"""
Weather Data Training Pipeline
Automatically ingests weather data from Open-Meteo and trains the flood prediction model
"""
import os
import sys
import asyncio
from datetime import datetime, timedelta
import argparse

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.weather_service import weather_ingestion
from ml_model import flood_model

def main():
    parser = argparse.ArgumentParser(description='Weather Data Training Pipeline')
    parser.add_argument('--latitude', type=float, default=52.52, help='Latitude for weather data (default: Berlin)')
    parser.add_argument('--longitude', type=float, default=13.41, help='Longitude for weather data (default: Berlin)')
    parser.add_argument('--days-back', type=int, default=30, help='Days of historical data to fetch (default: 30)')
    parser.add_argument('--ingest-only', action='store_true', help='Only ingest data, do not train model')
    parser.add_argument('--train-only', action='store_true', help='Only train model, do not ingest data')
    parser.add_argument('--synthetic', action='store_true', help='Use synthetic data instead of real weather data')
    
    args = parser.parse_args()
    
    print("🌊 SDSS Weather Data Training Pipeline")
    print("=" * 50)
    print(f"Location: {args.latitude}, {args.longitude}")
    print(f"Days back: {args.days_back}")
    print(f"Mode: {'Ingest only' if args.ingest_only else 'Train only' if args.train_only else 'Full pipeline'}")
    print()
    
    try:
        # Step 1: Ingest weather data (unless train-only mode)
        if not args.train_only:
            print("📡 Step 1: Ingesting weather data from Open-Meteo...")
            
            # Ingest current weather
            print("  - Fetching current weather...")
            current_weather = weather_ingestion.ingest_current_weather(args.latitude, args.longitude)
            print(f"  ✅ Current weather ingested: {current_weather.temperature}°C, {current_weather.humidity}% humidity")
            
            # Ingest historical weather
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=args.days_back)).strftime('%Y-%m-%d')
            
            print(f"  - Fetching historical weather ({start_date} to {end_date})...")
            historical_weather = weather_ingestion.ingest_historical_weather(
                args.latitude, args.longitude, start_date, end_date
            )
            print(f"  ✅ Historical weather ingested: {len(historical_weather)} records")
            
            print("✅ Weather data ingestion completed!")
            print()
        
        # Step 2: Train the model (unless ingest-only mode)
        if not args.ingest_only:
            print("🤖 Step 2: Training flood prediction model...")
            
            if args.synthetic:
                print("  - Using synthetic data for training...")
                training_results = flood_model.train_models(use_real_data=False)
            else:
                print("  - Using real weather data for training...")
                training_results = flood_model.train_models(
                    use_real_data=True,
                    latitude=args.latitude,
                    longitude=args.longitude,
                    days_back=args.days_back
                )
            
            print("✅ Model training completed!")
            print(f"  - R² Score: {training_results['r2']:.4f}")
            print(f"  - MSE: {training_results['mse']:.4f}")
            print(f"  - Samples used: {training_results['n_samples']}")
            print()
            
            # Display feature importance
            print("🔍 Top 5 Most Important Features:")
            feature_importance = training_results['feature_importance']
            sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            for i, (feature, importance) in enumerate(sorted_features[:5], 1):
                print(f"  {i}. {feature}: {importance:.4f}")
            print()
        
        print("🎉 Pipeline completed successfully!")
        
    except Exception as e:
        print(f"❌ Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
