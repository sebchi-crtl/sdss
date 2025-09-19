"""
Open-Meteo Weather Data Integration Service
Fetches real weather data and stores it in the database for ML model training
"""
import requests
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass
import os
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class WeatherData:
    """Weather data structure"""
    timestamp: datetime
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    wind_direction: float
    precipitation: float
    latitude: float
    longitude: float
    raw_data: Dict[str, Any]

class OpenMeteoService:
    """Service for fetching weather data from Open-Meteo API"""
    
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SDSS-Flood-Prediction/1.0'
        })
    
    def get_current_weather(self, latitude: float, longitude: float) -> WeatherData:
        """Get current weather data for a location"""
        url = f"{self.base_url}/forecast"
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'current': [
                'temperature_2m',
                'relative_humidity_2m',
                'surface_pressure',
                'wind_speed_10m',
                'wind_direction_10m',
                'precipitation'
            ],
            'timezone': 'auto'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            current = data['current']
            
            return WeatherData(
                timestamp=datetime.fromisoformat(current['time'].replace('Z', '+00:00')),
                temperature=current['temperature_2m'],
                humidity=current['relative_humidity_2m'],
                pressure=current['surface_pressure'],
                wind_speed=current['wind_speed_10m'],
                wind_direction=current['wind_direction_10m'],
                precipitation=current['precipitation'],
                latitude=latitude,
                longitude=longitude,
                raw_data=data
            )
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch weather data: {e}")
            raise
        except KeyError as e:
            logger.error(f"Unexpected API response format: {e}")
            raise
    
    def get_historical_weather(self, latitude: float, longitude: float, 
                             start_date: str, end_date: str) -> List[WeatherData]:
        """Get historical weather data for a date range"""
        url = f"{self.base_url}/forecast"
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'start_date': start_date,
            'end_date': end_date,
            'daily': [
                'temperature_2m_mean',
                'relative_humidity_2m_mean',
                'surface_pressure_mean',
                'wind_speed_10m_mean',
                'wind_direction_10m_mean',
                'precipitation_sum'
            ],
            'timezone': 'auto'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            weather_data = []
            daily = data['daily']
            
            for i, date_str in enumerate(daily['time']):
                weather_data.append(WeatherData(
                    timestamp=datetime.fromisoformat(date_str),
                    temperature=daily['temperature_2m_mean'][i],
                    humidity=daily['relative_humidity_2m_mean'][i],
                    pressure=daily['surface_pressure_mean'][i],
                    wind_speed=daily['wind_speed_10m_mean'][i],
                    wind_direction=daily['wind_direction_10m_mean'][i],
                    precipitation=daily['precipitation_sum'][i],
                    latitude=latitude,
                    longitude=longitude,
                    raw_data=data
                ))
            
            return weather_data
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch historical weather data: {e}")
            raise
        except KeyError as e:
            logger.error(f"Unexpected API response format: {e}")
            raise

