import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatusTimeline from './StatusTimeline';
import { Award, PlusCircle, ExternalLink, Star, MessageSquare, AlertCircle, CheckCircle2, MapPin, Eye, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CitizenDashboard({ onNewComplaint }) {
  const { user, refreshUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filter, setFilter] = useState('all');

  // Feedback modal
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/complaints');
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackTarget) return;

    setSubmittingFeedback(true);
    try {
      const res = await axios.post(`/api/complaints/${feedbackTarget._id}/feedback`, {
        rating,
        comment,
      });

      if (res.data?.success) {
        setFeedbackSuccess('Feedback recorded! 10 recognition points credited.');
        confetti({ particleCount: 50, spread: 60 });
        refreshUser && refreshUser();
        fetchComplaints();
        setTimeout(() => {
          setFeedbackTarget(null);
          setFeedbackSuccess('');
          setComment('');
        }, 1800);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filtered = complaints.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['submitted', 'under_review', 'assigned', 'in_progress'].includes(c.status);
    if (filter === 'resolved') return ['resolved', 'verified', 'closed'].includes(c.status);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header Profile & Recognition Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-[#121620] border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.name}</h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                {user?.ward || 'Ward 1'} • Citizen
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Reported Issues</span>
            <span className="font-bold text-white text-base">{complaints.length}</span>
          </div>
        </div>

        {/* Civic Recognition Points Card */}
        <div className="bg-[#121620] border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Civic Points</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-white">{user?.points || 0}</span>
              <span className="text-xs text-amber-400/80 font-semibold">Platform Credits</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Earned via reporting (+20), resolution rating (+10) & verified impact (+30).
            </p>
          </div>

          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] text-slate-500 block">
              *Samadhan platform recognition tokens, non-monetary civic status.
            </span>
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-[#121620] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 block">
            Recognitions & Badges
          </span>

          <div className="flex flex-wrap gap-2">
            {(user?.badges || []).length > 0 ? (
              user.badges.map((b) => (
                <div key={b.id} className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center space-x-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block text-[11px]">{b.name}</span>
                    <span className="text-[9px] text-slate-400">{b.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">
                Submit your first verified civic issue to unlock the <strong>Civic Scout</strong> badge!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Official Grievance Portals Advisory Box */}
      <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 text-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-semibold text-white">Official Government Grievance Reference</p>
          <p className="text-slate-400 text-[11px]">
            Samadhan coordinates localized community resolution. For direct escalation to statutory government bodies, use official national platforms.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <a
            href="https://pgportal.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs transition-colors"
          >
            <span>CPGRAMS Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 3. Complaints Controls & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-[#121620] border border-white/10 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-[#e11d48] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All ({complaints.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'active' ? 'bg-[#e11d48] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'resolved' ? 'bg-[#e11d48] text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Resolved
          </button>
        </div>

        <button
          onClick={onNewComplaint}
          className="px-5 py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold tracking-wide transition-all flex items-center space-x-2 shadow-lg shadow-rose-900/30 w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* 4. Complaints Grid / List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading complaints...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#121620] border border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-400">
          <p className="text-sm font-semibold text-white mb-1">No complaints found</p>
          <p className="text-xs text-slate-500 mb-4">You have not submitted any complaints matching this filter.</p>
          <button
            onClick={onNewComplaint}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
          >
            Report an issue now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="bg-[#121620] border border-white/10 hover:border-white/25 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    {item.trackingId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    item.status === 'resolved' || item.status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.status === 'rejected'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-rose-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>

                <div className="space-y-1 text-[11px] text-slate-400 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-300 font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">{item.location?.ward} • {item.location?.address || 'Site'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedComplaint(item)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>

                {['resolved', 'verified', 'closed'].includes(item.status) && !item.feedback?.rating && (
                  <button
                    onClick={() => setFeedbackTarget(item)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Rate Resolution (+10 pts)</span>
                  </button>
                )}

                {item.feedback?.rating && (
                  <div className="flex items-center space-x-1 text-xs text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.feedback.rating}/5 Rated</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Detail & Timeline Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0f131a] border border-white/15 rounded-3xl p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {selectedComplaint.trackingId}
              </span>
              <h2 className="text-xl font-black text-white mt-2">{selectedComplaint.title}</h2>
              <p className="text-xs text-slate-400">{selectedComplaint.description}</p>
            </div>

            <StatusTimeline complaint={selectedComplaint} />
          </div>
        </div>
      )}

      {/* 6. Feedback Modal */}
      {feedbackTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0f131a] border border-white/15 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setFeedbackTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Rate Issue Resolution</h3>
            <p className="text-xs text-slate-400 mb-4">
              How satisfied are you with the municipal squad's remediation for #{feedbackTarget.trackingId}?
            </p>

            {feedbackSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{feedbackSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex items-center space-x-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-xl transition-all ${
                        rating >= s ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-600'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${rating >= s ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Citizen Feedback Comment</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Is the road properly leveled? Is all garbage removed cleanly?"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {submittingFeedback ? <span>Submitting...</span> : <span>Submit & Collect 10 Points</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
