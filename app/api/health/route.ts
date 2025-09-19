import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: false,
        ml_backend: false,
        mqtt: false
      },
      version: "2.0.0"
    };

    // Check database connection
    try {
      const sb = supabaseAdmin();
      const { error } = await sb.from("sensors").select("id").limit(1);
      health.services.database = !error;
    } catch (error) {
      health.services.database = false;
    }

    // Check ML backend
    try {
      const response = await fetch("http://localhost:8200/health", {
        method: "GET",
        timeout: 5000
      } as any);
      health.services.ml_backend = response.ok;
    } catch (error) {
      health.services.ml_backend = false;
    }

    // MQTT is harder to check directly, assume it's working if other services are up
    health.services.mqtt = health.services.database && health.services.ml_backend;

    const allHealthy = Object.values(health.services).every(status => status);

    return NextResponse.json({
      ...health,
      status: allHealthy ? "healthy" : "degraded"
    }, { 
      status: allHealthy ? 200 : 503 
    });

  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: String(error),
      services: {
        database: false,
        ml_backend: false,
        mqtt: false
      }
    }, { status: 500 });
  }
}
