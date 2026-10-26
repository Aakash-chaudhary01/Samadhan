import React, { useState } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import MapPicker from './MapPicker';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud, Camera, Sparkles, AlertTriangle, CheckCircle2,
  MapPin, Tag, FileText, ArrowRight, X, Copy, Check, User, Phone
} from 'lucide-react';

const CATEGORIES = [
  'Potholes & Road Damage',
  'Garbage & Waste Disposal',
  'Streetlight & Electrical',
  'Water Supply & Leakage',
  'Drainage & Sewage Overflow',
  'Illegal Construction & Encroachment',
  'Public Sanitation & Toilets',
  'Stray Animals & Pest Control',
  'Other Civic Issues',
];

export default function ComplaintForm({ onSuccess, onCancel }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('medium');
  const [ward, setWard] = useState('Ward 4');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  // AI & duplicate state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size exceeds 5MB limit.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');

    // Automatically trigger upload & AI classification
    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setPhotoUrl(res.data.fileUrl);

        // Run AI classification
        analyzeWithAI(file.name, res.data.fileUrl);
      }
    } catch (err) {
      console.warn('Upload error:', err);
      // Fallback: continue with local preview
    } finally {
      setUploadingPhoto(false);
    }
  };

  const analyzeWithAI = async (fileName, url) => {
    setAiAnalyzing(true);
    try {
      const res = await axios.post('/api/ai/classify-image', {
        fileName,
        imageUrl: url,
      });
      if (res.data?.success && res.data.category) {
        setCategory(res.data.category);
        setAiInsight({
          category: res.data.category,
          status: res.data.serviceStatus,
          score: res.data.confidenceScore,
          label: res.data.analysisMethod || res.data.label,
        });
      }
    } catch {
      // Graceful fallback
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        category,
        priority,
        photoUrl,
        reporterName: user ? user.name : (reporterName || 'Citizen (Scan & Report)'),
        reporterPhone: user ? user.phone : reporterPhone,
        location: {
          latitude: coords.lat,
          longitude: coords.lng,
          address: address || `${ward}, Municipal Zone`,
          city: 'Delhi NCR',
          ward,
        },
      };

      const res = await axios.post('/api/complaints', payload);
      if (res.data?.success) {
        setSubmittedData(res.data);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setError(res.data?.message || 'Failed to register complaint in database.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving complaint to database. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmation Page after successful submission
  if (submittedData) {
    const { complaint, pointsEarned, referenceId } = submittedData;
    const refId = referenceId || complaint.trackingId;

    return (
      <div className="bg-[#121620] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-black text-white mb-1">Complaint Registered!</h3>
        <p className="text-xs text-slate-400 mb-4">
          Saved directly to the municipal database. You can track remediation progress anytime.
        </p>

        {/* Reference ID Card */}
        <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Complaint Reference ID
            </span>
            <span className="font-mono text-lg font-black text-white">{refId}</span>
          </div>

          <button
            type="button"
            onClick={() => handleCopyId(refId)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Complaint Details Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Category:</span>
            <span className="text-white font-medium">{complaint.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Department Routing:</span>
            <span className="text-emerald-400 font-medium">{complaint.assignedDepartment || 'Review Queue'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Ward & Site:</span>
            <span className="text-white font-medium">{complaint.location.ward}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="text-amber-400 font-semibold uppercase">{complaint.status}</span>
          </div>
          {pointsEarned > 0 && (
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-amber-400 font-bold">Platform Points Earned:</span>
              <span className="text-amber-400 font-bold">+{pointsEarned} Points</span>
            </div>
          )}
        </div>

        {complaint.aiInsights?.isDuplicate && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Nearby Active Issue Detected</p>
              <p className="text-[11px] text-slate-300">
                A similar issue (#{complaint.aiInsights.duplicateOfTrackingId}) was recently reported within 200m. Your report has been merged for priority squad escalation.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (onSuccess) onSuccess(complaint);
              else if (onCancel) onCancel();
            }}
            className="flex-1 py-3 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold tracking-wide transition-all shadow-lg"
          >
            {user ? 'Track in My Dashboard' : 'Done / Close'}
          </button>
          <button
            onClick={() => {
              setSubmittedData(null);
              setTitle('');
              setDescription('');
              setPhotoPreview('');
              setPhotoUrl('');
            }}
            className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#10141c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Scan & Report
            </span>
            {!user && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                No Login Required
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-white mt-1">Report a Civic Issue</h2>
          <p className="text-xs text-slate-400">
            {user
              ? `Logged in as ${user.name} (${user.ward || 'Ward 4'})`
              : 'Submit photo, category, and GPS pin directly to alert neighborhood municipal squads'}
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>Issue Headline *</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hazardous deep pothole on Main Market Road"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Category & Ward */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              <span>Category *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141820] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Ward / Zone *</span>
            </label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141820] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
            >
              {Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`).map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Photo Capture / Upload & Preview */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Capture or Upload Photo Evidence (Max 5MB)</span>
            </span>
            {aiAnalyzing && (
              <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>AI analyzing photo...</span>
              </span>
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-2xl cursor-pointer hover:border-rose-500/60 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <Camera className="w-6 h-6" />
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs text-white font-medium">Capture or upload photo</span>
              <span className="text-[11px] text-slate-500">Camera / Gallery (JPG, PNG, WebP)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 h-36 flex items-center justify-center">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(''); setPhotoFile(null); setPhotoUrl(''); setAiInsight(null); }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] h-36 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <span>No photo captured yet.</span>
                <span className="text-[11px] text-slate-600 mt-1">Photos accelerate field worker verification and squad dispatch.</span>
              </div>
            )}
          </div>

          {aiInsight && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>AI Suggested Category: <strong>{aiInsight.category}</strong></span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {aiInsight.score ? `${Math.round(aiInsight.score * 100)}% match` : 'Rule heuristic'}
              </span>
            </div>
          )}
        </div>

        {/* Leaflet Map Pin Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Precise Geolocation Pin *</span>
            </span>
            <span className="text-[11px] text-slate-400">Click anywhere on the map or use GPS</span>
          </label>
          <MapPicker
            latitude={coords.lat}
            longitude={coords.lng}
            onLocationChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>

        {/* Detailed Address / Landmark */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Landmark or Street Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Opposite Community Center, Gate 2"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Unauthenticated Citizen Optional Contact */}
        {!user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-white/5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>Your Name (Optional)</span>
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Anonymous Citizen"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone for SMS Updates (Optional)</span>
              </label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Description *</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the severity, duration, and safety hazards observed..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || uploadingPhoto}
          className="w-full py-3.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-sm font-bold tracking-wider uppercase transition-all shadow-xl shadow-rose-900/30 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <span>Saving to Municipal Database...</span>
          ) : (
            <>
              <span>
                {user ? 'Submit & Earn 20 Civic Points' : 'Submit Civic Report'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
