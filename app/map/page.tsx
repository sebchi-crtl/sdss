"use client";
import MapView from "@/components/map/MapView";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/components/RequireAuth";
import { subscribeToReadings } from "@/lib/realtime";

export default function MapPage() {
  const [markers, setMarkers] = useState<{ id: string; lon: number; lat: number; status?: string }[]>([]);

  useEffect(() => {
    // Seed
    setMarkers([
      { id: "s1", lon: 7.317, lat: 9.0, status: "OK" },
      { id: "s2", lon: 7.43, lat: 8.98, status: "WARN" }
    ]);
    const unsub = subscribeToReadings((row) => {
      if (row.lon && row.lat) {
        setMarkers((prev) => [{ id: row.sensor_id, lon: row.lon, lat: row.lat, status: row.status || "OK" }, ...prev]);
      }
    });
    return unsub;
  }, []);

  return (
    <RequireAuth>
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Operational Map</CardTitle></CardHeader>
          <CardContent>
            <MapView markers={markers} />
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
