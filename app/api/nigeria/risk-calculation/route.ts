import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface RiskCalculationRequest {
  state_code?: string;
  force_update?: boolean;
  use_ml_prediction?: boolean;
}

interface WeatherConditions {
  rainfall_24h: number;
  rainfall_7d: number;
  river_level: number;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
}

interface RiskCalculationResult {
  state_code: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  confidence: number;
  factors: {
    weather_risk: number;
    historical_risk: number;
    geographic_risk: number;
    ml_prediction_risk?: number;
  };
  recommendations: string[];
  last_updated: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RiskCalculationRequest = await req.json();
    const { state_code, force_update = false, use_ml_prediction = true } = body;
    
    const sb = supabaseAdmin();

    // Get states to calculate risk for
    let statesToProcess = [];
    if (state_code) {
      const { data: state } = await sb
        .from('nigeria_states')
        .select('*')
        .eq('code', state_code)
        .single();
      if (state) statesToProcess = [state];
    } else {
      const { data: allStates } = await sb
        .from('nigeria_states')
        .select('*');
      statesToProcess = allStates || [];
    }

    if (statesToProcess.length === 0) {
      return NextResponse.json({
        error: "No states found to calculate risk for"
      }, { status: 404 });
    }

    const results: RiskCalculationResult[] = [];

