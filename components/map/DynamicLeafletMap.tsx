"use client";

import dynamic from "next/dynamic";
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

interface DynamicLeafletMapProps {
  markers?: Marker[];
  onMapClick?: (lat: number, lon: number) => void;
  onSensorClick?: (marker: Marker) => void;
  selectedSensor?: Marker | null;
}

// Dynamically import the basic map component with no SSR
const BasicMapView = dynamic(() => import("./BasicMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-gray-600">Loading map...</div>
      </div>
    </div>
  )
});

// Fallback sensor list component
const SensorListView = dynamic(() => import("./SensorList"), {
  ssr: false
});

export default function DynamicLeafletMap({ markers = [], onMapClick, onSensorClick, selectedSensor }: DynamicLeafletMapProps) {
  return (
    <div className="relative">
      <BasicMapView markers={markers} onMapClick={onMapClick} onSensorClick={onSensorClick} selectedSensor={selectedSensor} />
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
