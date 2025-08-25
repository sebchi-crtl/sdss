"use client";
import { useQuery } from "@tanstack/react-query";
import Timeseries from "@/components/charts/Timeseries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/components/RequireAuth";

async function fetchSeries() {
  const res = await fetch("/api/readings?range=24h");
  return res.json();
}

export default function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["series"], queryFn: fetchSeries });
  return (
    <RequireAuth>
      <Card>
        <CardHeader><CardTitle>24h Rainfall (demo)</CardTitle></CardHeader>
        <CardContent>
          <Timeseries data={(data?.series ?? [])} />
        </CardContent>
      </Card>
    </RequireAuth>
  );
}
