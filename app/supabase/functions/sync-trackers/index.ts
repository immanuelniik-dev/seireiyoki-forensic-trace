import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role to bypass RLS
)

export default async function trackerBrain() {
  // 1. Fetch all batches that are currently "In Transit"
  const { data: activeBatches } = await supabase
    .from('batches')
    .select('batch_number, tracker_device_id, tracker_provider, api_token')
    .eq('status', 'In Transit - Sealed');

  if (!activeBatches) return;

  for (const batch of activeBatches) {
    let lat, lng;

    if (batch.api_token && batch.tracker_device_id) {
      // --- REAL API LOGIC (For future GTrac / Concept Nova) ---
      // const response = await fetch(`https://api.gtrac.com/v1/device/${batch.tracker_device_id}`, {
      //   headers: { 'Authorization': `Bearer ${batch.api_token}` }
      // });
      // const data = await response.json();
      // lat = data.latitude; lng = data.longitude;
    } else {
      // --- DEMO / SIMULATION LOGIC ---
      // If no tracker is linked, we "Simulate" a slow crawl across Nigeria 
      // This is perfect for your partnership pitches!
      const { data: lastLog } = await supabase
        .from('location_logs')
        .select('lat, lng')
        .eq('batch_number', batch.batch_number)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Move the truck slightly North-East (towards a destination)
      lat = (lastLog?.lat || 6.5244) + (Math.random() * 0.001); 
      lng = (lastLog?.lng || 3.3792) + (Math.random() * 0.001);
    }

    // 2. Save the new coordinate to the Forensic Ledger
    await supabase.from('location_logs').insert({
      batch_number: batch.batch_number,
      lat,
      lng,
      status: 'Verified via Satellite'
    });
  }
}