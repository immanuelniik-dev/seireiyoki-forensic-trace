import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// FIX: Do not initialize outside the function, as Vercel build will fail 
// if the environment variables are missing during the build step.

export async function POST(req: Request) {
  try {
    // Initialize inside the handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Configuration");
      return NextResponse.json({ error: "System Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data = await req.json();

    // 1. Extract core telemetry
    const imei = data.imei || data.id;
    const lat = parseFloat(data.lat || data.latitude);
    const lng = parseFloat(data.lng || data.longitude);
    const speed = parseFloat(data.speed || 0);

    if (!imei || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid Forensic Packet" }, { status: 400 });
    }

    // 2. Update the Global Ledger
    const { error: updateError } = await supabase
      .from('fleet_trucks')
      .update({
        last_lat: lat,
        last_lng: lng,
        last_updated: new Date().toISOString(),
        current_speed: speed
      })
      .eq('imei', imei);

    if (updateError) throw updateError;

    // 3. Log to historical "Chain of Custody"
    await supabase
      .from('gps_logs')
      .insert([
        { imei, lat, lng, speed, timestamp: new Date().toISOString() }
      ]);

    return NextResponse.json({ status: "ACK", message: "Node Updated" }, { status: 200 });

  } catch (error: any) {
    console.error("Receiver Error:", error.message);
    return NextResponse.json({ error: "Internal System Failure" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Seirei Forensic API Active. Use POST for telemetry." });
}