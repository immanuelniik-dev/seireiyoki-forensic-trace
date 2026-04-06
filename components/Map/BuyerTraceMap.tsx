import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { createClient } from '@supabase/supabase-js';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface BuyerTraceMapProps {
  batchId: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WarehouseIcon = L.icon({
  iconUrl: '/warehouse.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const LiveTruckIcon = L.icon({
  iconUrl: '/live-truck.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const FitBoundsToPolyline: React.FC<{ positions: L.LatLngExpression[] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds);
    }
  }, [positions, map]);

  return null;
};

const BuyerTraceMap: React.FC<BuyerTraceMapProps> = ({ batchId }) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const { data, error } = await supabase
        .from('gps_logs')
        .select('latitude, longitude')
        .eq('batch_id', batchId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching GPS logs:', error);
      } else if (data) {
        setCoordinates(data);
      }
    };

    fetchCoordinates();
  }, [batchId]);

  const polylinePositions: L.LatLngExpression[] = coordinates.map((coord) => [
    coord.latitude,
    coord.longitude,
  ]);

  return (
    <MapContainer
      center={[0, 0]} // Initial center, will be overridden by FitBoundsToPolyline
      zoom={13}
      style={{ height: '500px', width: '100%', backgroundColor: '#050505' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {polylinePositions.length > 0 && (
        <>
          <Polyline positions={polylinePositions} color="#00bcd4" weight={5} />
          <Marker position={polylinePositions[0]} icon={WarehouseIcon} />
          <Marker position={polylinePositions[polylinePositions.length - 1]} icon={LiveTruckIcon} />
          <FitBoundsToPolyline positions={polylinePositions} />
        </>
      )}
    </MapContainer>
  );
};

export default BuyerTraceMap;
