import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

const coordinateUpdateSchema = z.object({
  state_code: z.string().min(2).max(3),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
  region: z.string().optional(),
  capital: z.string().optional(),
  population: z.number().optional(),
  area_km2: z.number().optional(),
  flood_risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  major_rivers: z.array(z.string()).optional(),
  climate_zone: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = coordinateUpdateSchema.safeParse(body);
    
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { state_code, latitude, longitude, ...optionalData } = parse.data;
    const sb = supabaseAdmin();

    // Check if state exists
    const { data: existingState, error: selectError } = await sb
      .from('nigeria_states')
      .select('*')
      .eq('code', state_code)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw selectError;
    }

    const updateData = {
      code: state_code,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
      ...optionalData
    };

    let result;
    if (existingState) {
      // Update existing state
      const { data, error } = await sb
        .from('nigeria_states')
        .update(updateData)
        .eq('code', state_code)
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'updated' };
    } else {
      // Insert new state
      const { data, error } = await sb
        .from('nigeria_states')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'created' };
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `State ${state_code} coordinates ${result.action} successfully`
    });

  } catch (error) {
    console.error("Coordinate update error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update coordinates", 
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
    const sb = supabaseAdmin();

    let query = sb.from('nigeria_states').select('*');
    
    if (state_code) {
      query = query.eq('code', state_code);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: state_code ? data[0] || null : data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error("Coordinate retrieval error:", error);
    return NextResponse.json(
      { 
        error: "Failed to retrieve coordinates", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state_code = searchParams.get("state_code");
    
    if (!state_code) {
      return NextResponse.json(
        { error: "state_code is required for deletion" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    // Check if state exists
    const { data: existingState, error: selectError } = await sb
      .from('nigeria_states')
      .select('*')
      .eq('code', state_code)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (!existingState) {
      return NextResponse.json(
        { error: `State with code ${state_code} not found` },
        { status: 404 }
      );
    }

    // Delete the state
    const { error: deleteError } = await sb
      .from('nigeria_states')
      .delete()
      .eq('code', state_code);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: `State ${state_code} deleted successfully`,
      data: { code: state_code, name: existingState.name }
    });

  } catch (error) {
    console.error("State deletion error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete state", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
