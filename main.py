from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import numpy as np
from datetime import datetime, timedelta
import random
import os
import sys

# Add lib directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from ml_training_pipeline import nigeria_ml_pipeline, TrainingConfig
from nigeria_weather_service import (
    nigeria_weather_service, 
    nigeria_weather_ingestion,
    get_nigeria_state_weather,
    get_nigeria_weather_forecast,
    ingest_nigeria_weather_data,
    get_nigeria_weather_training_data
)

class PredictionRequest(BaseModel):
    horizon_hours: List[int]
    current_conditions: Dict[str, Any] = {}
    state_code: Optional[str] = None

class PredictionResponse(BaseModel):
    horizon: List[int]
    risk: List[float]
    confidence: List[float]
    factors: Dict[str, Any]
    recommendations: List[str]
    state_code: Optional[str] = None
    region: Optional[str] = None

class WeatherIngestRequest(BaseModel):
    state_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    type: str = "current"

class TrainingRequest(BaseModel):
    use_real_data: bool = True
    state_codes: Optional[List[str]] = None
    days_back: int = 30
    model_type: str = "gradient_boosting"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

app = FastAPI(
    title="Nigeria SDSS Flood Prediction API", 
    version="3.0.0",
    description="Enhanced flood prediction system for Nigeria states using Open-Meteo weather data and ML models"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def calculate_nigeria_flood_risk(horizon_hours: List[int], conditions: Dict[str, Any], 
                                state_code: str = None) -> PredictionResponse:
    """
    Enhanced flood risk prediction using Nigeria-trained ML model
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
    
    # Get base prediction from Nigeria ML model
    base_prediction = nigeria_ml_pipeline.predict_flood_risk(current_conditions, state_code)
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
            "model_used": "Nigeria GradientBoostingRegressor" if nigeria_ml_pipeline.is_trained else "Simple",
            "state_risk": base_prediction.get('factors', {}).get('state_risk', 'medium')
        },
        recommendations=recommendations,
        state_code=state_code,
        region=base_prediction.get('region')
    )

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    """Predict flood risk for given time horizons in Nigeria states"""
    return calculate_nigeria_flood_risk(req.horizon_hours, req.current_conditions, req.state_code)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "model_trained": nigeria_ml_pipeline.is_trained,
        "model_type": "Nigeria GradientBoostingRegressor" if nigeria_ml_pipeline.is_trained else "Simple",
        "nigeria_states_supported": len(nigeria_ml_pipeline.nigeria_states),
        "api_version": "3.0.0"
    }

@app.post("/retrain")
def retrain_model(req: TrainingRequest):
    """Retrain the Nigeria flood prediction model"""
    try:
        # Update training config
        config = TrainingConfig(
            model_type=req.model_type,
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6
        )
        
        # Update pipeline config
        nigeria_ml_pipeline.config = config
        
        results = nigeria_ml_pipeline.train_model(
            use_real_data=req.use_real_data,
            state_codes=req.state_codes,
            days_back=req.days_back
        )
        return {
            "status": "success",
            "message": "Nigeria model retrained successfully",
            "results": results,
            "data_source": "Real weather data" if req.use_real_data else "Synthetic data",
            "states_trained": req.state_codes or "All Nigeria states"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to retrain Nigeria model: {str(e)}"
        }

@app.get("/model/info")
def model_info():
    """Get information about the current Nigeria model"""
    return {
        "is_trained": nigeria_ml_pipeline.is_trained,
        "model_type": "Nigeria GradientBoostingRegressor" if nigeria_ml_pipeline.is_trained else "Simple",
        "features": nigeria_ml_pipeline.feature_columns,
        "model_path": nigeria_ml_pipeline.model_path,
        "nigeria_states_count": len(nigeria_ml_pipeline.nigeria_states),
        "supported_states": list(nigeria_ml_pipeline.nigeria_states.keys())
    }

@app.get("/dataset/generate")
def generate_dataset(n_samples: int = 1000):
    """Generate a sample Nigeria dataset for training"""
    try:
        df = nigeria_ml_pipeline.generate_nigeria_synthetic_dataset(n_samples)
        return {
            "status": "success",
            "samples": len(df),
            "columns": list(df.columns),
            "states_included": df['state_code'].nunique(),
            "regions_included": df['region'].nunique(),
            "sample_data": df.head().to_dict('records')
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate Nigeria dataset: {str(e)}"
        }

@app.post("/weather/ingest")
def ingest_weather_data(req: WeatherIngestRequest):
    """Ingest weather data from Open-Meteo API for Nigeria states"""
    try:
        if req.state_code:
            # Ingest for specific state
            result = nigeria_weather_ingestion.ingest_state_weather(req.state_code)
            return {
                "status": "success",
                "message": f"Weather data ingested successfully for {req.state_code}",
                "data": {
                    "state_code": result.state_code,
                    "region": result.region,
                    "latitude": result.latitude,
                    "longitude": result.longitude,
                    "temperature": result.temperature,
                    "humidity": result.humidity,
                    "pressure": result.pressure,
                    "wind_speed": result.wind_speed,
                    "wind_direction": result.wind_direction,
                    "precipitation": result.precipitation,
                    "rainfall_24h": result.rainfall_24h,
                    "rainfall_7d": result.rainfall_7d,
                    "soil_moisture": result.soil_moisture,
                    "river_level": result.river_level,
                    "timestamp": result.timestamp.isoformat()
                }
            }
        elif req.latitude and req.longitude:
            # Ingest for specific coordinates
            result = nigeria_weather_service.get_current_weather(req.latitude, req.longitude)
            return {
                "status": "success",
                "message": "Weather data ingested successfully for coordinates",
                "data": {
                    "latitude": result.latitude,
                    "longitude": result.longitude,
                    "temperature": result.temperature,
                    "humidity": result.humidity,
                    "pressure": result.pressure,
                    "wind_speed": result.wind_speed,
                    "wind_direction": result.wind_direction,
                    "precipitation": result.precipitation,
                    "timestamp": result.timestamp.isoformat()
                }
            }
        else:
            # Ingest for all states
            results = nigeria_weather_ingestion.ingest_all_states_weather()
            return {
                "status": "success",
                "message": f"Weather data ingested successfully for {len(results)} states",
                "states_processed": list(results.keys()),
                "total_states": len(results)
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to ingest weather data: {str(e)}"
        }

@app.get("/weather/training-data")
def get_weather_training_data(state_codes: str = None, days_back: int = 30):
    """Get weather data from database for training Nigeria models"""
    try:
        # Parse state codes if provided
        state_list = None
        if state_codes:
            state_list = [code.strip().upper() for code in state_codes.split(',')]
        
        training_data = get_nigeria_weather_training_data(state_list, days_back)
        
        return {
            "status": "success",
            "data": training_data,
            "count": len(training_data),
            "states_requested": state_list or "All Nigeria states",
            "days_back": days_back
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to get Nigeria weather training data: {str(e)}"
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

# New Nigeria-specific endpoints
@app.get("/nigeria/states")
def get_nigeria_states():
    """Get list of all Nigeria states with their information"""
    return {
        "status": "success",
        "states": nigeria_ml_pipeline.nigeria_states,
        "total_states": len(nigeria_ml_pipeline.nigeria_states)
    }

@app.get("/nigeria/states/{state_code}/weather")
def get_state_weather(state_code: str):
    """Get current weather data for a specific Nigeria state"""
    try:
        weather_data = get_nigeria_state_weather(state_code.upper())
        return {
            "status": "success",
            "state_code": weather_data.state_code,
            "region": weather_data.region,
            "weather": {
                "temperature": weather_data.temperature,
                "humidity": weather_data.humidity,
                "pressure": weather_data.pressure,
                "wind_speed": weather_data.wind_speed,
                "wind_direction": weather_data.wind_direction,
                "precipitation": weather_data.precipitation,
                "rainfall_24h": weather_data.rainfall_24h,
                "rainfall_7d": weather_data.rainfall_7d,
                "soil_moisture": weather_data.soil_moisture,
                "river_level": weather_data.river_level,
                "timestamp": weather_data.timestamp.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get weather for {state_code}: {str(e)}")

@app.get("/nigeria/states/{state_code}/forecast")
def get_state_forecast(state_code: str, days: int = 7):
    """Get weather forecast for a specific Nigeria state"""
    try:
        forecast_data = get_nigeria_weather_forecast(state_code.upper(), days)
        return {
            "status": "success",
            "state_code": state_code.upper(),
            "forecast_days": days,
            "forecast": [
                {
                    "date": f.timestamp.isoformat(),
                    "temperature": f.temperature,
                    "humidity": f.humidity,
                    "pressure": f.pressure,
                    "wind_speed": f.wind_speed,
                    "wind_direction": f.wind_direction,
                    "precipitation": f.precipitation,
                    "precipitation_probability": f.precipitation_probability
                }
                for f in forecast_data
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get forecast for {state_code}: {str(e)}")

@app.get("/nigeria/regions")
def get_nigeria_regions():
    """Get Nigeria regions with their states"""
    regions = {}
    for state_code, state_info in nigeria_ml_pipeline.nigeria_states.items():
        region = state_info['region']
        if region not in regions:
            regions[region] = []
        regions[region].append({
            "code": state_code,
            "name": state_info['name'],
            "flood_risk": state_info['flood_risk']
        })
    
    return {
        "status": "success",
        "regions": regions,
        "total_regions": len(regions)
    }

@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "name": "Nigeria SDSS Flood Prediction API",
        "version": "3.0.0",
        "description": "Enhanced flood prediction system for Nigeria states using Open-Meteo weather data and ML models",
        "model_status": "Trained" if nigeria_ml_pipeline.is_trained else "Not Trained",
        "nigeria_states_supported": len(nigeria_ml_pipeline.nigeria_states),
        "endpoints": {
            "POST /predict": "Get flood risk predictions for Nigeria states",
            "GET /health": "Health check",
            "POST /retrain": "Retrain the Nigeria ML model",
            "GET /model/info": "Get Nigeria model information",
            "GET /dataset/generate": "Generate Nigeria sample dataset",
            "POST /weather/ingest": "Ingest weather data for Nigeria states",
            "GET /weather/training-data": "Get weather data for training",
            "GET /nigeria/states": "Get all Nigeria states information",
            "GET /nigeria/states/{state_code}/weather": "Get current weather for a state",
            "GET /nigeria/states/{state_code}/forecast": "Get weather forecast for a state",
            "GET /nigeria/regions": "Get Nigeria regions and their states",
            "GET /": "API information"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8200)
