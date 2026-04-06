import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "" // Use Service Role for bypass RLS
);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Extract core telemetry from the hardware packet
    // Note: Field names may vary by tracker (e.g., 'id' vs 'imei')
    const imei = data.imei || data.id;
    const lat = parseFloat(data.lat || data.latitude);
    const lng = parseFloat(data.lng || data.longitude);
    const speed = parseFloat(data.speed || 0);

    if (!imei || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid Forensic Packet" }, { status: 400 });
    }

    // 2. Update the Global Ledger (fleet_trucks table)
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

    // 3. Log to historical "Chain of Custody" for audit
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

// Support for trackers that use GET (Query Strings) instead of POST
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imei = searchParams.get('imei');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Re-use the same logic as POST or redirect to a handler
  return NextResponse.json({ message: "GET Protocol Received. Use POST for high-security." });
}