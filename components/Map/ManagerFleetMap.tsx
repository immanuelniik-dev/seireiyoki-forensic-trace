"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/** * Custom Cyan Marker for Seirei Branding 
 * Uses a reliable CDN for the icon assets
 */
const truckIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Coordinate {
  latitude: number;
  longitude: number;
}

const FitBoundsToPolyline: React.FC<{ positions: L.LatLngExpression[] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

interface ManagerFleetMapProps {
  managerId: string;
}

export default function ManagerFleetMap({ managerId }: ManagerFleetMapProps) {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [truckHistoricalPaths, setTruckHistoricalPaths] = useState<{ [plate_number: string]: Coordinate[] }>({});
  const [selectedTruckPlate, setSelectedTruckPlate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTruckLocations() {
      if (!managerId) return;

      const { data, error } = await supabase
        .from("fleet_trucks")
        .select("id, plate_number, model, last_lat, last_lng, last_updated, owner_email")
        .eq("owner_email", managerId)
        .not("last_lat", "is", null);

      if (error) {
        console.error("Forensic Mapping Error:", error.message);
      } else if (data) {
        setTrucks(data);

        const paths: { [plate_number: string]: Coordinate[] } = {};
        for (const truck of data) {
          const { data: logsData, error: logsError } = await supabase
            .from("gps_logs")
            .select("latitude, longitude, created_at")
            .eq("imei", truck.id)
            .order("created_at", { ascending: true });

          if (logsError) {
            console.error(`Error fetching historical logs for ${truck.plate_number}:`, logsError.message);
            continue;
          }

          if (logsData) {
            paths[truck.plate_number] = logsData.map(log => ({
              latitude: Number(log.latitude),
              longitude: Number(log.longitude)
            })).filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));
          }
        }
        setTruckHistoricalPaths(paths);
      }
    }

    fetchTruckLocations();

    const channel = supabase
      .channel(`fleet-${managerId}`)
      .on(
        "postgres_changes",
        { 
          event: "UPDATE", 
          schema: "public", 
          table: "fleet_trucks", 
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
        center={[6.5244, 3.3792]} 
        zoom={11} 
        style={{ height: "100%", width: "100%", background: "#050505" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {trucks.map((truck) => (
          <Marker 
            key={truck.id} 
            position={[truck.last_lat, truck.last_lng]} 
            icon={truckIcon}
            eventHandlers={{
              click: () => {
                setSelectedTruckPlate(truck.plate_number);
              },
            }}
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
                    {truck.last_updated ? new Date(truck.last_updated).toLocaleTimeString() : "LIVE"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedTruckPlate && truckHistoricalPaths[selectedTruckPlate] && (
          <Polyline 
            positions={truckHistoricalPaths[selectedTruckPlate].map(coord => [coord.latitude, coord.longitude])} 
            pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7 }} 
          />
        )}

        {selectedTruckPlate && truckHistoricalPaths[selectedTruckPlate] && truckHistoricalPaths[selectedTruckPlate].length > 0 && (
          <FitBoundsToPolyline positions={truckHistoricalPaths[selectedTruckPlate].map(coord => [coord.latitude, coord.longitude])} />
        )}
      </MapContainer>
    </div>
  );
}