from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
import numpy as np
from datetime import datetime, timedelta
import random
from ml_model import flood_model
import os

class Req(BaseModel):
    horizon_hours: List[int]
    current_conditions: Dict[str, Any] = {}

class PredictionResponse(BaseModel):
    horizon: List[int]
    risk: List[float]
    confidence: List[float]
    factors: Dict[str, Any]
    recommendations: List[str]

app = FastAPI(title="SDSS Flood Prediction API", version="2.0.0")

def calculate_flood_risk(horizon_hours: List[int], conditions: Dict[str, Any]) -> PredictionResponse:
    """
    Enhanced flood risk prediction using trained ML model
    """
    # Get current conditions or use defaults
    current_conditions = {
        'rainfall_24h': conditions.get('rainfall_24h', random.uniform(0, 20)),
        'rainfall_7d': conditions.get('rainfall_7d', random.uniform(0, 50)),
        'river_level': conditions.get('river_level', random.uniform(1.5, 4.0)),
        'soil_moisture': conditions.get('soil_moisture', random.uniform(0.3, 0.8)),
        'temperature': conditions.get('temperature', random.uniform(20, 30)),
        'humidity': conditions.get('humidity', random.uniform(50, 80)),
        'pressure': conditions.get('pressure', random.uniform(1000, 1020)),
        'wind_speed': conditions.get('wind_speed', random.uniform(1, 10)),
        'wind_direction': conditions.get('wind_direction', random.uniform(0, 360))
    }
    
    # Get base prediction from ML model
    base_prediction = flood_model.predict_flood_risk(current_conditions)
    base_risk = base_prediction['flood_risk']
    base_confidence = base_prediction['confidence']
    
    # Simulate forecast rainfall for different horizons
    forecast_rainfall = []
    for hours in horizon_hours:
        # More rainfall likely in shorter horizons
        if hours <= 24:
            forecast_rainfall.append(random.uniform(0, 15))
        elif hours <= 48:
            forecast_rainfall.append(random.uniform(0, 25))
        else:
            forecast_rainfall.append(random.uniform(0, 35))
    
    risk_scores = []
    confidence_scores = []
    
    for i, hours in enumerate(horizon_hours):
        # Adjust risk based on forecast rainfall
        forecast_factor = min(1.0, sum(forecast_rainfall[:i+1]) / 50)
        
        # Time decay factor (uncertainty increases with time)
        time_factor = 1 + (hours / 168) * 0.3  # 168 hours = 1 week
        
        # Calculate adjusted risk
        adjusted_risk = base_risk + (forecast_factor * 0.3)
        adjusted_risk *= time_factor
        adjusted_risk = min(1.0, adjusted_risk)
        
        risk_scores.append(round(adjusted_risk, 3))
        
        # Confidence decreases with longer horizons
        confidence = base_confidence * (1 - (hours / 168) * 0.4)
        confidence = max(0.3, confidence)
        confidence_scores.append(round(confidence, 3))
    
    # Use ML model recommendations as base
    recommendations = base_prediction['recommendations'].copy()
    
    # Add time-specific recommendations
    max_risk = max(risk_scores)
    if max_risk > 0.8:
        recommendations.insert(0, "EMERGENCY: Evacuate low-lying areas immediately")
    elif max_risk > 0.6:
        recommendations.insert(0, "WARNING: Prepare for potential flooding")
    elif max_risk > 0.4:
        recommendations.insert(0, "WATCH: Monitor conditions closely")
    
    return PredictionResponse(
        horizon=horizon_hours,
        risk=risk_scores,
        confidence=confidence_scores,
        factors={
            "rainfall_24h": round(current_conditions['rainfall_24h'], 1),
            "river_level": round(current_conditions['river_level'], 2),
            "soil_moisture": round(current_conditions['soil_moisture'], 2),
            "temperature": round(current_conditions['temperature'], 1),
            "humidity": round(current_conditions['humidity'], 1),
            "pressure": round(current_conditions['pressure'], 1),
            "forecast_rainfall": [round(r, 1) for r in forecast_rainfall],
            "model_used": "GradientBoostingRegressor" if flood_model.is_trained else "Simple"
        },
        recommendations=recommendations
    )

@app.post("/predict", response_model=PredictionResponse)
def predict(req: Req):
    """Predict flood risk for given time horizons"""
    return calculate_flood_risk(req.horizon_hours, req.current_conditions)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "model_trained": flood_model.is_trained,
        "model_type": "GradientBoostingRegressor" if flood_model.is_trained else "Simple"
    }

@app.post("/retrain")
def retrain_model(use_real_data: bool = True, latitude: float = 52.52, longitude: float = 13.41, days_back: int = 30):
    """Retrain the flood prediction model"""
    try:
        results = flood_model.train_models(
            use_real_data=use_real_data,
            latitude=latitude,
            longitude=longitude,
            days_back=days_back
        )
        return {
            "status": "success",
            "message": "Model retrained successfully",
            "results": results,
            "data_source": "Real weather data" if use_real_data else "Synthetic data"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrain model: {str(e)}"
        }

