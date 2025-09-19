import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const weatherIngestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  type: z.enum(["current", "historical"]).default("current")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = weatherIngestSchema.safeParse(body);
    
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { latitude, longitude, start_date, end_date, type } = parse.data;

    // Import the weather service
    const { weather_ingestion } = await import("@/lib/weather_service");

    let result;
    
    if (type === "current") {
      result = await weather_ingestion.ingest_current_weather(latitude, longitude);
    } else {
      if (!start_date || !end_date) {
        return NextResponse.json(
          { error: "start_date and end_date are required for historical data" },
          { status: 400 }
        );
      }
      result = await weather_ingestion.ingest_historical_weather(
        latitude, longitude, start_date, end_date
      );
    }

    return NextResponse.json({
      success: true,
      message: `Weather data ingested successfully for ${latitude}, ${longitude}`,
      data: result
    });

  } catch (error) {
    console.error("Weather ingestion error:", error);
    let details = "Unknown error";
    if (error instanceof Error) {
      details = error.message;
    } else if (typeof error === "string") {
      details = error;
    }
    return NextResponse.json(
      { error: "Failed to ingest weather data", details },
      { status: 500 }
    );
  }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const days_back = parseInt(searchParams.get("days_back") || "30");

    if (latitude === 0 && longitude === 0) {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Import the weather service
    const { weather_ingestion } = await import("@/lib/weather_service");

    const training_data = await weather_ingestion.get_weather_data_for_training(
      latitude, longitude, days_back
    );

    return NextResponse.json({
      success: true,
      data: training_data,
      count: training_data.length
    });

  } catch (error) {
    console.error("Weather data retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve weather data", details: error.message },
      { status: 500 }
    );
  }
}
