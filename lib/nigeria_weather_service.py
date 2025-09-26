"""
Enhanced Weather Service for Nigeria
Integrates with Open-Meteo API and Nigeria state/region mapping
"""
import requests
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging
from dataclasses import dataclass
import os
from supabase import create_client, Client
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class NigeriaWeatherData:
    """Weather data structure for Nigeria locations"""
    timestamp: datetime
    latitude: float
    longitude: float
    state_code: str
    region: str
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    wind_direction: float
    precipitation: float
    rainfall_24h: float
    rainfall_7d: float
    soil_moisture: float
    river_level: float
    raw_data: Dict[str, Any]

@dataclass
class WeatherForecast:
    """Weather forecast data"""
    timestamp: datetime
    latitude: float
    longitude: float
    state_code: str
    temperature: float
    humidity: float
    pressure: float
    wind_speed: float
    wind_direction: float
    precipitation: float
    precipitation_probability: float

class NigeriaOpenMeteoService:
    """Enhanced Open-Meteo service for Nigeria weather data"""
    
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Nigeria-SDSS-Flood-Prediction/2.0'
        })
        
        # Nigeria state coordinates (simplified)
        self.nigeria_states = {
            "AB": {"name": "Abia", "lat": 5.5333, "lon": 7.4833, "region": "South East"},
            "AD": {"name": "Adamawa", "lat": 9.2000, "lon": 12.4833, "region": "North East"},
            "AK": {"name": "Akwa Ibom", "lat": 5.0333, "lon": 7.9167, "region": "South South"},
            "AN": {"name": "Anambra", "lat": 6.2107, "lon": 7.0743, "region": "South East"},
            "BA": {"name": "Bauchi", "lat": 10.3158, "lon": 9.8442, "region": "North East"},
            "BY": {"name": "Bayelsa", "lat": 4.9167, "lon": 6.2667, "region": "South South"},
            "BE": {"name": "Benue", "lat": 7.7322, "lon": 8.5391, "region": "North Central"},
            "BO": {"name": "Borno", "lat": 11.8333, "lon": 13.1500, "region": "North East"},
            "CR": {"name": "Cross River", "lat": 4.9500, "lon": 8.3167, "region": "South South"},
            "DE": {"name": "Delta", "lat": 6.2000, "lon": 6.7333, "region": "South South"},
            "EB": {"name": "Ebonyi", "lat": 6.3333, "lon": 8.1000, "region": "South East"},
            "ED": {"name": "Edo", "lat": 6.3333, "lon": 5.6167, "region": "South South"},
            "EK": {"name": "Ekiti", "lat": 7.6167, "lon": 5.2167, "region": "South West"},
            "EN": {"name": "Enugu", "lat": 6.4500, "lon": 7.5000, "region": "South East"},
            "FCT": {"name": "Abuja", "lat": 9.0765, "lon": 7.3986, "region": "North Central"},
            "GO": {"name": "Gombe", "lat": 10.2894, "lon": 11.1717, "region": "North East"},
            "IM": {"name": "Imo", "lat": 5.4833, "lon": 7.0333, "region": "South East"},
            "KD": {"name": "Kaduna", "lat": 10.5200, "lon": 7.4383, "region": "North West"},
            "KN": {"name": "Kano", "lat": 12.0000, "lon": 8.5167, "region": "North West"},
            "KT": {"name": "Katsina", "lat": 12.9908, "lon": 7.6019, "region": "North West"},
            "KE": {"name": "Kebbi", "lat": 12.4500, "lon": 4.2000, "region": "North West"},
            "KO": {"name": "Kogi", "lat": 7.8019, "lon": 6.7446, "region": "North Central"},
            "KW": {"name": "Kwara", "lat": 8.5000, "lon": 4.5500, "region": "North Central"},
            "LA": {"name": "Lagos", "lat": 6.5244, "lon": 3.3792, "region": "South West"},
            "NA": {"name": "Nasarawa", "lat": 8.5000, "lon": 8.2000, "region": "North Central"},
            "NI": {"name": "Niger", "lat": 9.6000, "lon": 6.5500, "region": "North Central"},
            "OG": {"name": "Ogun", "lat": 7.1500, "lon": 3.3500, "region": "South West"},
            "ON": {"name": "Ondo", "lat": 7.2500, "lon": 5.2000, "region": "South West"},
            "OS": {"name": "Osun", "lat": 7.7667, "lon": 4.5667, "region": "South West"},
            "OY": {"name": "Oyo", "lat": 7.3833, "lon": 3.9000, "region": "South West"},
            "PL": {"name": "Plateau", "lat": 9.9167, "lon": 8.9000, "region": "North Central"},
            "RI": {"name": "Rivers", "lat": 4.7500, "lon": 7.0000, "region": "South South"},
            "SO": {"name": "Sokoto", "lat": 13.0667, "lon": 5.2333, "region": "North West"},
            "TA": {"name": "Taraba", "lat": 8.9000, "lon": 11.3667, "region": "North East"},
            "YO": {"name": "Yobe", "lat": 11.7500, "lon": 11.9667, "region": "North East"},
            "ZA": {"name": "Zamfara", "lat": 12.1700, "lon": 6.6600, "region": "North West"}
        }
    
    def get_current_weather_for_state(self, state_code: str) -> NigeriaWeatherData:
        """Get current weather data for a specific Nigeria state"""
        if state_code not in self.nigeria_states:
            raise ValueError(f"Invalid state code: {state_code}")
        
        state_info = self.nigeria_states[state_code]
        return self.get_current_weather(
            state_info['lat'], 
            state_info['lon'], 
            state_code, 
            state_info['region']
        )
    
    def get_current_weather(self, latitude: float, longitude: float, 
                          state_code: str = None, region: str = None) -> NigeriaWeatherData:
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
            'hourly': [
                'precipitation',
                'temperature_2m',
                'relative_humidity_2m'
            ],
            'timezone': 'Africa/Lagos'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            current = data['current']
            hourly = data['hourly']
            
            # Calculate 24h rainfall
            rainfall_24h = self._calculate_24h_rainfall(hourly)
            
            # Calculate 7d rainfall (simplified - would need historical data)
            rainfall_7d = rainfall_24h * 1.5  # Rough estimate
            
            # Estimate soil moisture and river level
            soil_moisture = self._estimate_soil_moisture(
                current['temperature_2m'], 
                rainfall_24h, 
                current['relative_humidity_2m']
            )
            
            river_level = self._estimate_river_level(rainfall_7d, state_code)
            
            return NigeriaWeatherData(
                timestamp=datetime.fromisoformat(current['time'].replace('Z', '+00:00')),
                latitude=latitude,
                longitude=longitude,
                state_code=state_code or "UNKNOWN",
                region=region or "UNKNOWN",
                temperature=current['temperature_2m'],
                humidity=current['relative_humidity_2m'],
                pressure=current['surface_pressure'],
                wind_speed=current['wind_speed_10m'],
                wind_direction=current['wind_direction_10m'],
                precipitation=current['precipitation'],
                rainfall_24h=rainfall_24h,
                rainfall_7d=rainfall_7d,
                soil_moisture=soil_moisture,
                river_level=river_level,
                raw_data=data
            )
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch weather data: {e}")
            raise
        except KeyError as e:
            logger.error(f"Unexpected API response format: {e}")
            raise
    
    def get_weather_forecast(self, state_code: str, days: int = 7) -> List[WeatherForecast]:
        """Get weather forecast for a Nigeria state"""
        if state_code not in self.nigeria_states:
            raise ValueError(f"Invalid state code: {state_code}")
        
        state_info = self.nigeria_states[state_code]
        return self.get_forecast(
            state_info['lat'], 
            state_info['lon'], 
            state_code, 
            days
        )
    
    def get_forecast(self, latitude: float, longitude: float, 
                    state_code: str = None, days: int = 7) -> List[WeatherForecast]:
        """Get weather forecast for a location"""
        url = f"{self.base_url}/forecast"
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'daily': [
                'temperature_2m_max',
                'temperature_2m_min',
                'relative_humidity_2m_mean',
                'surface_pressure_mean',
                'wind_speed_10m_max',
                'wind_direction_10m_dominant',
                'precipitation_sum',
                'precipitation_probability_max'
            ],
            'timezone': 'Africa/Lagos'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            daily = data['daily']
            forecasts = []
            
            for i, date_str in enumerate(daily['time'][:days]):
                forecasts.append(WeatherForecast(
                    timestamp=datetime.fromisoformat(date_str),
                    latitude=latitude,
                    longitude=longitude,
                    state_code=state_code or "UNKNOWN",
                    temperature=(daily['temperature_2m_max'][i] + daily['temperature_2m_min'][i]) / 2,
                    humidity=daily['relative_humidity_2m_mean'][i],
                    pressure=daily['surface_pressure_mean'][i],
                    wind_speed=daily['wind_speed_10m_max'][i],
                    wind_direction=daily['wind_direction_10m_dominant'][i],
                    precipitation=daily['precipitation_sum'][i],
                    precipitation_probability=daily['precipitation_probability_max'][i]
                ))
            
            return forecasts
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch forecast data: {e}")
            raise
        except KeyError as e:
            logger.error(f"Unexpected API response format: {e}")
            raise
    
    def get_all_states_weather(self) -> Dict[str, NigeriaWeatherData]:
        """Get current weather data for all Nigeria states"""
        all_weather = {}
        
        for state_code, state_info in self.nigeria_states.items():
            try:
                weather_data = self.get_current_weather(
                    state_info['lat'], 
                    state_info['lon'], 
                    state_code, 
                    state_info['region']
                )
                all_weather[state_code] = weather_data
                logger.info(f"Fetched weather for {state_info['name']} ({state_code})")
                
                # Add small delay to avoid rate limiting
                import time
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Failed to fetch weather for {state_code}: {e}")
                continue
        
        return all_weather
    
    def _calculate_24h_rainfall(self, hourly_data: Dict[str, List]) -> float:
        """Calculate 24-hour rainfall from hourly data"""
        try:
            precipitation = hourly_data.get('precipitation', [])
            if len(precipitation) >= 24:
                return sum(precipitation[:24])
            else:
                return sum(precipitation) if precipitation else 0.0
        except Exception:
            return 0.0
    
    def _estimate_soil_moisture(self, temperature: float, rainfall_24h: float, humidity: float) -> float:
        """Estimate soil moisture based on weather conditions"""
        # Simple model: higher rainfall and humidity = higher soil moisture
        # Higher temperature = more evaporation = lower soil moisture
        base_moisture = 0.3
        rainfall_factor = min(0.4, rainfall_24h / 50)  # Max 0.4 from rainfall
        humidity_factor = (humidity - 50) / 100 * 0.2  # Humidity contribution
        temperature_factor = max(0, (30 - temperature) / 20 * 0.1)  # Temperature effect
        
        soil_moisture = base_moisture + rainfall_factor + humidity_factor + temperature_factor
        return max(0.0, min(1.0, soil_moisture))
    
    def _estimate_river_level(self, rainfall_7d: float, state_code: str = None) -> float:
        """Estimate river level based on rainfall and state characteristics"""
        base_level = 2.0
        
        # State-specific flood risk factors
        flood_risk_factors = {
            'AN': 2.0, 'BY': 2.0, 'DE': 2.0, 'RI': 2.0, 'LA': 2.0,  # Critical risk states
            'AB': 1.5, 'AK': 1.5, 'CR': 1.5, 'EB': 1.5, 'ED': 1.5, 'IM': 1.5, 'OG': 1.5,  # High risk states
            'BE': 1.5, 'TA': 1.5, 'AD': 1.5,  # High risk states
            'FCT': 1.0, 'BA': 1.0, 'GO': 1.0, 'KD': 1.0, 'KW': 1.0, 'NA': 1.0, 'NI': 1.0,  # Medium risk states
            'EK': 1.0, 'EN': 1.0, 'ON': 1.0, 'OS': 1.0, 'OY': 1.0, 'KE': 1.0,  # Medium risk states
            'BO': 0.5, 'YO': 0.5, 'KN': 0.5, 'KT': 0.5, 'SO': 0.5, 'ZA': 0.5, 'PL': 0.5  # Low risk states
        }
        
        risk_factor = flood_risk_factors.get(state_code, 1.0)
        
        # Calculate river level
        river_level = base_level + (rainfall_7d * 0.1 * risk_factor) + np.random.normal(0, 0.2)
        return max(1.0, river_level)

