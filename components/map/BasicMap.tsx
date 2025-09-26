"use client";

import { useEffect, useRef, useState } from "react";
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

interface BasicMapProps {
  markers?: Marker[];
  onMapClick?: (lat: number, lon: number) => void;
  onSensorClick?: (marker: Marker) => void;
  selectedSensor?: Marker | null;
}

export default function BasicMap({ markers = [], onMapClick, onSensorClick, selectedSensor }: BasicMapProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    const initMap = async () => {
      try {
        // Import Leaflet dynamically
        const L = await import('leaflet');
        
        // Only create map if it doesn't exist
        if (mapInstanceRef.current) return;

        // Create map
        const map = L.map(mapRef.current!, {
          center: [9.0, 7.317],
          zoom: 9
        });

        console.log('Map created:', map);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        
        console.log('Tile layer added to map');

        // Add click handler
        if (onMapClick) {
          map.on('click', (e: any) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
          });
        }

        mapInstanceRef.current = map;

        // Add a test marker to verify map is working
        const testMarker = L.marker([9.0, 7.317]).addTo(map);
        testMarker.bindPopup('Test marker - Map is working!');
        console.log('Test marker added');

        // Force resize after a short delay
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 500);

      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, onMapClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isClient) return;

    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');
        
        console.log('Updating markers:', markers); // Debug log
        
        // Add new markers or demo markers if none exist
        const markersToShow = markers.length > 0 ? markers : [
          { id: "demo-1", lon: 7.317, lat: 9.0, status: "OK", name: "Demo Sensor 1", type: "RAIN" },
          { id: "demo-2", lon: 7.43, lat: 8.98, status: "WARN", name: "Demo Sensor 2", type: "RIVER" },
          { id: "demo-3", lon: 7.25, lat: 8.95, status: "CRIT", name: "Demo Sensor 3", type: "WATER_LEVEL" }
        ];
        
        console.log('Cleared existing markers, adding new ones:', markersToShow.length);

        // Clear existing markers (but keep the test marker)
        mapInstanceRef.current.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const popup = layer.getPopup();
            if (!popup || popup.getContent() !== 'Test marker - Map is working!') {
              mapInstanceRef.current.removeLayer(layer);
            }
          }
        });

        markersToShow.forEach((marker) => {
          console.log('Adding marker:', marker); // Debug log
          const color = marker.status === "CRIT" ? "#dc2626" : 
                       marker.status === "WARN" ? "#eab308" : "#22c55e";
          
          let leafletMarker;
          
          try {
            // Create a simple, visible marker
            const markerIcon = L.divIcon({
              className: 'sensor-marker',
              html: `
                <div style="
                  width: 24px; 
                  height: 24px; 
                  background: ${color}; 
                  border: 3px solid white; 
                  border-radius: 50%; 
                  box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                  position: relative;
                  cursor: pointer;
                  z-index: 1000;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px; 
                    height: 8px; 
                    background: white; 
                    border-radius: 50%;
                  "></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            leafletMarker = L.marker([marker.lat, marker.lon], { icon: markerIcon });
          } catch (error) {
            console.warn('Custom icon failed, using default marker:', error);
            // Fallback to default marker with custom color
            leafletMarker = L.circleMarker([marker.lat, marker.lon], {
              radius: 12,
              fillColor: color,
              color: 'white',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.9
            });
          }
          
          // Ensure marker is added to map
          if (!leafletMarker.getLatLng) {
            console.error('Invalid marker created for:', marker.id);
            return;
          }
          
          leafletMarker.addTo(mapInstanceRef.current);

          // Add click handler for sensor navigation
          leafletMarker.on('click', () => {
            console.log('Marker clicked:', marker);
            if (onSensorClick) {
              onSensorClick(marker);
            }
          });
          
          console.log('Added marker to map:', marker.id, 'at', marker.lat, marker.lon);

          leafletMarker.bindPopup(`
            <div style="padding: 12px; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="
                  width: 12px; 
                  height: 12px; 
                  background: ${color}; 
                  border-radius: 50%;
                  animation: pulse 2s infinite;
                "></div>
                <strong style="font-size: 16px;">${marker.name || marker.id}</strong>
              </div>
              <div style="font-size: 14px; line-height: 1.4;">
                <div><strong>Status:</strong> ${marker.status || "OK"}</div>
                <div><strong>Type:</strong> ${marker.type || "Unknown"}</div>
                ${marker.value ? `<div><strong>Value:</strong> ${marker.value}</div>` : ''}
                <div><strong>Location:</strong> ${marker.lat.toFixed(4)}, ${marker.lon.toFixed(4)}</div>
              </div>
              <div style="
                margin-top: 12px; 
                padding: 8px; 
                background: #f3f4f6; 
                border-radius: 4px; 
                font-size: 12px; 
                color: #6b7280;
                text-align: center;
              ">
                📡 Click to open Weather & Training
              </div>
            </div>
          `);
        });

        // Fit bounds if markers exist
        if (markersToShow.length > 0) {
          const group = L.featureGroup(markersToShow.map(m => L.marker([m.lat, m.lon])));
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Marker update error:', error);
      }
    };

    updateMarkers();
  }, [markers, isClient]);

  // Auto-zoom to selected sensor
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSensor || !isClient) return;

    const zoomToSensor = async () => {
      try {
        const L = await import('leaflet');
        
        // Zoom to selected sensor with smooth animation
        mapInstanceRef.current.setView([selectedSensor.lat, selectedSensor.lon], 15, {
          animate: true,
          duration: 1
        });
      } catch (error) {
        console.error('Auto-zoom error:', error);
      }
    };

    zoomToSensor();
  }, [selectedSensor, isClient]);

  if (!isClient) {
    return (
      <div className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200"
        style={{ minHeight: '500px' }}
      />
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            {markers.length > 0 ? `${markers.length} sensors` : 'Demo sensors'}
          </div>
        </div>
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
