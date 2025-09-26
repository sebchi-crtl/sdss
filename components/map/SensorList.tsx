"use client";

import { MapPin } from "lucide-react";

type Marker = { 
  id: string; 
  lon: number; 
  lat: number; 
  status?: string;
  name?: string;
  type?: string;
  value?: number;
};

interface SensorListProps {
  markers?: Marker[];
  onMapClick?: (lat: number, lon: number) => void;
}

export default function SensorList({ markers = [], onMapClick }: SensorListProps) {
  return (
    <div className="relative">
      <div className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-4xl w-full p-6">
          <div className="text-blue-600 text-lg font-medium mb-4">🗺️ Sensor Locations</div>
          <div className="text-gray-600 mb-6">
            {markers.length > 0 
              ? `Found ${markers.length} sensor${markers.length !== 1 ? 's' : ''} in your system:`
              : "No sensors found. Check your sensor data."
            }
          </div>
          
          {markers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {markers.map((marker) => (
                <div key={marker.id} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className={`w-4 h-4 rounded-full ${
                    marker.status === "CRIT" ? "bg-red-600" : 
                    marker.status === "WARN" ? "bg-yellow-500" : "bg-green-600"
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{marker.name || marker.id}</div>
                    <div className="text-xs text-gray-600">
                      {marker.type} • {marker.lat.toFixed(4)}, {marker.lon.toFixed(4)}
                      {marker.value && ` • ${marker.value}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {marker.status || "OK"}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {onMapClick && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Interactive map will be available once loaded</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Critical</span>
          </div>
        </div>
        {onMapClick && (
          <div className="flex items-center gap-2 text-blue-600">
            <MapPin className="h-4 w-4" />
            <span>Click map to get weather data</span>
          </div>
        )}
      </div>
    </div>
  );
}

