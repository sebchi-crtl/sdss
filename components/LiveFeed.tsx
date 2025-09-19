"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, Thermometer, Wind, Eye } from "lucide-react";
import { subscribeToReadings } from "@/lib/realtime";
import { useEffect, useState } from "react";

interface LiveReading {
  id: number;
  sensor_id: string;
  ts: string;
  value: number;
  status?: "OK" | "WARN" | "CRIT" | null;
  sensors?: {
    name: string;
    type: string;
  };
}

interface RecentAlert {
  id: number;
  type: string;
  level: string;
  message: string;
  created_at: string;
}

interface DashboardStats {
  activeSensors: number;
  openAlerts: number;
  readings24h: number;
  recentAlerts: RecentAlert[];
  lastUpdated: string;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return res.json();
}

function getStatusIcon(type: string) {
  switch (type) {
    case "RAIN":
      return <Droplets className="h-4 w-4" />;
    case "RIVER":
      return <Droplets className="h-4 w-4" />;
    case "WATER_LEVEL":
      return <Droplets className="h-4 w-4" />;
    case "TEMP":
      return <Thermometer className="h-4 w-4" />;
    case "WIND":
      return <Wind className="h-4 w-4" />;
    case "HUMIDITY":
      return <Eye className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case "CRIT":
      return "bg-red-100 text-red-800 border-red-200";
    case "WARN":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-green-100 text-green-800 border-green-200";
  }
}

function getAlertLevelColor(level: string) {
  switch (level) {
    case "EMERGENCY":
      return "bg-red-100 text-red-800 border-red-200";
    case "WARNING":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "WATCH":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export default function LiveFeed() {
  const [liveReadings, setLiveReadings] = useState<LiveReading[]>([]);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  useEffect(() => {
    const unsubscribe = subscribeToReadings((reading) => {
      setLiveReadings(prev => {
        const newReading = {
          ...reading,
          sensors: { name: `Sensor ${reading.sensor_id.slice(-4)}`, type: "UNKNOWN" }
        };
        return [newReading, ...prev.slice(0, 9)]; // Keep last 10 readings
      });
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Live Feed</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading live data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Feed</CardTitle>
        <div className="text-xs text-gray-500">
          Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : "Never"}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recent Alerts */}
          {stats?.recentAlerts && stats.recentAlerts.length > 0 && (
            <div>
              <div className="font-medium text-sm text-gray-700 mb-2">Recent Alerts</div>
              <div className="space-y-2">
                {stats.recentAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                    <Badge className={`text-xs ${getAlertLevelColor(alert.level)}`}>
                      {alert.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{alert.type}</div>
                      <div className="text-xs text-gray-600 truncate">{alert.message}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Sensor Readings */}
          <div>
            <div className="font-medium text-sm text-gray-700 mb-2">Live Sensor Data</div>
            <div className="space-y-2">
              {liveReadings.length > 0 ? (
                liveReadings.slice(0, 5).map((reading) => (
                  <div key={reading.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="text-gray-600">
                      {getStatusIcon(reading.sensors?.type || "UNKNOWN")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {reading.sensors?.name || `Sensor ${reading.sensor_id.slice(-4)}`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {reading.value} {reading.sensors?.type === "TEMP" ? "°C" : 
                         reading.sensors?.type === "HUMIDITY" ? "%" : 
                         reading.sensors?.type === "RAIN" ? "mm" : 
                         reading.sensors?.type === "RIVER" || reading.sensors?.type === "WATER_LEVEL" ? "m" : ""}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(reading.status)}`}>
                      {reading.status || "OK"}
                    </Badge>
                    <div className="text-xs text-gray-400">
                      {new Date(reading.ts).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No live readings available. Start the MQTT simulator to see live data.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-600">
                {stats?.activeSensors || 0} sensors • {stats?.readings24h || 0} readings (24h)
              </div>
              <a 
                href="/map" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Map →
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
