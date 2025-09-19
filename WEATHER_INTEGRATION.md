# 🌤️ Weather Data Integration with Open-Meteo

This document describes the integration of Open-Meteo weather data into the SDSS flood prediction system.

## 📋 Overview

The system now automatically fetches real weather data from Open-Meteo API and uses it to train the flood prediction ML model. All weather data is stored in the database and flows through the complete pipeline.

## 🏗️ Architecture

```
Open-Meteo API → Weather Service → Database → ML Model → Predictions
```

### Components

1. **Weather Service** (`lib/weather_service.py`)
   - Fetches current and historical weather data from Open-Meteo
   - Stores data in Supabase database
   - Manages weather sensors automatically

2. **ML Model** (`ml_model.py`)
   - Updated to use real weather data from database
   - Falls back to synthetic data if no real data available
   - Calculates derived features from weather data

3. **API Endpoints**
   - `/api/weather` - Ingest weather data
   - `/weather/ingest` - Ingest current weather
   - `/weather/training-data` - Get weather data for training

4. **Automation Scripts**
   - `weather_training_pipeline.py` - Full pipeline execution
   - `weather_cron.py` - Automated hourly data collection

## 🚀 Quick Start

### 1. Environment Setup

Ensure these environment variables are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Setup Script

```bash
python scripts/setup_weather_integration.py
```

### 4. Test the Integration

```bash
# Test weather data ingestion
python scripts/weather_training_pipeline.py --latitude 52.52 --longitude 13.41

# Test with different location
python scripts/weather_training_pipeline.py --latitude 40.71 --longitude -74.01 --days-back 7
```

## 📊 Data Flow

### Weather Data Collection

1. **Current Weather**: Fetched every hour via cron job
2. **Historical Weather**: Fetched for training data
3. **Sensor Management**: Weather sensors created automatically
4. **Data Storage**: All data stored in `sensor_readings` table

### ML Model Training

1. **Data Source**: Real weather data from database (with synthetic fallback)
2. **Features**: Temperature, humidity, pressure, wind, precipitation
3. **Derived Features**: Rainfall accumulation, soil moisture, river levels
4. **Training**: GradientBoostingRegressor with real data

## 🔧 API Usage

### Ingest Weather Data

```bash
# Current weather
curl -X POST "http://localhost:8200/weather/ingest" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 52.52, "longitude": 13.41, "type": "current"}'

# Historical weather (via Next.js API)
curl -X POST "http://localhost:3000/api/weather" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 52.52,
    "longitude": 13.41,
    "type": "historical",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }'
```

### Get Training Data

```bash
curl "http://localhost:8200/weather/training-data?latitude=52.52&longitude=13.41&days_back=30"
```

### Retrain Model with Real Data

```bash
curl -X POST "http://localhost:8200/retrain?use_real_data=true&latitude=52.52&longitude=13.41&days_back=30"
```

## 🤖 Automation

### Hourly Data Collection

Set up a cron job to collect weather data every hour:

```bash
# Add to crontab
0 * * * * cd /path/to/SDSS-webapp-extended && python scripts/weather_cron.py >> weather_cron.log 2>&1
```

### Automated Model Retraining

The cron job automatically retrains the model when new data is available.

## 📈 Monitoring

### Log Files

- `weather_cron.log` - Cron job execution logs
- Application logs show data ingestion status

### Database Monitoring

Check the `sensor_readings` table for weather data:
```sql
SELECT 
  s.type,
  COUNT(*) as readings_count,
  MAX(sr.ts) as latest_reading
FROM sensors s
JOIN sensor_readings sr ON s.id = sr.sensor_id
WHERE s.type IN ('TEMP', 'HUMIDITY', 'PRESSURE', 'WIND', 'RAIN')
GROUP BY s.type;
```

## 🎯 Features

### Weather Data Types

- **Temperature** (°C)
- **Humidity** (%)
- **Pressure** (hPa)
- **Wind Speed** (m/s)
- **Wind Direction** (degrees)
- **Precipitation** (mm)

### Derived Features

- **Rainfall 24h**: 24-hour precipitation sum
- **Rainfall 7d**: 7-day precipitation sum
- **Soil Moisture**: Estimated from rainfall and temperature
- **River Level**: Estimated from rainfall patterns

### Model Improvements

- Real weather data improves prediction accuracy
- Automatic feature engineering from weather data
- Fallback to synthetic data ensures system reliability
- Continuous learning with new data

## 🔍 Troubleshooting

### Common Issues

1. **No weather data in database**
   - Check environment variables
   - Verify Supabase connection
   - Run weather ingestion manually

2. **Model training fails**
   - Ensure sufficient weather data (at least 7 days)
   - Check database connectivity
   - Use synthetic data fallback

3. **Cron job not running**
   - Check cron service status
   - Verify script permissions
   - Check log files for errors

### Debug Commands

```bash
# Test weather service
python -c "from lib.weather_service import weather_ingestion; print(weather_ingestion.ingest_current_weather(52.52, 13.41))"

# Test ML model
python -c "from ml_model import flood_model; print(flood_model.train_models(use_real_data=True))"

# Check database connection
python -c "from lib.weather_service import weather_ingestion; print(weather_ingestion.get_weather_data_for_training(52.52, 13.41, 7))"
```

## 📚 Additional Resources

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python)
- [Scikit-learn Documentation](https://scikit-learn.org/stable/)

## 🎉 Benefits

1. **Real Data**: Model trained on actual weather conditions
2. **Automation**: Continuous data collection and model updates
3. **Reliability**: Fallback mechanisms ensure system stability
4. **Scalability**: Easy to add new locations and weather parameters
5. **Monitoring**: Comprehensive logging and error handling