class WeatherDataIngestion:
    """Service for ingesting weather data into the database"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print("⚠️ Supabase credentials not found, database operations will be disabled")
            self.supabase = None
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)
        
        self.weather_service = OpenMeteoService()
        
        # Define sensor types for weather data
        self.weather_sensor_types = {
            'temperature': 'TEMP',
            'humidity': 'HUMIDITY', 
            'pressure': 'PRESSURE',
            'wind_speed': 'WIND',
            'precipitation': 'RAIN'
        }
    
    def ensure_weather_sensors_exist(self, latitude: float, longitude: float) -> Dict[str, str]:
        """Ensure weather sensors exist in the database, create if not"""
        if not self.supabase:
            logger.warning("Database not available, returning empty sensor IDs")
            return {}
        
        sensor_ids = {}
        
        for sensor_name, sensor_type in self.weather_sensor_types.items():
            # Check if sensor already exists
            result = self.supabase.table('sensors').select('id').eq('type', sensor_type).eq('lat', latitude).eq('lon', longitude).execute()
            
            if result.data:
                sensor_ids[sensor_name] = result.data[0]['id']
            else:
                # Create new sensor
                sensor_data = {
                    'name': f"Weather {sensor_name.title()} Sensor",
                    'type': sensor_type,
                    'lat': latitude,
                    'lon': longitude,
                    'elevation': 0.0  # Default elevation
                }
                
                result = self.supabase.table('sensors').insert(sensor_data).execute()
                if result.data:
                    sensor_ids[sensor_name] = result.data[0]['id']
                    logger.info(f"Created new {sensor_name} sensor: {sensor_ids[sensor_name]}")
        
        return sensor_ids
    
    def store_weather_data(self, weather_data: WeatherData, sensor_ids: Dict[str, str]):
        """Store weather data in the database"""
        if not self.supabase:
            logger.warning("Database not available, skipping data storage")
            return
        
        readings = []
        
        # Map weather data to sensor readings
        sensor_mappings = {
            'temperature': weather_data.temperature,
            'humidity': weather_data.humidity,
            'pressure': weather_data.pressure,
            'wind_speed': weather_data.wind_speed,
            'precipitation': weather_data.precipitation
        }
        
        for sensor_name, value in sensor_mappings.items():
            if sensor_name in sensor_ids and value is not None:
                reading = {
                    'sensor_id': sensor_ids[sensor_name],
                    'ts': weather_data.timestamp.isoformat(),
                    'value': float(value),
                    'status': 'OK',
                    'lat': weather_data.latitude,
                    'lon': weather_data.longitude,
                    'raw': json.dumps({
                        'source': 'open-meteo',
                        'timestamp': weather_data.timestamp.isoformat(),
                        'full_data': weather_data.raw_data
                    })
                }
                readings.append(reading)
        
        # Insert all readings
        if readings:
            result = self.supabase.table('sensor_readings').insert(readings).execute()
            if result.data:
                logger.info(f"Stored {len(readings)} weather readings")
            else:
                logger.error(f"Failed to store weather readings: {result}")
    
    def ingest_current_weather(self, latitude: float, longitude: float):
        """Ingest current weather data for a location"""
        try:
            # Get current weather data
            weather_data = self.weather_service.get_current_weather(latitude, longitude)
            
            # Ensure sensors exist
            sensor_ids = self.ensure_weather_sensors_exist(latitude, longitude)
            
            # Store data
            self.store_weather_data(weather_data, sensor_ids)
            
            logger.info(f"Successfully ingested current weather for {latitude}, {longitude}")
            return weather_data
            
        except Exception as e:
            logger.error(f"Failed to ingest current weather: {e}")
            raise
    
    def ingest_historical_weather(self, latitude: float, longitude: float, 
                                start_date: str, end_date: str):
        """Ingest historical weather data for a date range"""
        try:
            # Get historical weather data
            weather_data_list = self.weather_service.get_historical_weather(
                latitude, longitude, start_date, end_date
            )
            
            # Ensure sensors exist
            sensor_ids = self.ensure_weather_sensors_exist(latitude, longitude)
            
            # Store all data
            for weather_data in weather_data_list:
                self.store_weather_data(weather_data, sensor_ids)
            
            logger.info(f"Successfully ingested {len(weather_data_list)} historical weather records")
            return weather_data_list
            
        except Exception as e:
            logger.error(f"Failed to ingest historical weather: {e}")
            raise
    
    def get_weather_data_for_training(self, latitude: float, longitude: float, 
                                    days_back: int = 30) -> List[Dict[str, Any]]:
        """Get weather data from database for ML model training"""
        if not self.supabase:
            logger.warning("Database not available, returning empty training data")
            return []
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Get sensor IDs for this location
            sensor_ids = {}
            for sensor_type in self.weather_sensor_types.values():
                result = self.supabase.table('sensors').select('id').eq('type', sensor_type).eq('lat', latitude).eq('lon', longitude).execute()
                if result.data:
                    sensor_ids[sensor_type] = result.data[0]['id']
            
            if not sensor_ids:
                logger.warning(f"No weather sensors found for location {latitude}, {longitude}")
                return []
            
            # Get readings for all sensors
            all_readings = []
            for sensor_type, sensor_id in sensor_ids.items():
                result = self.supabase.table('sensor_readings').select('*').eq('sensor_id', sensor_id).gte('ts', start_date.isoformat()).lte('ts', end_date.isoformat()).order('ts').execute()
                
                if result.data:
                    all_readings.extend(result.data)
            
            # Group readings by timestamp
            grouped_data = {}
            for reading in all_readings:
                ts = reading['ts']
                if ts not in grouped_data:
                    grouped_data[ts] = {'timestamp': ts}
                
                # Map sensor type to reading value
                sensor_type = None
                for stype, sid in sensor_ids.items():
                    if sid == reading['sensor_id']:
                        sensor_type = stype
                        break
                
                if sensor_type:
                    # Map to weather parameter names
                    if sensor_type == 'TEMP':
                        grouped_data[ts]['temperature'] = reading['value']
                    elif sensor_type == 'HUMIDITY':
                        grouped_data[ts]['humidity'] = reading['value']
                    elif sensor_type == 'PRESSURE':
                        grouped_data[ts]['pressure'] = reading['value']
                    elif sensor_type == 'WIND':
                        grouped_data[ts]['wind_speed'] = reading['value']
                    elif sensor_type == 'RAIN':
                        grouped_data[ts]['precipitation'] = reading['value']
            
            # Convert to list and sort by timestamp
            training_data = list(grouped_data.values())
            training_data.sort(key=lambda x: x['timestamp'])
            
            logger.info(f"Retrieved {len(training_data)} weather records for training")
            return training_data
            
        except Exception as e:
            logger.error(f"Failed to get weather data for training: {e}")
            return []

# Global instance
weather_ingestion = WeatherDataIngestion()

# Example usage functions
def ingest_weather_for_location(latitude: float, longitude: float):
    """Ingest current weather data for a specific location"""
    return weather_ingestion.ingest_current_weather(latitude, longitude)

def ingest_historical_weather_for_location(latitude: float, longitude: float, 
                                         start_date: str, end_date: str):
    """Ingest historical weather data for a specific location"""
    return weather_ingestion.ingest_historical_weather(latitude, longitude, start_date, end_date)

def get_weather_training_data(latitude: float, longitude: float, days_back: int = 30):
    """Get weather data for ML model training"""
    return weather_ingestion.get_weather_data_for_training(latitude, longitude, days_back)
