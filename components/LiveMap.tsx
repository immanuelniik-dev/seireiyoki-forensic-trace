"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix for default Leaflet icons in Next.js
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle auto-centering when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface LiveMapProps {
  lat: number;
  lng: number;
  label: string;
  history?: any[]; // Array of {latitude, longitude}
  showHistory?: boolean;
}

export default function LiveMap({ lat, lng, label, history = [], showHistory = false }: LiveMapProps) {
  // Convert history objects into an array of coordinate tuples for Leaflet
  const pathCoordinates = history.map((point) => [point.latitude, point.longitude] as [number, number]);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#050505" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* 1. DRAW THE PATH (POLYLINE) */}
      {showHistory && pathCoordinates.length > 1 && (
        <Polyline 
          positions={pathCoordinates} 
          pathOptions={{ 
            color: '#06b6d4', 
            weight: 4, 
            opacity: 0.7,
            dashArray: '10, 10', // Makes it a dashed "tech" line
            lineJoin: 'round'
          }} 
        />
      )}

      {/* 2. THE CURRENT MARKER */}
      <Marker position={[lat, lng]} icon={icon}>
        <Popup>
          <div className="font-mono text-[10px] uppercase font-black">
            Node: {label} <br />
            Status: Active Broadcast
          </div>
        </Popup>
      </Marker>

      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}