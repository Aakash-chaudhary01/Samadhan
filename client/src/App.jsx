import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import LogoIntro from './components/LogoIntro';
import HeroSection from './components/HeroSection';
import AuthModal from './components/AuthModal';
import ComplaintForm from './components/ComplaintForm';
import CitizenDashboard from './components/CitizenDashboard';
import AdminDashboard from './components/AdminDashboard';
import FieldWorkerDashboard from './components/FieldWorkerDashboard';
import CivicChatbot from './components/CivicChatbot';
import WardHotspotMap from './components/WardHotspotMap';
import TrackModal from './components/TrackModal';
import {
  MessageSquare, Shield, Users, Award, ExternalLink,
  MapPin, CheckCircle2, AlertTriangle, LogOut, PlusCircle, Search
} from 'lucide-react';

export default function App() {
  const { user, logout, loading } = useAuth();

  // Modals & views
  const [showIntro, setShowIntro] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPortal, setAuthPortal] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Real Public stats
  const [publicStats, setPublicStats] = useState(null);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const res = await axios.get('/api/complaints/public-stats');
      if (res.data?.success) {
        setPublicStats(res.data);
      }
    } catch {
      // Graceful fallback
    }
  };

  const openAuth = (portal = null) => {
    setAuthPortal(portal);
    setAuthModalOpen(true);
  };

  const handleExplore = () => {
    // Directly open complaint reporting form for instant Scan & Report without login
    setReportModalOpen(true);
  };

  const handleMeetCreatures = () => {
    // Scrolls to the community recognition & impact section
    const el = document.getElementById('highlights');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* 1. Animated Logo Intro (Runs once per session) */}
      <LogoIntro onComplete={() => setShowIntro(false)} />

      {/* 2. Top App Bar (When Logged In) */}
      {user && (
        <nav className="sticky top-0 z-40 bg-[#0d1017]/90 backdrop-blur-md border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/images/samadhan-logo.png" alt="SAMADHAN Emblem" className="w-8 h-8 object-contain" />
            <span className="font-black text-sm tracking-widest text-white uppercase">SAMADHAN</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              user.role === 'municipal_admin'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : user.role === 'field_worker'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {user.role === 'citizen' && (
              <button
                onClick={() => setReportModalOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold transition-all shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            )}

            <button
              onClick={() => setMapModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              Ward Map
            </button>

            <button
              onClick={() => setTrackModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            >
              Track ID
            </button>

            {user.role === 'citizen' && (
              <div className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                <Award className="w-3.5 h-3.5" />
                <span>{user.points || 0} pts</span>
              </div>
            )}

            <div className="h-4 w-px bg-white/15"></div>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </nav>
      )}

      {/* 3. Main Views */}
      <main className="flex-1">
        {!user ? (
          /* Public Landing Page */
          <>
            {/* Exact Reference Hero Layout */}
            <HeroSection
              onExplore={handleExplore}
              onMeetCreatures={handleMeetCreatures}
              onOpenAuth={openAuth}
              onOpenSearch={() => setTrackModalOpen(true)}
              onOpenMap={() => setMapModalOpen(true)}
            />

            {/* Highlights Section with REAL MongoDB Statistics */}
            <section id="highlights" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/10">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  REAL-TIME CIVIC METRICS
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                  Verified Local Impact
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  Transparent database statistics showing citizen reports and municipal squad resolutions. No fake metrics.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#10141c] border border-white/10 rounded-3xl p-6 text-center">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Total Issues Filed</span>
                  <span className="text-4xl font-black text-white">
                    {publicStats?.stats?.totalComplaints || 0}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-2">Database recorded incidents</span>
                </div>

                <div className="bg-[#10141c] border border-emerald-500/20 rounded-3xl p-6 text-center">
                  <span className="text-xs font-semibold text-emerald-400 block mb-2">Verified Resolutions</span>
                  <span className="text-4xl font-black text-emerald-400">
                    {publicStats?.stats?.resolvedComplaints || 0}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-2">With photo evidence upload</span>
                </div>

                <div className="bg-[#10141c] border border-blue-500/20 rounded-3xl p-6 text-center">
                  <span className="text-xs font-semibold text-blue-400 block mb-2">In Remediation</span>
                  <span className="text-4xl font-black text-blue-400">
                    {publicStats?.stats?.inProgressComplaints || 0}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-2">Assigned to field workers</span>
                </div>

                <div className="bg-[#10141c] border border-white/10 rounded-3xl p-6 text-center">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Resolution Rate</span>
                  <span className="text-4xl font-black text-white">
                    {publicStats?.stats?.resolutionRate || 0}%
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-2">Calculated from verified tasks</span>
                </div>
              </div>

              {/* Official Grievance Portals Disclaimer & Reference */}
              <div id="portals" className="mt-16 p-6 rounded-3xl bg-blue-950/15 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Official Statutory Grievance Portals</span>
                  </h4>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Samadhan provides open community issue tracking and municipal field coordination. While municipal staff review these queues, Samadhan does not claim official exclusive government authority. For direct statutory escalations to Government of India or state ministries, please use official grievance mechanisms.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href="https://pgportal.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors"
                  >
                    <span>CPGRAMS Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://swachhata.urbanonline.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-colors"
                  >
                    <span>Swachhata Urban</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Role-based Logged In Views */
          <div>
            {user.role === 'citizen' && (
              <CitizenDashboard onNewComplaint={() => setReportModalOpen(true)} />
            )}

            {(user.role === 'municipal_admin' || user.role === 'supervisor') && (
              <AdminDashboard />
            )}

            {user.role === 'field_worker' && (
              <FieldWorkerDashboard />
            )}
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-white/10 bg-[#07090d] py-10 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/images/samadhan-logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-slate-400">SAMADHAN</span>
            <span>• Smart Civic Issue Reporting & Resolving Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>Platform recognition recognitions only, not government cash payouts.</span>
            <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
              Official Grievance Portal
            </a>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialPortal={authPortal}
      />

      {/* Citizen Complaint Filing Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            <ComplaintForm
              onSuccess={() => {
                setReportModalOpen(false);
                fetchPublicStats();
              }}
              onCancel={() => setReportModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Tracking Modal */}
      <TrackModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />

      {/* Ward Hotspot Map Modal */}
      <WardHotspotMap isOpen={mapModalOpen} onClose={() => setMapModalOpen(false)} />

      {/* Floating Bilingual Civic Chatbot Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center space-x-2 px-4 py-3 rounded-full bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs shadow-2xl shadow-rose-900/50 hover:scale-105 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Civic AI Assist</span>
          </button>
        ) : (
          <CivicChatbot
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            onSelectCategory={(cat) => {
              if (!user) openAuth('citizen');
              else setReportModalOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
