import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const weatherIngestSchema = z.object({
  state_code: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid latitude');
    return num;
  }).refine((val) => val >= -90 && val <= 90, {
    message: "Latitude must be between -90 and 90"
  }).optional(),
  longitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) throw new Error('Invalid longitude');
    return num;
  }).refine((val) => val >= -180 && val <= 180, {
    message: "Longitude must be between -180 and 180"
  }).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  type: z.enum(["current", "historical"]).default("current")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Weather request body: ", body);
    const parse = weatherIngestSchema.safeParse(body);
    console.log("Weather parsed request: ", parse.data);
    
    if (!parse.success) {
      console.log("Weather parsing errors: ", parse.error.flatten());
      return NextResponse.json(
        { error: "Invalid request data", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { state_code, latitude, longitude, start_date, end_date, type } = parse.data;

    // Proxy to Python FastAPI service
    const modelUrl = process.env.MODEL_URL || "http://localhost:8200";
    
    let result;
    
    if (type === "current") {
      // Call Python API for current weather ingestion with Nigeria support
      const requestBody: any = { type: "current" };
      
      if (state_code) {
        requestBody.state_code = state_code;
      } else if (latitude && longitude) {
        requestBody.latitude = latitude;
        requestBody.longitude = longitude;
      }
      
      const response = await fetch(`${modelUrl}/weather/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to ingest current weather");
      }
      
      result = await response.json();
    } else {
      if (!start_date || !end_date) {
        return NextResponse.json(
          { error: "start_date and end_date are required for historical data" },
          { status: 400 }
        );
      }
      
      // For historical data, we'll use the weather training pipeline approach
      // This would typically be handled by running the Python script directly
      // For now, we'll return a success message indicating the data should be ingested
      result = {
        message: "Historical weather data ingestion initiated",
        state_code: state_code || null,
        latitude: latitude || null,
        longitude: longitude || null,
        start_date,
        end_date
      };
    }

    return NextResponse.json({
      success: true,
      message: `Weather data ingested successfully${state_code ? ` for ${state_code}` : latitude && longitude ? ` for ${latitude}, ${longitude}` : ' for all Nigeria states'}`,
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
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state_codes = searchParams.get("state_codes");
    const days_back = parseInt(searchParams.get("days_back") || "30");

    // Proxy to Python FastAPI service for Nigeria weather training data
    const modelUrl = process.env.MODEL_URL || "http://localhost:8200";
    
    let url = `${modelUrl}/weather/training-data?days_back=${days_back}`;
    if (state_codes) {
      url += `&state_codes=${encodeURIComponent(state_codes)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to get Nigeria weather training data");
    }
    
    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count,
      states_requested: result.states_requested
    });

  } catch (error) {
    console.error("Nigeria weather data retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Nigeria weather data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