@app.get("/model/info")
def model_info():
    """Get information about the current model"""
    return {
        "is_trained": flood_model.is_trained,
        "model_type": "GradientBoostingRegressor" if flood_model.is_trained else "Simple",
        "features": [
            "temperature", "humidity", "pressure", "rainfall_24h", "rainfall_7d",
            "river_level", "soil_moisture", "wind_speed", "wind_direction", "day_of_year"
        ],
        "model_path": flood_model.model_path
    }

@app.get("/dataset/generate")
def generate_dataset(n_samples: int = 1000):
    """Generate a sample dataset for training"""
    try:
        df = flood_model.generate_synthetic_dataset(n_samples)
        return {
            "status": "success",
            "samples": len(df),
            "columns": list(df.columns),
            "sample_data": df.head().to_dict('records')
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate dataset: {str(e)}"
        }

@app.post("/weather/ingest")
def ingest_weather_data(latitude: float, longitude: float, type: str = "current"):
    """Ingest weather data from Open-Meteo API"""
    try:
        from lib.weather_service import weather_ingestion
        
        if type == "current":
            result = weather_ingestion.ingest_current_weather(latitude, longitude)
            return {
                "status": "success",
                "message": "Current weather data ingested successfully",
                "data": {
                    "temperature": result.temperature,
                    "humidity": result.humidity,
                    "pressure": result.pressure,
                    "wind_speed": result.wind_speed,
                    "precipitation": result.precipitation,
                    "timestamp": result.timestamp.isoformat()
                }
            }
        else:
            return {"status": "error", "message": "Only 'current' type is supported in this endpoint"}
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to ingest weather data: {str(e)}"
        }

@app.get("/weather/training-data")
def get_weather_training_data(latitude: float = 52.52, longitude: float = 13.41, days_back: int = 30):
    """Get weather data from database for training"""
    try:
        from lib.weather_service import weather_ingestion
        
        training_data = weather_ingestion.get_weather_data_for_training(latitude, longitude, days_back)
        
        return {
            "status": "success",
            "data": training_data,
            "count": len(training_data),
            "location": {"latitude": latitude, "longitude": longitude},
            "days_back": days_back
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get weather training data: {str(e)}"
        }

@app.post("/process-sensor-data")
def process_sensor_data(sensor_data: dict):
    """Process incoming sensor data and trigger real-time predictions"""
    try:
        # Extract sensor information
        sensor_id = sensor_data.get('sensor_id')
        value = sensor_data.get('value')
        sensor_type = sensor_data.get('type', 'UNKNOWN')
        lat = sensor_data.get('lat')
        lon = sensor_data.get('lon')
        timestamp = sensor_data.get('ts')
        
        # Log the incoming data
        print(f"Processing sensor data: {sensor_id} ({sensor_type}) = {value}")
        
        # For critical sensors, trigger immediate flood risk assessment
        if sensor_type in ['RAIN', 'RIVER', 'WATER_LEVEL'] and value is not None:
            # Get current conditions from database if available
            current_conditions = {
                'rainfall_24h': 0,  # Will be updated from database
                'rainfall_7d': 0,
                'river_level': 2.0,
                'soil_moisture': 0.5,
                'temperature': 25,
                'humidity': 65,
                'pressure': 1013,
                'wind_speed': 3,
                'wind_direction': 180
            }
            
            # Update conditions based on sensor type
            if sensor_type == 'RAIN':
                current_conditions['rainfall_24h'] = value
            elif sensor_type == 'RIVER':
                current_conditions['river_level'] = value
            elif sensor_type == 'WATER_LEVEL':
                current_conditions['river_level'] = value * 2  # Convert to river level estimate
            
            # Get quick flood risk assessment
            prediction = calculate_flood_risk([1, 6, 24], current_conditions)
            
            # Log high-risk situations
            max_risk = max(prediction.risk)
            if max_risk > 0.6:
                print(f"⚠️ HIGH FLOOD RISK DETECTED: {max_risk:.2f} for sensor {sensor_id}")
                print(f"Recommendations: {prediction.recommendations[:2]}")
        
        return {
            "status": "success",
            "message": f"Processed sensor data from {sensor_id}",
            "sensor_id": sensor_id,
            "value": value,
            "type": sensor_type
        }
        
    except Exception as e:
        print(f"Error processing sensor data: {e}")
        return {
            "status": "error",
            "message": f"Failed to process sensor data: {str(e)}"
        }

@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "name": "SDSS Flood Prediction API",
        "version": "2.0.0",
        "model_status": "Trained" if flood_model.is_trained else "Not Trained",
        "endpoints": {
            "POST /predict": "Get flood risk predictions",
            "GET /health": "Health check",
            "POST /retrain": "Retrain the ML model",
            "GET /model/info": "Get model information",
            "GET /dataset/generate": "Generate sample dataset",
            "POST /weather/ingest": "Ingest weather data from Open-Meteo",
            "GET /weather/training-data": "Get weather data for training",
            "GET /": "API information"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8200)
