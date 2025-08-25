"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Marker = { id: string; lon: number; lat: number; status?: string };

export default function MapView({ markers = [] as Marker[] }) {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE || "https://demotiles.maplibre.org/style.json",
      center: [7.317, 9.0],
      zoom: 9
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      // Add local areas overlay (public/data/areas.geojson)
      fetch("/data/areas.geojson")
        .then((r) => r.json())
        .then((geojson) => {
          map.addSource("areas", { type: "geojson", data: geojson });
          map.addLayer({
            id: "areas-fill",
            type: "fill",
            source: "areas",
            paint: { "fill-color": "#22c55e", "fill-opacity": 0.15 }
          });
          map.addLayer({
            id: "areas-outline",
            type: "line",
            source: "areas",
            paint: { "line-color": "#166534", "line-width": 1.5 }
          });
        })
        .catch(() => {});
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    (map as any).__markers?.forEach((m: maplibregl.Marker) => m.remove());
    (map as any).__markers = [];
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.className =
        "h-3 w-3 rounded-full " +
        (m.status === "CRIT" ? "bg-red-600" : m.status === "WARN" ? "bg-yellow-500" : "bg-green-600");
      const marker = new maplibregl.Marker({ element: el }).setLngLat([m.lon, m.lat]).addTo(map);
      (map as any).__markers.push(marker);
    });
  }, [markers]);

  return <div ref={containerRef} className="h-[70vh] w-full rounded-2xl ring-1 ring-gray-200" />;
}