class NigeriaWeatherDataIngestion:
    """Enhanced weather data ingestion service for Nigeria"""
    
    def __init__(self):
        # Initialize Supabase client
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found, database operations will be disabled")
            self.supabase = None
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)
        
        self.weather_service = NigeriaOpenMeteoService()
        
        # Define sensor types for weather data
        self.weather_sensor_types = {
            'temperature': 'TEMP',
            'humidity': 'HUMIDITY', 
            'pressure': 'PRESSURE',
            'wind_speed': 'WIND',
            'precipitation': 'RAIN'
        }
    
    def ingest_all_states_weather(self) -> Dict[str, NigeriaWeatherData]:
        """Ingest current weather data for all Nigeria states"""
        try:
            all_weather = self.weather_service.get_all_states_weather()
            
            # Store data in database
            for state_code, weather_data in all_weather.items():
                self._store_weather_data(weather_data)
            
            logger.info(f"Successfully ingested weather data for {len(all_weather)} states")
            return all_weather
            
        except Exception as e:
            logger.error(f"Failed to ingest all states weather: {e}")
            raise
    
    def ingest_state_weather(self, state_code: str) -> NigeriaWeatherData:
        """Ingest current weather data for a specific state"""
        try:
            weather_data = self.weather_service.get_current_weather_for_state(state_code)
            self._store_weather_data(weather_data)
            
            logger.info(f"Successfully ingested weather for {state_code}")
            return weather_data
            
        except Exception as e:
            logger.error(f"Failed to ingest weather for {state_code}: {e}")
            raise
    
    def _store_weather_data(self, weather_data: NigeriaWeatherData):
        """Store weather data in the database"""
        if not self.supabase:
            logger.warning("Database not available, skipping data storage")
            return
        
        try:
            # Ensure sensors exist for this location
            sensor_ids = self._ensure_weather_sensors_exist(
                weather_data.latitude, 
                weather_data.longitude, 
                weather_data.state_code
            )
            
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
                            'source': 'open-meteo-nigeria',
                            'state_code': weather_data.state_code,
                            'region': weather_data.region,
                            'rainfall_24h': weather_data.rainfall_24h,
                            'rainfall_7d': weather_data.rainfall_7d,
                            'soil_moisture': weather_data.soil_moisture,
                            'river_level': weather_data.river_level,
                            'timestamp': weather_data.timestamp.isoformat()
                        })
                    }
                    readings.append(reading)
            
            # Insert all readings
            if readings:
                result = self.supabase.table('sensor_readings').insert(readings).execute()
                if result.data:
                    logger.info(f"Stored {len(readings)} weather readings for {weather_data.state_code}")
                else:
                    logger.error(f"Failed to store weather readings for {weather_data.state_code}")
        
        except Exception as e:
            logger.error(f"Error storing weather data for {weather_data.state_code}: {e}")
    
    def _ensure_weather_sensors_exist(self, latitude: float, longitude: float, 
                                    state_code: str) -> Dict[str, str]:
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
                    'name': f"{state_code} Weather {sensor_name.title()} Sensor",
                    'type': sensor_type,
                    'lat': latitude,
                    'lon': longitude,
                    'elevation': 0.0
                }
                
                result = self.supabase.table('sensors').insert(sensor_data).execute()
                if result.data:
                    sensor_ids[sensor_name] = result.data[0]['id']
                    logger.info(f"Created new {sensor_name} sensor for {state_code}: {sensor_ids[sensor_name]}")
        
        return sensor_ids
    
    def get_weather_data_for_training(self, state_codes: List[str] = None, 
                                    days_back: int = 30) -> List[Dict[str, Any]]:
        """Get weather data from database for ML model training"""
        if not self.supabase:
            logger.warning("Database not available, returning empty training data")
            return []
        
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Use all states if none specified
            if state_codes is None:
                state_codes = list(self.weather_service.nigeria_states.keys())
            
            all_training_data = []
            
            for state_code in state_codes:
                state_info = self.weather_service.nigeria_states[state_code]
                
                # Get sensor IDs for this state
                sensor_ids = {}
                for sensor_type in self.weather_sensor_types.values():
                    result = self.supabase.table('sensors').select('id').eq('type', sensor_type).eq('lat', state_info['lat']).eq('lon', state_info['lon']).execute()
                    if result.data:
                        sensor_ids[sensor_type] = result.data[0]['id']
                
                if not sensor_ids:
                    logger.warning(f"No weather sensors found for {state_code}")
                    continue
                
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
                        grouped_data[ts] = {
                            'timestamp': ts,
                            'state_code': state_code,
                            'region': state_info['region'],
                            'latitude': state_info['lat'],
                            'longitude': state_info['lon']
                        }
                    
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
                        
                        # Extract additional data from raw field
                        if reading.get('raw'):
                            try:
                                raw_data = json.loads(reading['raw'])
                                if 'rainfall_24h' in raw_data:
                                    grouped_data[ts]['rainfall_24h'] = raw_data['rainfall_24h']
                                if 'rainfall_7d' in raw_data:
                                    grouped_data[ts]['rainfall_7d'] = raw_data['rainfall_7d']
                                if 'soil_moisture' in raw_data:
                                    grouped_data[ts]['soil_moisture'] = raw_data['soil_moisture']
                                if 'river_level' in raw_data:
                                    grouped_data[ts]['river_level'] = raw_data['river_level']
                            except json.JSONDecodeError:
                                pass
                
                # Convert to list and add to training data
                state_training_data = list(grouped_data.values())
                all_training_data.extend(state_training_data)
            
            # Sort by timestamp
            all_training_data.sort(key=lambda x: x['timestamp'])
            
            logger.info(f"Retrieved {len(all_training_data)} weather records for training from {len(state_codes)} states")
            return all_training_data
            
        except Exception as e:
            logger.error(f"Failed to get weather data for training: {e}")
            return []

# Global instances
nigeria_weather_service = NigeriaOpenMeteoService()
nigeria_weather_ingestion = NigeriaWeatherDataIngestion()

# Example usage functions
def get_nigeria_state_weather(state_code: str) -> NigeriaWeatherData:
    """Get current weather data for a specific Nigeria state"""
    return nigeria_weather_service.get_current_weather_for_state(state_code)

def get_nigeria_weather_forecast(state_code: str, days: int = 7) -> List[WeatherForecast]:
    """Get weather forecast for a Nigeria state"""
    return nigeria_weather_service.get_weather_forecast(state_code, days)

def ingest_nigeria_weather_data(state_code: str = None) -> Dict[str, NigeriaWeatherData]:
    """Ingest weather data for Nigeria states"""
    if state_code:
        return {state_code: nigeria_weather_ingestion.ingest_state_weather(state_code)}
    else:
        return nigeria_weather_ingestion.ingest_all_states_weather()

def get_nigeria_weather_training_data(state_codes: List[str] = None, days_back: int = 30):
    """Get weather data for ML model training"""
    return nigeria_weather_ingestion.get_weather_data_for_training(state_codes, days_back)
