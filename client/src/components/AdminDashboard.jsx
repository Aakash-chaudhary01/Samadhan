import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, Users, Building, FileText,
  Key, ArrowRight, RefreshCw, Send, Check, X, Eye
} from 'lucide-react';
import StatusTimeline from './StatusTimeline';

const COLORS = ['#e11d48', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | review | departments | staff | audit
  const [overview, setOverview] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected complaint for timeline modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // New Invitation form state
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('field_worker');
  const [invDept, setInvDept] = useState('');
  const [invWard, setInvWard] = useState('Ward 4');
  const [invMsg, setInvMsg] = useState('');

  // Department edit state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptSla, setNewDeptSla] = useState(48);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ovRes, compRes, deptRes, staffRes, invRes, auditRes] = await Promise.all([
        axios.get('/api/admin/overview').catch(() => ({ data: {} })),
        axios.get('/api/complaints').catch(() => ({ data: {} })),
        axios.get('/api/departments').catch(() => ({ data: {} })),
        axios.get('/api/admin/staff').catch(() => ({ data: {} })),
        axios.get('/api/auth/invitations').catch(() => ({ data: {} })),
        axios.get('/api/admin/audit-logs').catch(() => ({ data: {} })),
      ]);

      if (ovRes.data?.success) setOverview(ovRes.data);
      if (compRes.data?.success) setComplaints(compRes.data.complaints || []);
      if (deptRes.data?.success) setDepartments(deptRes.data.departments || []);
      if (staffRes.data?.success) setStaff(staffRes.data.staff || []);
      if (invRes.data?.success) setInvitations(invRes.data.invitations || []);
      if (auditRes.data?.success) setAuditLogs(auditRes.data.logs || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (complaintId, assignedDepartment, assignedTo, priority) => {
    try {
      await axios.patch(`/api/complaints/${complaintId}/status`, {
        status: 'assigned',
        assignedDepartment,
        assignedTo,
        priority,
        note: `Assigned to department: ${assignedDepartment} by Municipal Admin`,
      });
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleVerifyResolution = async (complaintId) => {
    try {
      await axios.patch(`/api/complaints/${complaintId}/status`, {
        status: 'verified',
        note: 'Resolution verified by Municipal Admin. 30 impact points credited to citizen.',
      });
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/create-invitation', {
        email: invEmail,
        role: invRole,
        department: invDept || (departments[0]?.name || 'Roads & Infrastructure'),
        ward: invWard,
      });
      if (res.data?.success) {
        setInvMsg(`Generated Code: ${res.data.invitation.code}`);
        setInvEmail('');
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating invitation');
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/departments', {
        name: newDeptName,
        code: newDeptCode,
        slaHours: Number(newDeptSla),
      });
      if (res.data?.success) {
        setNewDeptName('');
        setNewDeptCode('');
        loadAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error configuring department');
    }
  };

  const reviewQueue = complaints.filter((c) => ['submitted', 'under_review'].includes(c.status));
  const verificationQueue = complaints.filter((c) => c.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Municipal Command Center
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Admin Operations & Real Analytics</h1>
          <p className="text-xs text-slate-400">
            Real MongoDB telemetry, review queue dispatching, and department oversight
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold w-fit transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {[
          { key: 'analytics', label: 'Real Analytics', icon: BarChart },
          { key: 'review', label: `Review Queue (${reviewQueue.length})`, icon: Clock },
          { key: 'verification', label: `Verification (${verificationQueue.length})`, icon: CheckCircle2 },
          { key: 'departments', label: 'Departments & SLA', icon: Building },
          { key: 'staff', label: 'Staff Invitations', icon: Key },
          { key: 'audit', label: 'Audit Logs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#e11d48] text-white shadow-lg shadow-rose-900/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REAL ANALYTICS */}
      {activeTab === 'analytics' && overview && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-[#121620] border border-white/10">
              <span className="text-xs text-slate-400 block mb-1">Total Complaints</span>
              <span className="text-2xl font-black text-white">{overview.metrics?.totalComplaints || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#121620] border border-amber-500/20">
              <span className="text-xs text-amber-400 block mb-1">Review Queue</span>
              <span className="text-2xl font-black text-amber-400">{overview.metrics?.reviewQueue || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#121620] border border-blue-500/20">
              <span className="text-xs text-blue-400 block mb-1">In Progress</span>
              <span className="text-2xl font-black text-blue-400">{overview.metrics?.inProgress || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#121620] border border-emerald-500/20">
              <span className="text-xs text-emerald-400 block mb-1">Resolved</span>
              <span className="text-2xl font-black text-emerald-400">{overview.metrics?.resolved || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#121620] border border-white/10 col-span-2 md:col-span-1">
              <span className="text-xs text-slate-400 block mb-1">Resolution Rate</span>
              <span className="text-2xl font-black text-white">{overview.metrics?.resolutionPercentage || 0}%</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Category */}
            <div className="bg-[#121620] border border-white/10 rounded-3xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Complaints by Category (Live MongoDB Counts)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.byCategory?.map((item) => ({ name: item._id?.split(' ')[0] || 'Other', count: item.count })) || []}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f131a', borderColor: '#232936', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ward Hotspots */}
            <div className="bg-[#121620] border border-white/10 rounded-3xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                Ward Concentration Hotspots
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.byWard?.map((item) => ({ name: item._id, total: item.total, resolved: item.resolved })) || []}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f131a', borderColor: '#232936', borderRadius: '12px' }} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Triaging incoming citizen complaints. Assign responsible departments and field workers.
          </p>

          {reviewQueue.length === 0 ? (
            <div className="bg-[#121620] border border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Review Queue is Clear!</p>
              <p className="text-xs text-slate-500">All submitted complaints have been reviewed and dispatched.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div key={item._id} className="bg-[#121620] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        {item.trackingId}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.location?.ward} • {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Reported by: {item.citizen?.name} ({item.citizen?.email})</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => {
                        const defaultDept = item.assignedDepartment || departments[0]?.name || 'Roads & Infrastructure';
                        const worker = staff.find((s) => s.role === 'field_worker');
                        handleAssign(item._id, defaultDept, worker?._id, 'high');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wide transition-all flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch to Field Squad</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Field workers have completed on-site work and uploaded proof photos. Inspect evidence and verify to release +30 civic impact recognition points to citizens.
          </p>

          {verificationQueue.length === 0 ? (
            <div className="bg-[#121620] border border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No Pending Verifications</p>
              <p className="text-xs text-slate-500">All resolved complaints have been verified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verificationQueue.map((item) => (
                <div key={item._id} className="bg-[#121620] border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {item.trackingId}
                      </span>
                      <span className="text-xs text-slate-400">{item.location?.ward}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-300 mt-1">Resolution Note: {item.resolutionNotes || 'Remediation completed by squad.'}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedComplaint(item)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Compare Before/After</span>
                    </button>

                    <button
                      onClick={() => handleVerifyResolution(item._id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Award +30 Pts</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEPARTMENTS & SLA */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-[#121620] border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Add or Update Municipal Department</h3>
            <form onSubmit={handleAddDepartment} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <input
                type="text"
                required
                placeholder="Department Name"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Code (e.g. ROADS)"
                value={newDeptCode}
                onChange={(e) => setNewDeptCode(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs uppercase focus:outline-none"
              />
              <input
                type="number"
                required
                placeholder="SLA Hours (e.g. 48)"
                value={newDeptSla}
                onChange={(e) => setNewDeptSla(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="py-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold"
              >
                Save Department
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept._id} className="p-5 rounded-2xl bg-[#121620] border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-400">{dept.slaHours}h SLA</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{dept.name}</h4>
                <p className="text-xs text-slate-400 mb-3">{dept.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(dept.categories || []).map((cat, i) => (
                    <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-300">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF INVITATIONS */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="bg-[#121620] border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">Generate Staff Invitation Code</h3>
            <p className="text-xs text-slate-400 mb-4">
              Staff accounts (field workers, supervisors, admins) can only be created with an invitation code.
            </p>

            {invMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                {invMsg}
              </div>
            )}

            <form onSubmit={handleCreateInvitation} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="email"
                required
                placeholder="Staff Email"
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
              <select
                value={invRole}
                onChange={(e) => setInvRole(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141820] border border-white/10 text-white text-xs"
              >
                <option value="field_worker">Field Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="municipal_admin">Municipal Admin</option>
              </select>
              <select
                value={invDept}
                onChange={(e) => setInvDept(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141820] border border-white/10 text-white text-xs"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <select
                value={invWard}
                onChange={(e) => setInvWard(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#141820] border border-white/10 text-white text-xs"
              >
                {Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`).map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <button
                type="submit"
                className="py-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold"
              >
                Issue Code
              </button>
            </form>
          </div>

          <div className="bg-[#121620] border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Active & Used Invitations</h3>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv._id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-amber-300 block">{inv.code}</span>
                    <span className="text-[11px] text-slate-400">{inv.email} • Role: {inv.role} • {inv.department}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inv.isUsed ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {inv.isUsed ? 'Redeemed' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[#121620] border border-white/10 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Municipal Audit Log Trail</h3>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{log.action}</span>
                    {log.trackingId && (
                      <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-1.5 rounded">
                        {log.trackingId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 shrink-0">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="block text-slate-400">By {log.performedByName} ({log.performedByRole})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail / Timeline Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0f131a] border border-white/15 rounded-3xl p-6 max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <StatusTimeline complaint={selectedComplaint} />
          </div>
        </div>
      )}
    </div>
  );
}