    for (const state of statesToProcess) {
      try {
        // Get current weather conditions for this state
        const weatherConditions = await getCurrentWeatherConditions(state.code, sb);
        
        // Calculate risk using multiple methods
        const riskResult = await calculateStateRiskLevel(
          state, 
          weatherConditions, 
          use_ml_prediction,
          sb
        );

        // Update the state in database if risk level changed or force update
        const currentRiskLevel = state.flood_risk_level;
        if (force_update || riskResult.risk_level !== currentRiskLevel) {
          await sb
            .from('nigeria_states')
            .update({
              flood_risk_level: riskResult.risk_level,
              updated_at: new Date().toISOString()
            })
            .eq('code', state.code);
        }

        results.push({
          ...riskResult,
          state_code: state.code
        });

      } catch (error) {
        console.error(`Error calculating risk for state ${state.code}:`, error);
        // Continue with other states
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Risk calculation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to calculate risk levels", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state_code = searchParams.get("state_code");
    const include_ml = searchParams.get("include_ml") === "true";
    
    const sb = supabaseAdmin();

    // Get state data
    let query = sb.from('nigeria_states').select('*');
    if (state_code) {
      query = query.eq('code', state_code);
    }

    const { data: states, error } = await query;
    if (error) throw error;

    if (!states || states.length === 0) {
      return NextResponse.json({
        error: "No states found"
      }, { status: 404 });
    }

    const results = [];
    for (const state of states) {
      const weatherConditions = await getCurrentWeatherConditions(state.code, sb);
      const riskResult = await calculateStateRiskLevel(
        state, 
        weatherConditions, 
        include_ml,
        sb
      );

      results.push({
        state_code: state.code,
        state_name: state.name,
        current_risk_level: state.flood_risk_level,
        calculated_risk_level: riskResult.risk_level,
        risk_score: riskResult.risk_score,
        confidence: riskResult.confidence,
        factors: riskResult.factors,
        recommendations: riskResult.recommendations,
        last_updated: state.updated_at
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error("Risk retrieval error:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve risk calculations", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

async function getCurrentWeatherConditions(stateCode: string, sb: any): Promise<WeatherConditions> {
  // Get recent sensor readings for this state's coordinates
  const { data: state } = await sb
    .from('nigeria_states')
    .select('latitude, longitude')
    .eq('code', stateCode)
    .single();

  if (!state) {
    throw new Error(`State ${stateCode} not found`);
  }

  // Get sensors near this state (within 50km radius)
  const { data: nearbySensors } = await sb
    .from('sensors')
    .select('id, type, lat, lon')
    .gte('lat', state.latitude - 0.5) // ~50km radius
    .lte('lat', state.latitude + 0.5)
    .gte('lon', state.longitude - 0.5)
    .lte('lon', state.longitude + 0.5);

  const sensorIds = nearbySensors?.map(s => s.id) || [];

  // Get recent readings from these sensors
  const { data: recentReadings } = await sb
    .from('sensor_readings')
    .select('sensor_id, value, ts, sensors!inner(type)')
    .in('sensor_id', sensorIds)
    .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('ts', { ascending: false });

  // Aggregate sensor data
  const sensorData: { [key: string]: number[] } = {};
  if (recentReadings) {
    recentReadings.forEach((reading: any) => {
      const type = reading.sensors.type;
      if (!sensorData[type]) sensorData[type] = [];
      sensorData[type].push(reading.value);
    });
  }

  // Build weather conditions
  const conditions: WeatherConditions = {
    rainfall_24h: sensorData.RAIN ? Math.max(...sensorData.RAIN) : 0,
    rainfall_7d: sensorData.RAIN ? sensorData.RAIN.reduce((a, b) => a + b, 0) : 0,
    river_level: sensorData.RIVER ? Math.max(...sensorData.RIVER) : 2.0,
    soil_moisture: sensorData.SOIL_MOISTURE ? 
      sensorData.SOIL_MOISTURE[sensorData.SOIL_MOISTURE.length - 1] : 0.5,
    temperature: sensorData.TEMP ? 
      sensorData.TEMP[sensorData.TEMP.length - 1] : 25,
    humidity: sensorData.HUMIDITY ? 
      sensorData.HUMIDITY[sensorData.HUMIDITY.length - 1] : 65,
    pressure: sensorData.PRESSURE ? 
      sensorData.PRESSURE[sensorData.PRESSURE.length - 1] : 1013,
    wind_speed: sensorData.WIND ? 
      sensorData.WIND[sensorData.WIND.length - 1] : 3,
    wind_direction: 180 // Default
  };

  return conditions;
}

async function calculateStateRiskLevel(
  state: any, 
  conditions: WeatherConditions, 
  useMLPrediction: boolean,
  sb: any
): Promise<Omit<RiskCalculationResult, 'state_code'>> {
  
  // 1. Weather-based risk calculation
  const weatherRisk = calculateWeatherRisk(conditions);
  
  // 2. Historical/Geographic risk (based on state characteristics)
  const historicalRisk = calculateHistoricalRisk(state);
  
  // 3. ML Prediction risk (if available)
  let mlPredictionRisk = 0;
  let mlConfidence = 0;
  
  if (useMLPrediction) {
    try {
      const mlResult = await getMLPrediction(state.code, conditions);
      mlPredictionRisk = mlResult.risk_score;
      mlConfidence = mlResult.confidence;
    } catch (error) {
      console.warn(`ML prediction failed for ${state.code}:`, error);
    }
  }

  // 4. Combined risk calculation
  let finalRiskScore: number;
  let confidence: number;

  if (useMLPrediction && mlPredictionRisk > 0) {
    // Use ML prediction as primary, with weather and historical as factors
    finalRiskScore = (
      0.6 * mlPredictionRisk +
      0.25 * weatherRisk +
      0.15 * historicalRisk
    );
    confidence = mlConfidence;
  } else {
    // Fallback to weather + historical calculation
    finalRiskScore = (
      0.7 * weatherRisk +
      0.3 * historicalRisk
    );
    confidence = 0.6; // Lower confidence without ML
  }

  // 5. Convert risk score to risk level
  const riskLevel = scoreToRiskLevel(finalRiskScore);
  
  // 6. Generate recommendations
  const recommendations = generateRecommendations(finalRiskScore, conditions, state);

  return {
    risk_level: riskLevel,
    risk_score: Math.round(finalRiskScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    factors: {
      weather_risk: Math.round(weatherRisk * 100) / 100,
      historical_risk: Math.round(historicalRisk * 100) / 100,
      geographic_risk: historicalRisk,
      ml_prediction_risk: useMLPrediction ? Math.round(mlPredictionRisk * 100) / 100 : undefined
    },
    recommendations,
    last_updated: new Date().toISOString()
  };
}

function calculateWeatherRisk(conditions: WeatherConditions): number {
  // Weighted calculation based on weather factors
  const rainfallRisk = Math.min(1.0, conditions.rainfall_24h / 50); // 50mm = max risk
  const riverRisk = Math.min(1.0, Math.max(0, conditions.river_level - 2) / 3); // 2m base, 5m max
  const soilRisk = conditions.soil_moisture; // 0-1 scale
  const temperatureRisk = Math.max(0, (conditions.temperature - 25) / 15); // 25°C base, 40°C max
  
  return (
    0.4 * rainfallRisk +
    0.3 * riverRisk +
    0.2 * soilRisk +
    0.1 * Math.min(1.0, temperatureRisk)
  );
}

function calculateHistoricalRisk(state: any): number {
  // Base risk on state's historical flood risk level
  const riskFactors = {
    'low': 0.1,
    'medium': 0.3,
    'high': 0.6,
    'critical': 0.8
  };
  
  return riskFactors[state.flood_risk_level as keyof typeof riskFactors] || 0.3;
}

async function getMLPrediction(stateCode: string, conditions: WeatherConditions): Promise<{risk_score: number, confidence: number}> {
  try {
    const modelUrl = process.env.MODEL_URL || "http://localhost:8200";
    
    const response = await fetch(`${modelUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        horizon_hours: [24], // 24-hour prediction
        current_conditions: conditions,
        state_code: stateCode
      })
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }

    const prediction = await response.json();
    
    return {
      risk_score: prediction.risk?.[0] || 0,
      confidence: prediction.confidence?.[0] || 0
    };
  } catch (error) {
    console.error("ML prediction error:", error);
    throw error;
  }
}

function scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.8) return 'critical';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

function generateRecommendations(riskScore: number, conditions: WeatherConditions, state: any): string[] {
  const recommendations: string[] = [];
  
  if (riskScore >= 0.8) {
    recommendations.push("🚨 CRITICAL: Evacuate low-lying areas immediately");
    recommendations.push("Activate emergency response protocols");
    recommendations.push("Issue public warnings and alerts");
  } else if (riskScore >= 0.6) {
    recommendations.push("⚠️ HIGH RISK: Prepare for potential flooding");
    recommendations.push("Monitor river levels and weather conditions");
    recommendations.push("Prepare emergency supplies and evacuation routes");
  } else if (riskScore >= 0.4) {
    recommendations.push("👀 MEDIUM RISK: Monitor conditions closely");
    recommendations.push("Check drainage systems and flood barriers");
    recommendations.push("Stay informed about weather updates");
  } else {
    recommendations.push("✅ LOW RISK: Normal conditions");
    recommendations.push("Continue routine monitoring");
  }

  // Add specific recommendations based on conditions
  if (conditions.rainfall_24h > 30) {
    recommendations.push("Heavy rainfall detected - monitor drainage systems");
  }
  
  if (conditions.river_level > 4) {
    recommendations.push("High river levels - check flood barriers");
  }
  
  if (conditions.soil_moisture > 0.8) {
    recommendations.push("High soil moisture - increased runoff risk");
  }

  return recommendations;
}
