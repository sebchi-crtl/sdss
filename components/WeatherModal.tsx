"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Cloud, Thermometer, Droplets, Wind, Gauge, RefreshCw, Download } from "lucide-react";

interface WeatherData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  wind_speed?: number;
  wind_direction?: number;
  precipitation?: number;
  latitude?: number;
  longitude?: number;
}

interface SelectedSensor {
  id: string;
  lat: number;
  lon: number;
  status?: string;
  name?: string;
  type?: string;
  value?: number;
}

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLatitude?: number;
  initialLongitude?: number;
  selectedSensor?: SelectedSensor | null;
}

export default function WeatherModal({ 
  isOpen, 
  onClose, 
  initialLatitude, 
  initialLongitude,
  selectedSensor
}: WeatherModalProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || "");
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || "");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [training, setTraining] = useState(false);
  const [trainingSuccess, setTrainingSuccess] = useState(false);

  // Update coordinates when initial values change
  useEffect(() => {
    if (initialLatitude !== undefined) {
      setLatitude(initialLatitude.toString());
    }
    if (initialLongitude !== undefined) {
      setLongitude(initialLongitude.toString());
    }
  }, [initialLatitude, initialLongitude]);

  const fetchWeatherData = async () => {
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude");
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Invalid coordinate range");
      return;
    }

    setLoading(true);
    setError("");
    setWeatherData(null);

    try {
      const response = await fetch(`/api/weather?latitude=${lat}&longitude=${lon}&days_back=1`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch weather data");
      }

      if (data.data && data.data.length > 0) {
        setWeatherData(data.data[0]);
      } else {
        // If no historical data, try to get current weather
        const currentResponse = await fetch("/api/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            type: "current"
          })
        });
        
        const currentData = await currentResponse.json();
        if (currentResponse.ok && currentData.data && currentData.data.data) {
          setWeatherData(currentData.data.data);
        } else {
          throw new Error("No weather data available for this location");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const trainModelWithLocation = async () => {
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude");
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid coordinates");
      return;
    }

    setTraining(true);
    setTrainingSuccess(false);
    setError("");

    try {
      // Step 1: Ingest weather data for this location
      console.log("Ingesting weather data for training...");
      const ingestResponse = await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          type: "historical",
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!ingestResponse.ok) {
        const errorData = await ingestResponse.json();
        throw new Error(errorData.error || "Failed to ingest weather data");
      }

      console.log("Weather data ingested successfully");

      // Step 2: Trigger ML model retraining via Python API
      console.log("Triggering ML model retraining...");
      const modelUrl = process.env.NEXT_PUBLIC_MODEL_URL || "http://localhost:8200";
      
      const retrainResponse = await fetch(`${modelUrl}/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_real_data: true,
          latitude: lat,
          longitude: lon,
          days_back: 30
        })
      });

      if (!retrainResponse.ok) {
        const errorData = await retrainResponse.json();
        throw new Error(errorData.message || "Failed to retrain ML model");
      }

      const retrainData = await retrainResponse.json();
      console.log("Model retraining completed:", retrainData);

      setTrainingSuccess(true);
      setTimeout(() => setTrainingSuccess(false), 5000);
    } catch (err) {
      console.error("Training error:", err);
      setError(err instanceof Error ? err.message : "Failed to train model");
    } finally {
      setTraining(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Weather Data & Model Training">
      <div className="space-y-6">
        {/* Location Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Enter coordinates to fetch weather data and train the model</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                placeholder="9.025"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lon">Longitude</Label>
              <Input
                id="lon"
                type="number"
                step="any"
                placeholder="7.325"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={fetchWeatherData} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              {loading ? "Fetching..." : "Get Weather Data"}
            </Button>
            
            <Button 
              onClick={trainModelWithLocation} 
              disabled={training || !latitude || !longitude}
              variant="outline"
              className="flex items-center gap-2"
            >
              {training ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {training ? "Training..." : "Train Model"}
            </Button>
          </div>
        </div>

        {/* Selected Sensor Information */}
        {selectedSensor && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                Selected Sensor: {selectedSensor.name || selectedSensor.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      selectedSensor.status === "CRIT" ? "border-red-500 text-red-700" :
                      selectedSensor.status === "WARN" ? "border-yellow-500 text-yellow-700" :
                      "border-green-500 text-green-700"
                    }`}
                  >
                    {selectedSensor.status || "OK"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <span className="ml-2">{selectedSensor.type || "Unknown"}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Location:</span>
                  <span className="ml-2">{selectedSensor.lat.toFixed(4)}, {selectedSensor.lon.toFixed(4)}</span>
                </div>
                {selectedSensor.value && (
                  <div>
                    <span className="font-medium text-gray-600">Value:</span>
                    <span className="ml-2">{selectedSensor.value}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                📡 Weather data will be fetched for this sensor's location
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Training Success */}
        {trainingSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600 font-medium">✅ Model training completed successfully!</p>
            <p className="text-xs text-green-600 mt-1">
              Weather data ingested and ML model retrained with location-specific data from Open-Meteo.
            </p>
          </div>
        )}

        {/* Weather Data Display */}
        {weatherData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Current Weather Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Location: {weatherData.latitude?.toFixed(4) || latitude}, {weatherData.longitude?.toFixed(4) || longitude}</span>
                  <span>Updated: {formatTimestamp(weatherData.timestamp)}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Thermometer className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Temperature</div>
                      <div className="font-semibold">{weatherData.temperature?.toFixed(1) || 'N/A'}°C</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Humidity</div>
                      <div className="font-semibold">{weatherData.humidity?.toFixed(1) || 'N/A'}%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Gauge className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Pressure</div>
                      <div className="font-semibold">{weatherData.pressure?.toFixed(1) || 'N/A'} hPa</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Wind className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Wind Speed</div>
                      <div className="font-semibold">{weatherData.wind_speed?.toFixed(1) || 'N/A'} m/s</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Wind className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Wind Direction</div>
                      <div className="font-semibold">{weatherData.wind_direction ? getWindDirection(weatherData.wind_direction) : 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Precipitation</div>
                      <div className="font-semibold">{weatherData.precipitation?.toFixed(1) || 'N/A'} mm</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Data from Open-Meteo API
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
