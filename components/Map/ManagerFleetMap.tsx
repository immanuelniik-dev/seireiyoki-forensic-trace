"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/** * Custom Cyan Marker for Seirei Branding 
 * Uses a reliable CDN for the icon assets
 */
const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ManagerFleetMapProps {
  managerId: string;
}

export default function ManagerFleetMap({ managerId }: ManagerFleetMapProps) {
  const [trucks, setTrucks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTruckLocations() {
      if (!managerId) return;

      // FIX: Selecting 'model' instead of 'truck_name' to match your DB schema
      const { data, error } = await supabase
        .from('fleet_trucks')
        .select('id, plate_number, model, last_lat, last_lng, last_updated, owner_email')
        .eq('owner_email', managerId)
        .not('last_lat', 'is', null); // Prevents map crashes on null coordinates

      if (error) {
        console.error('Forensic Mapping Error:', error.message);
      } else if (data) {
        setTrucks(data);
      }
    }

    fetchTruckLocations();

    // Realtime subscription for live movement
    const channel = supabase
      .channel(`fleet-${managerId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'fleet_trucks', 
          filter: `owner_email=eq.${managerId}` 
        },
        (payload) => {
          setTrucks((current) =>
            current.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [managerId]);

  return (
    <div className="h-[450px] w-full rounded-[2.5rem] overflow-hidden border border-gray-900 shadow-2xl relative">
      <MapContainer 
        center={[6.5244, 3.3792] as any} // Default center: Lagos, Nigeria
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#050505' }}
      >
        {/* Dark Mode Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {trucks.map((truck) => (
          <Marker 
            key={truck.id} 
            position={[truck.last_lat, truck.last_lng]} 
            icon={truckIcon}
          >
            <Popup>
              <div className="bg-[#080808] text-white p-2 font-mono text-[10px] min-w-[120px]">
                <p className="font-black text-cyan-500 uppercase tracking-tighter">
                  {truck.plate_number}
                </p>

                <div className="mt-3 pt-2 border-t border-gray-900">
                  <p className="text-[7px] text-gray-600 uppercase tracking-widest">
                    Last Satellite Ping:
                  </p>
                  <p className="text-[9px] text-cyan-900 font-bold">
                    {truck.last_updated ? new Date(truck.last_updated).toLocaleTimeString() : 'LIVE'}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}