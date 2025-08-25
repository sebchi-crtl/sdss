import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/components/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Alerting Rules</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              <li>Define thresholds per sensor type (e.g., rainfall &gt; 50mm/24h → WARNING).</li>
              <li>Geofence river gauges to communities; escalate when multiple exceedances.</li>
              <li>Configure schedule to run <code>/api/cron/evaluate</code>.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Model Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              Point <code>/api/predictions</code> to your hydrological model service (FastAPI/Flask).
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
