# SDSS System Synchronization Guide

This guide explains how to synchronize your Next.js frontend, Python ML backend, and MQTT system for real-time flood prediction.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MQTT System   │    │   Next.js API   │    │  Python ML API  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │ Simulator │──┼────┼──│   Worker  │──┼────┼──│  Process  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │  Sensors  │──┼────┼──│  Database │  │    │  │  Predict  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Supabase DB   │
                    │                 │
                    │ • sensor_data   │
                    │ • predictions   │
                    │ • alerts        │
                    └─────────────────┘
```

## 🔄 Data Flow

1. **MQTT Simulator** → Publishes realistic sensor data
2. **MQTT Worker** → Consumes data and routes to:
   - Next.js API (stores in database)
   - Python ML API (real-time processing)
3. **Next.js Frontend** → Fetches predictions from Python ML
4. **Python ML** → Processes data and returns flood risk predictions
5. **Database** → Stores all sensor readings and predictions

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

**Windows:**
```bash
start-sync.bat
```

**Linux/Mac:**
```bash
./start-sync.sh
```

### Option 2: Manual Startup

1. **Start Next.js Frontend:**
   ```bash
   npm run dev
   ```

2. **Start Python ML Backend:**
   ```bash
   python main.py
   ```

3. **Start MQTT Worker:**
   ```bash
   npm run mqtt:worker
   ```

4. **Start MQTT Simulator:**
   ```bash
   npm run mqtt:sim
   ```

5. **Check System Status:**
   ```bash
   npm run sync
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Configuration
MODEL_URL=http://localhost:8200
NEXT_PUBLIC_API_URL=http://localhost:3000

# MQTT Configuration
MQTT_URL=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=sdss/sensors/+/readings
```

### Port Configuration

- **Next.js Frontend:** `http://localhost:3000`
- **Python ML Backend:** `http://localhost:8200`
- **MQTT Broker:** `mqtt://broker.hivemq.com:1883`

## 📊 API Endpoints

### Next.js API Routes

- `GET /api/predictions` - Get flood risk predictions
- `GET /api/readings` - Get sensor readings
- `POST /api/ingest` - Ingest MQTT sensor data
- `GET /api/sensors` - Get sensor information

### Python ML API Routes

- `POST /predict` - Get flood risk predictions
- `POST /process-sensor-data` - Process incoming sensor data
- `GET /health` - Health check
- `POST /retrain` - Retrain ML model
- `POST /weather/ingest` - Ingest weather data

## 🧪 Testing the Integration

1. **Check System Status:**
   ```bash
   npm run sync
   ```

2. **Test Predictions API:**
   ```bash
   curl http://localhost:3000/api/predictions
   ```

3. **Test Sensor Readings:**
   ```bash
   curl http://localhost:3000/api/readings?range=1h
   ```

4. **Test ML Health:**
   ```bash
   curl http://localhost:8200/health
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts:**
   - Ensure ports 3000 and 8200 are available
   - Check if other services are using these ports

2. **Database Connection:**
   - Verify Supabase credentials in `.env.local`
   - Check database schema is up to date

3. **MQTT Connection:**
   - Verify MQTT broker is accessible
   - Check network connectivity

4. **Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Logs and Debugging

- **Next.js:** Check browser console and terminal
- **Python ML:** Check terminal output for errors
- **MQTT:** Check worker and simulator terminal output

## 📈 Monitoring

The system provides real-time monitoring through:

1. **System Status Dashboard:** Run `npm run sync` to check all services
2. **API Health Checks:** Each service provides health endpoints
3. **Database Monitoring:** Check Supabase dashboard for data flow
4. **MQTT Monitoring:** Check broker logs and message flow

## 🔄 Data Synchronization

The system automatically synchronizes:

- **Sensor Data:** MQTT → Database → ML Processing
- **Predictions:** ML Model → Database → Frontend
- **Weather Data:** Open-Meteo API → Database → ML Training
- **Alerts:** Threshold Monitoring → Database → Frontend

## 🎯 Key Features

- ✅ **Real-time Data Flow:** MQTT sensors → Database → ML predictions
- ✅ **Automatic Synchronization:** All components stay in sync
- ✅ **Health Monitoring:** System status and error detection
- ✅ **Scalable Architecture:** Easy to add new sensors and features
- ✅ **Weather Integration:** Real weather data for accurate predictions

## 📝 Next Steps

1. **Add Real Sensors:** Replace MQTT simulator with real IoT devices
2. **Enhance ML Model:** Add more features and improve accuracy
3. **Add Alerts:** Implement real-time alerting system
4. **Mobile App:** Create mobile app for field monitoring
5. **Historical Analysis:** Add data analytics and reporting

---

For more information, check the individual component documentation or run `npm run sync` for system status.
