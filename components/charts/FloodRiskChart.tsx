"use client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

interface FloodRiskData {
  horizon: number[];
  risk: number[];
  confidence: number[];
  factors: {
    rainfall_24h: number;
    river_level: number;
    soil_moisture: number;
    temperature: number;
    forecast_rainfall: number[];
    model_used?: string;
    state_risk?: string;
  };
  recommendations: string[];
  state_code?: string;
  region?: string;
}

async function fetchFloodRisk(): Promise<FloodRiskData> {
  const res = await fetch("/api/predictions");
  if (!res.ok) {
    throw new Error("Failed to fetch flood risk data");
  }
  return res.json();
}

function getRiskLevel(risk: number): { level: string; color: string; icon: React.ReactNode } {
  if (risk >= 0.8) {
    return { 
      level: "EMERGENCY", 
      color: "text-red-600", 
      icon: <AlertTriangle className="h-4 w-4" />
    };
  } else if (risk >= 0.6) {
    return { 
      level: "WARNING", 
      color: "text-orange-600", 
      icon: <AlertCircle className="h-4 w-4" />
    };
  } else if (risk >= 0.4) {
    return { 
      level: "WATCH", 
      color: "text-yellow-600", 
      icon: <AlertCircle className="h-4 w-4" />
    };
  } else {
    return { 
      level: "INFO", 
      color: "text-green-600", 
      icon: <Info className="h-4 w-4" />
    };
  }
}

export default function FloodRiskChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["flood-risk"],
    queryFn: fetchFloodRisk,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flood Risk (Next 24–72h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading flood risk data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flood Risk (Next 24–72h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center space-y-2">
            <div className="text-sm text-red-500">Failed to load flood risk data</div>
            <div className="text-xs text-gray-500">
              Make sure the Python FastAPI service is running on port 8200
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const chartData = data.horizon.map((hours, index) => ({
    hours,
    risk: data.risk[index] * 100, // Convert to percentage
    confidence: data.confidence[index] * 100,
    label: `${hours}h`
  }));

  const maxRisk = Math.max(...data.risk);
  const riskInfo = getRiskLevel(maxRisk);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Flood Risk (Next 24–72h)
          {data.state_code && (
            <span className="text-sm text-gray-500">
              - {data.state_code} {data.region && `(${data.region})`}
            </span>
          )}
          <span className={`flex items-center gap-1 text-sm ${riskInfo.color}`}>
            {riskInfo.icon}
            {riskInfo.level}
          </span>
        </CardTitle>
        {data.factors.model_used && (
          <div className="text-xs text-gray-500">
            Model: {data.factors.model_used}
            {data.factors.state_risk && ` | State Risk: ${data.factors.state_risk}`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Risk Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`, 
                    name === "risk" ? "Risk Level" : "Confidence"
                  ]}
                  labelFormatter={(label) => `Time Horizon: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Current Conditions */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Current Conditions</div>
              <div className="space-y-1 mt-1">
                <div>Rainfall (24h): {data.factors.rainfall_24h}mm</div>
                <div>River Level: {data.factors.river_level}m</div>
                <div>Temperature: {data.factors.temperature}°C</div>
                <div>Soil Moisture: {(data.factors.soil_moisture * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Forecast Rainfall</div>
              <div className="space-y-1 mt-1">
                {data.factors.forecast_rainfall.map((rain, index) => (
                  <div key={index}>
                    {data.horizon[index]}h: {rain}mm
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div>
              <div className="font-medium text-gray-700 mb-2">Recommendations</div>
              <div className="space-y-1">
                {data.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
