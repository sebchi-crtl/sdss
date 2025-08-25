import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.MODEL_URL;
  if (!url) return NextResponse.json({ error: "MODEL_URL not configured" }, { status: 500 });

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ horizon_hours: [24, 48, 72] })
    });
    const j = await r.json();
    return NextResponse.json(j);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
