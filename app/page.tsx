import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Stat from "@/components/Stat";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";

export default async function Page() {
  return (
    <RequireAuth>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Active Sensors" value="—" />
        <Stat label="Open Alerts" value="—" />
        <Stat label="24h Readings" value="—" />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Flood Risk (Next 24–72h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">Connect the ML endpoint at <code>/api/predictions</code> to populate this chart.</div>
            <div className="mt-2 h-48 rounded-xl bg-gradient-to-br from-blue-50 to-green-50 ring-1 ring-gray-200" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Live Feed</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">Use Supabase Realtime or MQTT worker to push updates to clients.</div>
            <div className="mt-2 space-y-2 text-sm">
              <div>• Sensor X: 12.4mm rain</div>
              <div>• River gauge Y: +8cm</div>
              <div>• Report: Road flooded at Northbank</div>
            </div>
            <div className="mt-4 text-right text-sm">
              <Link className="text-brand-700 underline" href="/map">View Map →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
