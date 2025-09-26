"use client";
import DynamicLeafletMap from "@/components/map/DynamicLeafletMap";
import WeatherModal from "@/components/WeatherModal";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/RequireAuth";
import { subscribeToReadings } from "@/lib/realtime";
import { Cloud, MapPin, ChevronLeft, ChevronRight, Filter, List, Eye, EyeOff } from "lucide-react";

type SensorMarker = { 
  id: string; 
  lon: number; 
  lat: number; 
  status?: string;
  name?: string;
  type?: string;
  value?: number;
};

export default function MapPage() {
  const [markers, setMarkers] = useState<SensorMarker[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorMarker | null>(null);
  const [currentSensorIndex, setCurrentSensorIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showSensorList, setShowSensorList] = useState(false);

  // Load sensors from API
  useEffect(() => {
    async function loadSensors() {
      try {
        const response = await fetch("/api/sensors");
        const data = await response.json();
        setSensors(data.items || []);
        
        // Convert sensors to markers
        const sensorMarkers = (data.items || []).map((sensor: any) => ({
          id: sensor.id,
          lon: sensor.lon,
          lat: sensor.lat,
          status: "OK", // Default status
          name: sensor.name,
          type: sensor.type
        }));
        
        setMarkers(sensorMarkers);
      } catch (error) {
        console.error("Failed to load sensors:", error);
        // Fallback to demo markers
        setMarkers([
          { id: "demo-1", lon: 7.317, lat: 9.0, status: "OK", name: "Demo Sensor 1", type: "RAIN" },
          { id: "demo-2", lon: 7.43, lat: 8.98, status: "WARN", name: "Demo Sensor 2", type: "RIVER" }
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    loadSensors();
  }, []);

  // Subscribe to real-time readings
  useEffect(() => {
    const unsub = subscribeToReadings((row) => {
      if (row.lon && row.lat) {
        setMarkers((prev) => {
          // Update existing marker or add new one
          const existingIndex = prev.findIndex(m => m.id === row.sensor_id);
          const newMarker = {
            id: row.sensor_id,
            lon: row.lon,
            lat: row.lat,
            status: row.status || "OK",
            name: sensors.find(s => s.id === row.sensor_id)?.name || `Sensor ${row.sensor_id.slice(-4)}`,
            type: sensors.find(s => s.id === row.sensor_id)?.type || "UNKNOWN",
            value: row.value
          };
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newMarker;
            return updated;
          } else {
            return [newMarker, ...prev];
          }
        });
      }
    });
    
    return unsub;
  }, [sensors]);

  const getStatusCounts = () => {
    const counts = { OK: 0, WARN: 0, CRIT: 0 };
    markers.forEach(marker => {
      counts[marker.status as keyof typeof counts] = (counts[marker.status as keyof typeof counts] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Get filtered sensors based on status filter
  const getFilteredSensors = () => {
    if (!statusFilter) return markers;
    return markers.filter(marker => marker.status === statusFilter);
  };

  const filteredSensors = getFilteredSensors();

  // Navigation functions
  const navigateToSensor = (index: number) => {
    if (filteredSensors.length === 0) return;
    const newIndex = Math.max(0, Math.min(index, filteredSensors.length - 1));
    setCurrentSensorIndex(newIndex);
    const sensor = filteredSensors[newIndex];
    setSelectedSensor(sensor);
    setSelectedLocation({ lat: sensor.lat, lon: sensor.lon });
  };

  const navigatePrevious = () => {
    if (filteredSensors.length === 0) return;
    const newIndex = currentSensorIndex > 0 ? currentSensorIndex - 1 : filteredSensors.length - 1;
    navigateToSensor(newIndex);
  };

  const navigateNext = () => {
    if (filteredSensors.length === 0) return;
    const newIndex = currentSensorIndex < filteredSensors.length - 1 ? currentSensorIndex + 1 : 0;
    navigateToSensor(newIndex);
  };

  const setStatusFilterAndReset = (status: string | null) => {
    setStatusFilter(status);
    setCurrentSensorIndex(0);
    if (status && filteredSensors.length > 0) {
      navigateToSensor(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSensorIndex, filteredSensors]);

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    setSelectedSensor(null); // Clear sensor selection
    setWeatherModalOpen(true);
  };

  const handleSensorClick = (sensor: SensorMarker) => {
    setSelectedSensor(sensor);
    setSelectedLocation({ lat: sensor.lat, lon: sensor.lon });
    setWeatherModalOpen(true);
  };

  return (
    <RequireAuth>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Operational Map</h1>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setWeatherModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Cloud className="h-4 w-4" />
              Weather & Training
            </Button>
            <Button 
              onClick={() => setShowSensorList(!showSensorList)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {showSensorList ? <EyeOff className="h-4 w-4" /> : <List className="h-4 w-4" />}
              {showSensorList ? 'Hide List' : 'Show List'}
            </Button>
            <Badge variant="outline">{markers.length} sensors</Badge>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">●</span>
              <span>{statusCounts.OK}</span>
              <span className="text-yellow-500">●</span>
              <span>{statusCounts.WARN}</span>
              <span className="text-red-600">●</span>
              <span>{statusCounts.CRIT}</span>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        {markers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={navigatePrevious}
                      variant="outline"
                      size="sm"
                      disabled={filteredSensors.length === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={navigateNext}
                      variant="outline"
                      size="sm"
                      disabled={filteredSensors.length === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filter:</span>
                    <Button
                      onClick={() => setStatusFilterAndReset(null)}
                      variant={statusFilter === null ? "default" : "outline"}
                      size="sm"
                    >
                      All ({markers.length})
                    </Button>
                    <Button
                      onClick={() => setStatusFilterAndReset("OK")}
                      variant={statusFilter === "OK" ? "default" : "outline"}
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      OK ({statusCounts.OK})
                    </Button>
                    <Button
                      onClick={() => setStatusFilterAndReset("WARN")}
                      variant={statusFilter === "WARN" ? "default" : "outline"}
                      size="sm"
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      WARN ({statusCounts.WARN})
                    </Button>
                    <Button
                      onClick={() => setStatusFilterAndReset("CRIT")}
                      variant={statusFilter === "CRIT" ? "default" : "outline"}
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      CRIT ({statusCounts.CRIT})
                    </Button>
                  </div>
                </div>

                {filteredSensors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {currentSensorIndex + 1} of {filteredSensors.length}
                      {statusFilter && ` (${statusFilter} only)`}
                    </span>
                    {selectedSensor && (
                      <Badge variant="outline" className="ml-2">
                        {selectedSensor.name || selectedSensor.id}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {filteredSensors.length > 0 && selectedSensor && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">
                        {selectedSensor.name || selectedSensor.id}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Status: <span className="font-medium">{selectedSensor.status}</span> • 
                        Type: {selectedSensor.type} • 
                        Location: {selectedSensor.lat.toFixed(4)}, {selectedSensor.lon.toFixed(4)}
                        {selectedSensor.value && ` • Value: ${selectedSensor.value}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSensorClick(selectedSensor)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${showSensorList ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <Card>
              <CardHeader>
                <CardTitle>Real-time Sensor Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[70vh] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div className="text-gray-600">Loading map and sensors...</div>
                    </div>
                  </div>
                ) : (
            <DynamicLeafletMap 
              markers={markers} 
              onMapClick={handleMapClick}
              onSensorClick={handleSensorClick}
              selectedSensor={selectedSensor}
            />
                )}
              </CardContent>
            </Card>
          </div>

          {showSensorList && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Sensor List
                    {statusFilter && (
                      <Badge variant="outline" className="ml-2">
                        {statusFilter}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {filteredSensors.map((marker, index) => (
                      <div 
                        key={marker.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSensor?.id === marker.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => navigateToSensor(index)}
                      >
                        <div className={`w-3 h-3 rounded-full ${
                          marker.status === "CRIT" ? "bg-red-600" : 
                          marker.status === "WARN" ? "bg-yellow-500" : "bg-green-600"
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {marker.name || marker.id}
                          </div>
                          <div className="text-xs text-gray-600">
                            {marker.type} • {marker.lat.toFixed(3)}, {marker.lon.toFixed(3)}
                            {marker.value && ` • ${marker.value}`}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            marker.status === "CRIT" ? "border-red-600 text-red-600" : 
                            marker.status === "WARN" ? "border-yellow-500 text-yellow-600" : 
                            "border-green-600 text-green-600"
                          }`}
                        >
                          {marker.status || "OK"}
                        </Badge>
                      </div>
                    ))}
                    
                    {filteredSensors.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No sensors found</p>
                        <p className="text-xs">
                          {statusFilter ? `with status "${statusFilter}"` : 'in the system'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {filteredSensors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Navigation:</span>
                        <div className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
                          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd>
                          <span>or click sensors</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {markers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sensor Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markers.slice(0, 6).map((marker) => (
                  <div key={marker.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                    <div className={`w-3 h-3 rounded-full ${
                      marker.status === "CRIT" ? "bg-red-600" : 
                      marker.status === "WARN" ? "bg-yellow-500" : "bg-green-600"
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{marker.name}</div>
                      <div className="text-xs text-gray-600">
                        {marker.type} • {marker.lat.toFixed(3)}, {marker.lon.toFixed(3)}
                        {marker.value && ` • ${marker.value}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {marker.status || "OK"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Modal */}
        <WeatherModal
          isOpen={weatherModalOpen}
          onClose={() => {
            setWeatherModalOpen(false);
            setSelectedSensor(null);
            setSelectedLocation(null);
          }}
          initialLatitude={selectedLocation?.lat}
          initialLongitude={selectedLocation?.lon}
          selectedSensor={selectedSensor}
        />
      </div>
    </RequireAuth>
  );
}
