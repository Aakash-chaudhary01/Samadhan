import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin } from 'lucide-react';

// Custom Map Marker Pin Icon
const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onLocationChange }) {
  // Default to Delhi coordinates
  const defaultPos = [28.6139, 77.2090];
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : defaultPos
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleUpdate = (newPos) => {
    setPosition(newPos);
    if (onLocationChange) {
      onLocationChange(newPos[0], newPos[1]);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        handleUpdate(coords);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#141820]">
      <div className="h-64 sm:h-72 w-full">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handleUpdate} />
        </MapContainer>
      </div>

      <div className="p-3 bg-[#0d1017] border-t border-white/10 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>
            Pin: {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
          <span className="text-slate-500 hidden sm:inline">(Click map to reposition)</span>
        </div>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center space-x-1.5 transition-colors"
        >
          <Crosshair className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Detecting...' : 'Use My GPS'}</span>
        </button>
      </div>
    </div>
  );
}
