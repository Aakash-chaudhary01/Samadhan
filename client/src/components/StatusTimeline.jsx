import React from 'react';
import { CheckCircle2, Clock, UserCheck, Wrench, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'submitted', label: 'Submitted', desc: 'Received & Geo-tagged' },
  { key: 'under_review', label: 'Under Review', desc: 'Department Assessment' },
  { key: 'assigned', label: 'Assigned', desc: 'Dispatched to Field Squad' },
  { key: 'in_progress', label: 'In Progress', desc: 'On-site Remediation' },
  { key: 'resolved', label: 'Resolved', desc: 'Field Evidence Uploaded' },
  { key: 'verified', label: 'Verified', desc: 'Quality Check Approved' },
];

const STAGE_ORDER = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'verified', 'closed'];

export default function StatusTimeline({ complaint }) {
  if (!complaint) return null;

  const currentIdx = STAGE_ORDER.indexOf(complaint.status);

  return (
    <div className="space-y-6">
      {/* Horizontal / Stepper Progress Bar */}
      <div className="bg-[#121620] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifecycle Progression</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${complaint.status === 'resolved' || complaint.status === 'verified' || complaint.status === 'closed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : complaint.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
            Status: {complaint.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
          {STAGES.map((stg, idx) => {
            const isCompleted = currentIdx >= idx;
            const isCurrent = complaint.status === stg.key;
            return (
              <div key={stg.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                    isCurrent
                      ? 'bg-rose-600 text-white ring-4 ring-rose-600/20'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                  {stg.label}
                </span>
                <span className="text-[9px] text-slate-500 hidden sm:inline">
                  {stg.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Before / After Evidence Photos */}
      {(complaint.photoUrl || complaint.evidencePhotoUrl) && (
        <div className="bg-[#121620] border border-white/10 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
            Visual Proof Documentation
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {complaint.photoUrl && (
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Citizen Submission Photo
                </span>
                <div className="rounded-xl overflow-hidden border border-white/10 h-44 bg-black/40">
                  <img
                    src={complaint.photoUrl}
                    alt="Citizen submission"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {complaint.evidencePhotoUrl ? (
              <div>
                <span className="block text-[11px] font-semibold text-emerald-400 mb-1.5 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Field Worker Resolution Evidence</span>
                </span>
                <div className="rounded-xl overflow-hidden border border-emerald-500/30 h-44 bg-black/40">
                  <img
                    src={complaint.evidencePhotoUrl}
                    alt="Resolution evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 h-44 flex flex-col items-center justify-center p-4 text-center">
                <Clock className="w-6 h-6 text-slate-500 mb-2" />
                <span className="text-xs text-slate-400 font-medium">Resolution evidence pending</span>
                <span className="text-[10px] text-slate-600 mt-1">
                  Field workers upload photo proof upon completion of on-site work
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit History Timeline */}
      <div className="bg-[#121620] border border-white/10 rounded-2xl p-5">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
          Transparent Activity Trail
        </h4>
        <div className="space-y-4">
          {(complaint.statusHistory || []).map((item, index) => (
            <div key={index} className="flex items-start space-x-3 text-xs">
              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-rose-400">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{item.note}</p>
                {item.changedByName && (
                  <span className="inline-block mt-1 text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                    By {item.changedByName} ({item.role})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
