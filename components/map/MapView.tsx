"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

interface MapViewProps {
  markers?: Marker[];
  onMapClick?: (lat: number, lon: number) => void;
}

export default function MapView({ markers = [] as Marker[], onMapClick }: MapViewProps) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [7.317, 9.0],
        zoom: 9,
        attributionControl: true
      });

      // Add navigation controls
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      
      // Add scale control
      map.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), "bottom-left");

      map.on("load", () => {
        setMapLoaded(true);
        
        // Add click handler for map
        if (onMapClick) {
          map.on("click", (e) => {
            const { lng, lat } = e.lngLat;
            onMapClick(lat, lng);
          });
          
          // Change cursor to pointer to indicate clickable
          map.getCanvas().style.cursor = "crosshair";
        }
        
        // Add local areas overlay (public/data/areas.geojson)
        fetch("/data/areas.geojson")
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then((geojson) => {
            if (map.getSource("areas")) {
              map.removeLayer("areas-outline");
              map.removeLayer("areas-fill");
              map.removeSource("areas");
            }
            
            map.addSource("areas", { type: "geojson", data: geojson });
            
            map.addLayer({
              id: "areas-fill",
              type: "fill",
              source: "areas",
              paint: { 
                "fill-color": [
                  "case",
                  ["==", ["get", "risk_level"], "critical"], "#dc2626",
                  ["==", ["get", "risk_level"], "high"], "#ea580c",
                  ["==", ["get", "risk_level"], "medium"], "#d97706",
                  "#22c55e"
                ],
                "fill-opacity": 0.2
              }
            });
            
            map.addLayer({
              id: "areas-outline",
              type: "line",
              source: "areas",
              paint: { 
                "line-color": [
                  "case",
                  ["==", ["get", "risk_level"], "critical"], "#991b1b",
                  ["==", ["get", "risk_level"], "high"], "#c2410c",
                  ["==", ["get", "risk_level"], "medium"], "#b45309",
                  "#166534"
                ],
                "line-width": 2
              }
            });

            // Add hover effect
            map.on("mouseenter", "areas-fill", () => {
              map.getCanvas().style.cursor = "pointer";
            });

            map.on("mouseleave", "areas-fill", () => {
              map.getCanvas().style.cursor = "";
            });
          })
          .catch((err) => {
            console.warn("Could not load areas overlay:", err);
          });
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Failed to load map");
      });

      mapRef.current = map;
      
      return () => { 
        if (mapRef.current) {
          mapRef.current.remove(); 
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Failed to initialize map");
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear existing markers
    const existingMarkers = (map as any).__markers || [];
    existingMarkers.forEach((marker: maplibregl.Marker) => marker.remove());
    (map as any).__markers = [];

    // Add new markers
    markers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = "relative";
      
      // Create marker icon based on status
      const statusColor = marker.status === "CRIT" ? "bg-red-600" : 
                         marker.status === "WARN" ? "bg-yellow-500" : "bg-green-600";
      
      el.innerHTML = `
        <div class="w-4 h-4 rounded-full ${statusColor} border-2 border-white shadow-lg"></div>
        <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
          ${marker.name || marker.id}: ${marker.value || 'N/A'} ${marker.type || ''}
        </div>
      `;
      
      const mapMarker = new maplibregl.Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([marker.lon, marker.lat])
        .addTo(map);
      
      (map as any).__markers.push(mapMarker);
    });

    // Fit map to show all markers if there are any
    if (markers.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach(marker => {
        bounds.extend([marker.lon, marker.lat]);
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [markers, mapLoaded]);

  if (error) {
    return (
      <div className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Map Error</div>
          <div className="text-gray-600">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600">Loading map...</div>
          </div>
        </div>
      )}
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
