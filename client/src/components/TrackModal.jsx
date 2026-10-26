import React, { useState } from 'react';
import axios from 'axios';
import { Search, X, AlertCircle } from 'lucide-react';
import StatusTimeline from './StatusTimeline';

export default function TrackModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const res = await axios.get(`/api/complaints/${query.trim().toUpperCase()}`);
      if (res.data?.success) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found. Check the tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0f131a] border border-white/15 rounded-3xl p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-white mb-1">Track Civic Issue Status</h2>
        <p className="text-xs text-slate-400 mb-6">Enter your unique tracking ID (e.g., SAM-20261013-XXXX)</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SAM-20261013-XXXX"
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono uppercase focus:outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {complaint && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                {complaint.trackingId}
              </span>
              <h3 className="text-base font-bold text-white mt-2">{complaint.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{complaint.description}</p>
              <div className="mt-2 text-[11px] text-slate-400">
                <span>Location: {complaint.location?.ward} • {complaint.location?.address}</span>
              </div>
            </div>

            <StatusTimeline complaint={complaint} />
          </div>
        )}
      </div>
    </div>
  );
}
