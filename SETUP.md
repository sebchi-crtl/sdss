# SDSS Webapp - Complete Setup Guide

This guide will help you set up and run the complete Smart Decision Support System (SDSS) for flood early warning.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.8+ with pip
- Supabase account (free tier works)
- MQTT broker (optional, for real-time data)

### 2. Installation

```bash
# Clone and install dependencies
git clone <your-repo>
cd SDSS-webapp-extended
npm install

# Install Python dependencies for ML model
pip install -r requirements.txt
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ML Model Configuration
MODEL_URL=http://localhost:8200/predict

# MQTT Configuration (optional)
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# Map Configuration
NEXT_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json
```

### 4. Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the URL and keys to your `.env.local`

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy and paste the contents of `db/schema.sql`
   - Execute the script

3. **Create Storage Bucket**
   - In Supabase Dashboard → Storage
   - Create a new bucket named `sdss`
   - Set it to public read access

4. **Set Up Authentication**
   - In Supabase Dashboard → Authentication → Settings
   - Enable email authentication
   - Add your domain to allowed origins

### 5. Start the Application

```bash
# Terminal 1: Start the ML model server
python main.py

# Terminal 2: Start the Next.js application
npm run dev

# Terminal 3: Start MQTT simulator (optional)
npm run mqtt:sim

# Terminal 4: Start MQTT worker (optional)
npm run mqtt:worker
```

The application will be available at `http://localhost:3000`

## 📊 Features Overview

### Dashboard
- **Real-time Statistics**: Active sensors, open alerts, 24h readings
- **Flood Risk Chart**: ML-powered predictions for 24-72h horizons
- **Live Feed**: Real-time sensor data and alerts

### Sensor Management
- **CRUD Operations**: Add, view, and delete sensors
- **Multiple Types**: Rain gauges, river gauges, water level, temperature, humidity
- **Real-time Updates**: Live sensor readings on the map

### Analytics
- **Time Series Charts**: Historical data visualization
- **Multiple Time Ranges**: 1h, 24h, 7d, 30d views
- **Sensor Filtering**: Filter by sensor type

### Map View
- **Interactive Map**: Real-time sensor locations
- **Status Indicators**: Color-coded sensor health
- **GIS Overlays**: Risk area boundaries
- **Real-time Updates**: Live sensor data streaming

### Community Reports
- **Photo Upload**: Citizens can report with images
- **Location Tracking**: GPS coordinates for reports
- **Real-time Processing**: Immediate report submission

### Alert System
- **Automated Evaluation**: Rule-based alert generation
- **Multiple Alert Types**: Flood, rain, river rise, system alerts
- **Severity Levels**: Info, Watch, Warning, Emergency

## 🔧 Configuration

### ML Model Configuration

The ML model (`main.py`) provides flood risk predictions based on:
- Rainfall data (24h accumulation)
- River levels
- Soil moisture
- Temperature
- Weather forecasts

You can customize the model by modifying the `calculate_flood_risk` function.

### Alert Rules

Configure alert rules in the database:

```sql
INSERT INTO alert_rules (name, alert_type, level, threshold, message) VALUES
('Heavy Rainfall Alert', 'RAIN', 'WARNING', 25.0, 'Heavy rainfall detected - potential flood risk'),
('River Level Critical', 'RIVER_RISE', 'EMERGENCY', 4.5, 'River level critical - immediate evacuation may be required');
```

### MQTT Integration

The system supports MQTT for real-time sensor data:

- **Topic Pattern**: `sdss/sensors/{sensor_id}/readings`
- **Message Format**: JSON with sensor_id, timestamp, value, coordinates, status
- **Worker**: Automatically forwards MQTT messages to the API

## 📈 Data Management

### Sample Data

Populate the database with sample data:

```bash
npm run seed
```

This creates:
- 6 sample sensors of different types
- 3 alert rules
- 7 days of historical readings
- Sample sensor configurations

### Data Export

Export sensor readings:

```bash
# Get readings for specific time range
curl "http://localhost:3000/api/readings?range=24h&type=RAIN"
```

## 🚨 Alert Management

### Manual Alert Evaluation

```bash
npm run alerts:evaluate
```

### Automated Alerts

Set up cron jobs or scheduled tasks to call:
```
POST http://localhost:3000/api/cron/evaluate
```

## 🗺️ Map Configuration

### Custom Map Styles

Update `NEXT_PUBLIC_MAP_STYLE` in `.env.local`:
- MapLibre styles
- OpenStreetMap tiles
- Custom map servers

### GIS Data

Replace `public/data/areas.geojson` with your own:
- Risk area boundaries
- Administrative regions
- Infrastructure data

## 🔒 Security

### Row Level Security (RLS)

The database uses Supabase RLS policies:
- Public read access for map/analytics
- Admin-only write access for sensors/alerts
- User-specific profile access

### API Security

- Service role key for server-side operations
- Rate limiting recommended for production
- Input validation on all endpoints

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Progressive Web App (PWA) ready

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
MODEL_URL=your_ml_model_url
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Check your environment variables
   - Verify RLS policies are set up correctly
   - Ensure storage bucket exists

2. **ML Model Not Responding**
   - Check if Python server is running on port 8200
   - Verify MODEL_URL in environment variables
   - Check Python dependencies are installed

3. **MQTT Connection Issues**
   - Verify MQTT broker is running
   - Check MQTT credentials
   - Ensure network connectivity

4. **Map Not Loading**
   - Check NEXT_PUBLIC_MAP_STYLE URL
   - Verify GeoJSON file exists
   - Check browser console for errors

### Logs and Debugging

- **Next.js**: Check browser console and terminal output
- **ML Model**: Check Python server logs
- **MQTT**: Check MQTT broker logs and worker output
- **Database**: Use Supabase dashboard logs

## 📚 API Documentation

### Endpoints

- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/readings` - Sensor readings with filtering
- `GET /api/predictions` - Flood risk predictions
- `POST /api/sensors` - Create sensor
- `DELETE /api/sensors/{id}` - Delete sensor
- `POST /api/reports` - Submit community report
- `POST /api/cron/evaluate` - Evaluate alert rules

### WebSocket/Realtime

- Supabase Realtime for live sensor updates
- MQTT integration for external sensor data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Happy monitoring! 🌊📊**
