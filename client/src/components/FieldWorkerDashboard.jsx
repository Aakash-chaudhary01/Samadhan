import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle2, UploadCloud, MapPin, AlertCircle, Eye, X, ArrowRight } from 'lucide-react';
import StatusTimeline from './StatusTimeline';

export default function FieldWorkerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  // Evidence upload modal state
  const [resolvingTask, setResolvingTask] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/complaints');
      if (res.data?.success) {
        setTasks(res.data.complaints || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async (taskId) => {
    try {
      await axios.patch(`/api/complaints/${taskId}/status`, {
        status: 'in_progress',
        note: `Field worker ${user?.name} arrived on site and initiated remediation.`,
      });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleEvidenceSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Proof photo exceeds 5MB limit.');
      return;
    }

    setEvidenceFile(file);
    setEvidencePreview(URL.createObjectURL(file));
    setError('');

    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setEvidenceUrl(res.data.fileUrl);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceUrl) {
      setError('Resolution proof photo is mandatory.');
      return;
    }

    setUploading(true);
    try {
      await axios.patch(`/api/complaints/${resolvingTask._id}/status`, {
        status: 'resolved',
        evidencePhotoUrl: evidenceUrl,
        resolutionNotes: resolutionNotes || 'On-site remediation completed by field squad.',
        note: `Remediation completed. Proof photo submitted by ${user?.name}.`,
      });

      setResolvingTask(null);
      setEvidenceFile(null);
      setEvidencePreview('');
      setEvidenceUrl('');
      setResolutionNotes('');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Error marking resolved.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Field Squad Workspace
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Assigned Remediation Tasks</h1>
          <p className="text-xs text-slate-400">
            {user?.name} • Department: <strong>{user?.department || 'Field Squad'}</strong> • {user?.ward || 'Ward 4'}
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold w-fit"
        >
          Refresh Tasks
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading assigned tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#121620] border border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No pending tasks assigned</p>
          <p className="text-xs text-slate-500">Check with your municipal supervisor for new ward dispatches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#121620] border border-white/10 hover:border-white/25 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    {task.trackingId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    task.status === 'resolved' || task.status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : task.status === 'in_progress'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{task.title}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>

                <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{task.location?.ward} • {task.location?.address}</span>
                  </div>
                  <div>Category: <span className="text-slate-300">{task.category}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedTask(task)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Inspect
                </button>

                {task.status === 'assigned' && (
                  <button
                    onClick={() => handleStartWork(task._id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold ml-auto"
                  >
                    Start Work
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <button
                    onClick={() => { setResolvingTask(task); setError(''); }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold ml-auto flex items-center space-x-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Proof & Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Proof Upload Modal */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0f131a] border border-white/15 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setResolvingTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Submit Resolution Proof Photo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload mandatory after-remediation photo for #{resolvingTask.trackingId}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  After-Remediation Evidence Photo *
                </label>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/15 rounded-2xl cursor-pointer hover:border-emerald-500/60 hover:bg-white/[0.02] transition-colors">
                  <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-xs text-white font-medium">Select proof photo</span>
                  <span className="text-[11px] text-slate-500">Max 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleEvidenceSelect}
                    className="hidden"
                  />
                </label>

                {evidencePreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-emerald-500/30 h-36 bg-black/40">
                    <img src={evidencePreview} alt="Evidence Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Remediation Notes</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Pothole filled with hot mix asphalt and leveled. Drain blockage cleared."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !evidenceUrl}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {uploading ? <span>Uploading & Validating...</span> : <span>Confirm Resolution</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0f131a] border border-white/15 rounded-3xl p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <StatusTimeline complaint={selectedTask} />
          </div>
        </div>
      )}
    </div>
  );
}
