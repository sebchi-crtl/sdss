"use client";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function subscribeToReadings(onRow: (row: any) => void) {
  const sb = supabaseBrowser();
  const channel = sb
    .channel("realtime:readings")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "sensor_readings" },
      (payload) => onRow(payload.new)
    )
    .subscribe();
  return () => { sb.removeChannel(channel); };
}
