"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Stat from "@/components/Stat";
import FloodRiskChart from "@/components/charts/FloodRiskChart";
import LiveFeed from "@/components/LiveFeed";
import RequireAuth from "@/components/RequireAuth";

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

  return (
    <RequireAuth>
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
    </RequireAuth>
  );
}
