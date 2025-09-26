import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");
    const state_code = searchParams.get("state_code");
    const days = parseInt(searchParams.get("days") || "7");

    // Proxy to Python FastAPI service
    const modelUrl = process.env.MODEL_URL || "http://localhost:8200";
    
    let url: string;
    
    switch (endpoint) {
      case "states":
        url = `${modelUrl}/nigeria/states`;
        break;
      case "regions":
        url = `${modelUrl}/nigeria/regions`;
        break;
      case "weather":
        if (!state_code) {
          return NextResponse.json(
            { error: "state_code is required for weather endpoint" },
            { status: 400 }
          );
        }
        url = `${modelUrl}/nigeria/states/${state_code}/weather`;
        break;
      case "forecast":
        if (!state_code) {
          return NextResponse.json(
            { error: "state_code is required for forecast endpoint" },
            { status: 400 }
          );
        }
        url = `${modelUrl}/nigeria/states/${state_code}/forecast?days=${days}`;
        break;
      case "coordinates":
        // Handle coordinates locally instead of proxying to Python service
        const coordinatesResponse = await fetch(`${req.nextUrl.origin}/api/nigeria/coordinates?${searchParams.toString()}`);
        const coordinatesData = await coordinatesResponse.json();
        return NextResponse.json(coordinatesData);
      case "risk-calculation":
        // Handle risk calculation locally
        const riskResponse = await fetch(`${req.nextUrl.origin}/api/nigeria/risk-calculation?${searchParams.toString()}`);
        const riskData = await riskResponse.json();
        return NextResponse.json(riskData);
      default:
        return NextResponse.json(
          { error: "Invalid endpoint. Use: states, regions, weather, forecast, coordinates, or risk-calculation" },
          { status: 400 }
        );
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || "Failed to fetch Nigeria data");
    }
    
    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Nigeria API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Nigeria data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
