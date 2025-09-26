"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Stat from "@/components/Stat";
import FloodRiskChart from "@/components/charts/FloodRiskChart";
import LiveFeed from "@/components/LiveFeed";
import WeatherModal from "@/components/WeatherModal";
import RequireAuth from "@/components/RequireAuth";
import { Cloud, MapPin } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  activeSensors: number;
  openAlerts: number;
  readings24h: number;
  lastUpdated: string;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return res.json();
}

export default function Page() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const [weatherModalOpen, setWeatherModalOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="space-y-4">
        {/* Header with Weather Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nigeria Flood Prediction Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/nigeria-states">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Nigeria States
              </Button>
            </Link>
            <Button 
              onClick={() => setWeatherModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Cloud className="h-4 w-4" />
              Weather & Training
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat 
          label="Active Sensors" 
          value={isLoading ? "—" : (stats?.activeSensors || 0).toString()} 
        />
        <Stat 
          label="Open Alerts" 
          value={isLoading ? "—" : (stats?.openAlerts || 0).toString()} 
        />
        <Stat 
          label="24h Readings" 
          value={isLoading ? "—" : (stats?.readings24h || 0).toString()} 
        />

        <div className="md:col-span-2">
          <FloodRiskChart />
        </div>

        <LiveFeed />
        </div>

        {/* Weather Modal */}
        <WeatherModal
          isOpen={weatherModalOpen}
          onClose={() => setWeatherModalOpen(false)}
        />
      </div>
    </RequireAuth>
  );
}
