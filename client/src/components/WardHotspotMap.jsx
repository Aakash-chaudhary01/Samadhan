import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Shield, CheckCircle2, Clock, Filter, X } from 'lucide-react';

const createCustomIcon = (status) => {
  let color = '#f59e0b'; // amber
  if (status === 'resolved' || status === 'verified' || status === 'closed') color = '#10b981'; // green
  if (status === 'in_progress' || status === 'assigned') color = '#3b82f6'; // blue
  if (status === 'rejected') color = '#ef4444'; // red

  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export default function WardHotspotMap({ isOpen, onClose }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchMapComplaints();
    }
  }, [isOpen]);

  const fetchMapComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/complaints/public-stats');
      // Also fetch complaints with coordinates
      const listRes = await axios.get('/api/complaints');
      if (listRes.data?.success) {
        setComplaints(listRes.data.complaints || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = complaints.filter((c) => {
    if (!c.location?.latitude || !c.location?.longitude) return false;
    if (selectedWard === 'all') return true;
    return c.location?.ward === selectedWard;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-[#0f131a] border border-white/15 rounded-3xl p-6 text-slate-100 shadow-2xl flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Spatial GIS Intelligence
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Interactive Ward Hotspot Map</h2>
            <p className="text-xs text-slate-400">
              Live geo-tagged civic issues & resolution pins across municipal wards
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
            >
              <option value="all">All Wards</option>
              {Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`).map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leaflet Map Body */}
        <div className="flex-1 relative mt-4 rounded-2xl overflow-hidden border border-white/10">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading geospatial layer...
            </div>
          ) : (
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filtered.map((comp) => (
                <Marker
                  key={comp._id}
                  position={[comp.location.latitude, comp.location.longitude]}
                  icon={createCustomIcon(comp.status)}
                >
                  <Popup>
                    <div className="text-xs space-y-1 p-1">
                      <p className="font-bold text-slate-900">{comp.title}</p>
                      <p className="text-[11px] text-slate-600 font-mono">#{comp.trackingId}</p>
                      <p className="text-[11px] text-slate-700">Category: {comp.category}</p>
                      <p className="text-[11px] text-slate-700">Ward: {comp.location?.ward}</p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {comp.status}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 shrink-0 gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span>Pending Review</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Squad In Progress</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Resolved / Verified</span>
            </span>
          </div>

          <span>Showing {filtered.length} mapped incidents</span>
        </div>
      </div>
    </div>
  );
}
