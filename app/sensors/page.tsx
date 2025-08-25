"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequireAuth from "@/components/RequireAuth";

type Sensor = { id: string; name: string; type: string; lat: number; lon: number };

export default function SensorsPage() {
  const [list, setList] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "RAIN", lat: "", lon: "" });

  async function load() {
    const r = await fetch("/api/sensors");
    const j = await r.json();
    setList(j.items ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setLoading(true);
    try {
      const r = await fetch("/api/sensors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, lat: Number(form.lat), lon: Number(form.lon) })
      });
      if (!r.ok) alert(await r.text());
      else { setForm({ name: "", type: "RAIN", lat: "", lon: "" }); await load(); }
    } finally { setLoading(false); }
  }

  async function del(id: string) {
    if (!confirm("Delete sensor?")) return;
    await fetch(`/api/sensors/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <RequireAuth>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add Sensor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="RAIN | RIVER | WATER_LEVEL ..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Lat</Label><Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></div>
              <div><Label>Lon</Label><Input value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} /></div>
            </div>
            <Button onClick={create} disabled={loading}>Create</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>All Sensors</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {list.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-600">{s.type} • {s.lat}, {s.lon}</div>
                  </div>
                  <Button variant="outline" onClick={() => del(s.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
