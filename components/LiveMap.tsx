"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default Leaflet icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to auto-center the map when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LiveMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
      <MapContainer center={[lat, lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup className="font-mono text-[10px] uppercase font-black">
            {label} // ACTIVE SIGNAL
          </Popup>
        </Marker>
        <RecenterMap lat={lat} lng={lng} />
      </MapContainer>
      
      {/* Industrial Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-black/80 border border-cyan-900/50 px-3 py-1 rounded text-[8px] text-cyan-500 font-black uppercase tracking-widest flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
        Live Telemetry Feed
      </div>
    </div>
  );
}