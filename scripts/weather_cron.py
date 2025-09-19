#!/usr/bin/env python3
"""
Weather Data Collection Cron Job
Runs every hour to collect current weather data and update the model
"""
import os
import sys
import asyncio
from datetime import datetime
import logging

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.weather_service import weather_ingestion
from ml_model import flood_model

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('weather_cron.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Default locations to collect weather data for
DEFAULT_LOCATIONS = [
    {"name": "Berlin", "lat": 52.52, "lon": 13.41},
    {"name": "London", "lat": 51.51, "lon": -0.13},
    {"name": "New York", "lat": 40.71, "lon": -74.01},
    {"name": "Tokyo", "lat": 35.68, "lon": 139.69},
    {"name": "Sydney", "lat": -33.87, "lon": 151.21}
]

def collect_weather_data():
    """Collect current weather data for all default locations"""
    logger.info("Starting weather data collection...")
    
    success_count = 0
    error_count = 0
    
    for location in DEFAULT_LOCATIONS:
        try:
            logger.info(f"Collecting weather data for {location['name']} ({location['lat']}, {location['lon']})")
            
            weather_data = weather_ingestion.ingest_current_weather(
                location['lat'], location['lon']
            )
            
            logger.info(f"✅ {location['name']}: {weather_data.temperature}°C, {weather_data.humidity}% humidity, {weather_data.precipitation}mm rain")
            success_count += 1
            
        except Exception as e:
            logger.error(f"❌ Failed to collect weather data for {location['name']}: {e}")
            error_count += 1
    
    logger.info(f"Weather data collection completed: {success_count} successful, {error_count} errors")
    return success_count, error_count

def retrain_model_if_needed():
    """Retrain the model if enough new data is available"""
    try:
        # Check if we should retrain (e.g., every 24 hours or when significant new data is available)
        # For now, we'll retrain every time the cron runs, but in production you might want
        # to implement a more sophisticated strategy
        
        logger.info("Checking if model retraining is needed...")
        
        # Use Berlin as the primary location for training
        berlin_lat, berlin_lon = 52.52, 13.41
        
        # Retrain with real data
        training_results = flood_model.train_models(
            use_real_data=True,
            latitude=berlin_lat,
            longitude=berlin_lon,
            days_back=7  # Use last 7 days for frequent retraining
        )
        
        logger.info(f"✅ Model retrained successfully:")
        logger.info(f"   - R² Score: {training_results['r2']:.4f}")
        logger.info(f"   - MSE: {training_results['mse']:.4f}")
        logger.info(f"   - Samples: {training_results['n_samples']}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Model retraining failed: {e}")
        return False

def main():
    """Main cron job function"""
    logger.info("=" * 60)
    logger.info(f"Weather Data Collection Cron Job - {datetime.now()}")
    logger.info("=" * 60)
    
    try:
        # Step 1: Collect current weather data
        success_count, error_count = collect_weather_data()
        
        # Step 2: Retrain model if data collection was successful
        if success_count > 0:
            model_retrained = retrain_model_if_needed()
            
            if model_retrained:
                logger.info("🎉 Cron job completed successfully!")
            else:
                logger.warning("⚠️ Data collected but model retraining failed")
        else:
            logger.error("❌ No weather data collected, skipping model retraining")
        
    except Exception as e:
        logger.error(f"❌ Cron job failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
