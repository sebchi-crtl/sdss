"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import RequireAuth from "@/components/RequireAuth";
import { Droplets, Thermometer, Wind, Eye, MapPin, Trash2, Plus } from "lucide-react";

type Sensor = { 
  id: string; 
  name: string; 
  type: string; 
  lat: number; 
  lon: number; 
  elevation?: number;
  installed_at?: string;
};

const SENSOR_TYPES = [
  { value: "RAIN", label: "Rain Gauge", icon: Droplets, color: "bg-blue-100 text-blue-800" },
  { value: "RIVER", label: "River Gauge", icon: Droplets, color: "bg-cyan-100 text-cyan-800" },
  { value: "WATER_LEVEL", label: "Water Level", icon: Droplets, color: "bg-indigo-100 text-indigo-800" },
  { value: "TEMP", label: "Temperature", icon: Thermometer, color: "bg-orange-100 text-orange-800" },
  { value: "WIND", label: "Wind Sensor", icon: Wind, color: "bg-gray-100 text-gray-800" },
  { value: "HUMIDITY", label: "Humidity", icon: Eye, color: "bg-green-100 text-green-800" }
];

export default function SensorsPage() {
  const [list, setList] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    type: "RAIN", 
    lat: "", 
    lon: "", 
    elevation: "" 
  });
  const [error, setError] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/sensors");
      const j = await r.json();
      setList(j.items ?? []);
    } catch (err) {
      setError("Failed to load sensors");
    }
  }
  
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name || !form.lat || !form.lon) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const r = await fetch("/api/sensors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          lat: Number(form.lat), 
          lon: Number(form.lon),
          elevation: form.elevation ? Number(form.elevation) : null
        })
      });
      
      if (!r.ok) {
        const errorText = await r.text();
        setError(errorText);
        return;
      }
      
      setForm({ name: "", type: "RAIN", lat: "", lon: "", elevation: "" });
      await load();
    } catch (err) {
      setError("Failed to create sensor");
    } finally { 
      setLoading(false); 
    }
  }

  async function del(id: string) {
    if (!confirm("Are you sure you want to delete this sensor? This action cannot be undone.")) return;
    
    try {
      const r = await fetch(`/api/sensors/${id}`, { method: "DELETE" });
      if (!r.ok) {
        setError("Failed to delete sensor");
        return;
      }
      await load();
    } catch (err) {
      setError("Failed to delete sensor");
    }
  }

  function getSensorTypeInfo(type: string) {
    return SENSOR_TYPES.find(t => t.value === type) || SENSOR_TYPES[0];
  }

  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sensor Management</h1>
          <Badge variant="outline">{list.length} sensors</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Add Sensor Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Sensor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <Label htmlFor="name">Sensor Name *</Label>
                <Input 
                  id="name"
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Rain Gauge North"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Sensor Type *</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SENSOR_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat">Latitude *</Label>
                  <Input 
                    id="lat"
                    type="number"
                    step="any"
                    value={form.lat} 
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    placeholder="9.0"
                  />
                </div>
                <div>
                  <Label htmlFor="lon">Longitude *</Label>
                  <Input 
                    id="lon"
                    type="number"
                    step="any"
                    value={form.lon} 
                    onChange={(e) => setForm({ ...form, lon: e.target.value })}
                    placeholder="7.3"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="elevation">Elevation (meters)</Label>
                <Input 
                  id="elevation"
                  type="number"
                  value={form.elevation} 
                  onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                  placeholder="100"
                />
              </div>
              
              <Button 
                onClick={create} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Sensor"}
              </Button>
            </CardContent>
          </Card>

          {/* Sensors List */}
          <Card>
            <CardHeader>
              <CardTitle>All Sensors</CardTitle>
            </CardHeader>
            <CardContent>
              {list.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No sensors configured yet</p>
                  <p className="text-sm">Add your first sensor to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.map((sensor) => {
                    const typeInfo = getSensorTypeInfo(sensor.type);
                    const Icon = typeInfo.icon;
                    
                    return (
                      <div key={sensor.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{sensor.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {sensor.lat.toFixed(3)}, {sensor.lon.toFixed(3)}
                              </span>
                              {sensor.elevation && (
                                <span className="text-xs text-gray-500">
                                  {sensor.elevation}m elevation
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => del(sensor.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
