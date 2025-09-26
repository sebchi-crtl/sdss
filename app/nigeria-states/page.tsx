"use client";

import { useState, useEffect } from "react";
import NigeriaStateSelector from "@/components/NigeriaStateSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NigeriaState {
  name: string;
  code: string;
  region: string;
  capital: string;
  latitude: number;
  longitude: number;
  population: number;
  area_km2: number;
  flood_risk_level: 'low' | 'medium' | 'high' | 'critical';
  major_rivers: string[];
  climate_zone: string;
}

export default function NigeriaStatesPage() {
  const [selectedState, setSelectedState] = useState<NigeriaState | null>(null);
  const [coordinateUpdates, setCoordinateUpdates] = useState<Array<{
    stateCode: string;
    lat: number;
    lon: number;
    timestamp: string;
  }>>([]);
  const [stateStats, setStateStats] = useState({
    totalStates: 0,
    criticalRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    regions: new Set<string>()
  });

  const handleStateSelect = (state: NigeriaState) => {
    setSelectedState(state);
  };

  const handleCoordinatesUpdate = (stateCode: string, lat: number, lon: number) => {
    const update = {
      stateCode,
      lat,
      lon,
      timestamp: new Date().toLocaleString()
    };
    setCoordinateUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
    
    // Refresh stats when coordinates are updated (in case risk levels changed)
    setTimeout(() => {
      calculateStateStats();
    }, 1000);
  };

  const calculateStateStats = async () => {
    try {
      const response = await fetch("/api/nigeria?endpoint=coordinates");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          const states = data.data;
          
          const stats = {
            totalStates: states.length as number,
            criticalRisk: states.filter((s: any) => s.flood_risk_level === 'critical').length as number,
            highRisk: states.filter((s: any) => s.flood_risk_level === 'high').length as number,
            mediumRisk: states.filter((s: any) => s.flood_risk_level === 'medium').length as number,
            lowRisk: states.filter((s: any) => s.flood_risk_level === 'low').length as number,
            regions: new Set<string>(states.map((s: any) => s.region as string))
          };
          
          setStateStats(stats);
        }
      }
    } catch (error) {
      console.error('Error calculating state stats:', error);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    calculateStateStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Nigeria States Management</h1>
        <p className="text-gray-600">
          Select and manage Nigeria states with their coordinates and flood risk information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Selector */}
        <div className="lg:col-span-2">
          <NigeriaStateSelector
            onStateSelect={handleStateSelect}
            onCoordinatesUpdate={handleCoordinatesUpdate}
          />
        </div>

        {/* Sidebar with recent updates */}
        <div className="space-y-4">
          {selectedState && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected State</CardTitle>
                <CardDescription>Current selection details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>{selectedState.name}</strong> ({selectedState.code})</div>
                  <div className="text-sm text-gray-600">{selectedState.region}</div>
                  <div className="text-sm">
                    <Badge 
                      className={`${
                        selectedState.flood_risk_level === 'critical' ? 'bg-red-500' :
                        selectedState.flood_risk_level === 'high' ? 'bg-orange-500' :
                        selectedState.flood_risk_level === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      } text-white`}
                    >
                      {selectedState.flood_risk_level.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="text-sm">
                    📍 {selectedState.latitude}, {selectedState.longitude}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {coordinateUpdates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Updates</CardTitle>
                <CardDescription>Latest coordinate changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {coordinateUpdates.map((update, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{update.stateCode}</div>
                      <div className="text-gray-600">
                        📍 {update.lat}, {update.lon}
                      </div>
                      <div className="text-xs text-gray-500">{update.timestamp}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => {
                  if (selectedState) {
                    const url = `https://www.google.com/maps?q=${selectedState.latitude},${selectedState.longitude}`;
                    window.open(url, '_blank');
                  }
                }}
                disabled={!selectedState}
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                View on Google Maps
              </button>
              
              <button
                onClick={() => {
                  if (selectedState) {
                    navigator.clipboard.writeText(`${selectedState.latitude}, ${selectedState.longitude}`);
                  }
                }}
                disabled={!selectedState}
                className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Copy Coordinates
              </button>

              <button
                onClick={async () => {
                  if (selectedState) {
                    try {
                      // First try the Nigeria API
                      const weatherUrl = `/api/nigeria?endpoint=weather&state_code=${selectedState.code}`;
                      const response = await fetch(weatherUrl);
                      const data = await response.json();
                      
                      if (data.success && data.data.weather) {
                        const weather = data.data.weather;
                        alert(`Weather for ${selectedState.name} (${selectedState.code}):\n\n` +
                              `Temperature: ${weather.temperature}°C\n` +
                              `Humidity: ${weather.humidity}%\n` +
                              `Pressure: ${weather.pressure} hPa\n` +
                              `Wind Speed: ${weather.wind_speed} m/s\n` +
                              `Precipitation: ${weather.precipitation} mm\n` +
                              `Rainfall 24h: ${weather.rainfall_24h} mm\n` +
                              `Soil Moisture: ${weather.soil_moisture}\n` +
                              `River Level: ${weather.river_level} m\n` +
                              `Timestamp: ${weather.timestamp}`);
                      } else {
                        // Fallback: try direct weather ingestion
                        const ingestUrl = `/api/weather`;
                        const ingestResponse = await fetch(ingestUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            state_code: selectedState.code,
                            type: 'current'
                          })
                        });
                        
                        const ingestData = await ingestResponse.json();
                        if (ingestData.success) {
                          alert(`Weather data ingested for ${selectedState.name}!\n\n` +
                                `Check the database for the latest weather readings.`);
                        } else {
                          alert(`Failed to fetch weather data for ${selectedState.name}.\n\n` +
                                `Error: ${data.error || ingestData.error || 'Unknown error'}\n\n` +
                                `Make sure the Python FastAPI service is running on port 8200.`);
                        }
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert(`Error fetching weather data for ${selectedState.name}.\n\n` +
                            `Make sure the Python FastAPI service is running on port 8200.\n\n` +
                            `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }
                }}
                disabled={!selectedState}
                className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Get Weather Data
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Information Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>About Nigeria States</CardTitle>
              <CardDescription>
                Information about Nigeria's administrative divisions and flood risk assessment
              </CardDescription>
            </div>
            <button
              onClick={calculateStateStats}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Stats
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stateStats.totalStates}</div>
              <div className="text-sm text-gray-600">Total States</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stateStats.regions.size}</div>
              <div className="text-sm text-gray-600">Geopolitical Zones</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stateStats.criticalRisk}</div>
              <div className="text-sm text-gray-600">Critical Risk States</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stateStats.highRisk}</div>
              <div className="text-sm text-gray-600">High Risk States</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Flood Risk Distribution:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical: {stateStats.criticalRisk} states</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>High: {stateStats.highRisk} states</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medium: {stateStats.mediumRisk} states</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Low: {stateStats.lowRisk} states</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Geopolitical Zones:</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(stateStats.regions).map((region, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {region}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
