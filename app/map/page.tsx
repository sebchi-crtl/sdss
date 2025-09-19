"use client";
import MapView from "@/components/map/MapView";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RequireAuth from "@/components/RequireAuth";
import { subscribeToReadings } from "@/lib/realtime";

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

  return (
    <RequireAuth>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Operational Map</h1>
          <div className="flex items-center gap-4">
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
              <MapView markers={markers} />
            )}
          </CardContent>
        </Card>

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
      </div>
    </RequireAuth>
  );
}
