"use client";

import React, { useEffect, useState, useId } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { createClient } from '@supabase/supabase-js';

// Forensic Markers using pure CSS to avoid image loading issues
const WarehouseIcon = L.divIcon({
  className: 'custom-warehouse-icon',
  html: `<div style="background-color: #00bcd4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #00bcd4;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const LiveTruckIcon = L.divIcon({
  className: 'custom-truck-icon',
  html: `<div style="background-color: #ff0000; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px #ff0000; animation: pulse 2s infinite;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface Coordinate {
  latitude: number;
  longitude: number;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const BuyerTraceMap: React.FC<{ batchId: string }> = ({ batchId }) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const mapId = useId(); // Generates a unique ID to prevent "Map container reused" error

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!batchId) return;
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId);
        const { data: bMatch } = await supabase
          .from('batches')
          .select('id, batch_number')
          .or(`id.eq.${isUUID ? batchId : '00000000-0000-0000-0000-000000000000'},batch_number.eq.${batchId.toUpperCase()}`)
          .maybeSingle();
        
        if (!bMatch) return;

        const { data: logs } = await supabase.from('gps_logs').select('*');

        if (logs) {
          const filteredLogs = logs.filter(row => 
            row.batch_id === bMatch.id || row.batch_no === bMatch.batch_number || row.id === bMatch.id
          );

          const sortedLogs = filteredLogs.sort((a, b) => {
            const timeA = new Date(a.created_at || a.timestamp || a.inserted_at || 0).getTime();
            const timeB = new Date(b.created_at || b.timestamp || b.inserted_at || 0).getTime();
            return timeA - timeB;
          });

          setCoordinates(sortedLogs.map(row => ({
            latitude: Number(row.latitude || row.lat),
            longitude: Number(row.longitude || row.lng)
          })).filter(c => !isNaN(c.latitude) && !isNaN(c.longitude)));
        }
      } catch (err) {
        console.error('Map Sync Error:', err);
      }
    };

    fetchCoordinates();
  }, [batchId]);

  const polylinePositions: L.LatLngExpression[] = coordinates.map((coord) => [
    coord.latitude,
    coord.longitude,
  ]);

  return (
    <div className="w-full h-full relative forensic-map-container" style={{ minHeight: '500px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
      
      {/* The key={mapId} forces React to destroy and recreate the map if a collision occurs */}
      <MapContainer
        key={mapId}
        center={[9.0820, 8.6753]} 
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#050505', zIndex: 1 }}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        
        {polylinePositions.length > 0 && (
          <>
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ color: '#00bcd4', weight: 4, opacity: 0.8 }} 
            />
            <Marker position={polylinePositions[0]} icon={WarehouseIcon} />
            <Marker position={polylinePositions[polylinePositions.length - 1]} icon={LiveTruckIcon} />
            <FitBoundsToPolyline positions={polylinePositions} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default BuyerTraceMap;