"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/components/RequireAuth";

async function fetchAlerts() {
  const r = await fetch("/api/alerts");
  return r.json();
}

export default function AlertsPage() {
  const { data } = useQuery({ queryKey: ["alerts"], queryFn: fetchAlerts });
  return (
    <RequireAuth>
      <Card>
        <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.items ?? []).map((a: any) => (
              <div key={a.id} className="rounded-xl border border-gray-200 p-3">
                <div className="text-sm">{a.type} — <span className="font-semibold">{a.level}</span></div>
                <div className="text-sm text-gray-700">{a.message}</div>
                <div className="text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </RequireAuth>
  );
}
