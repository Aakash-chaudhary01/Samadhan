import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, ArrowRight, X, AlertCircle, CheckCircle2, Lock, Mail, User, Key, MapPin } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialPortal = null }) {
  const { login } = useAuth();
  const [portal, setPortal] = useState(initialPortal); // 'citizen' | 'municipal' | null
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPortal(initialPortal);
      setMode('login');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialPortal]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('Ward 1');
  const [invitationCode, setInvitationCode] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setInvitationCode('');
  };

  const handlePortalSelect = (selectedPortal) => {
    setPortal(selectedPortal);
    setMode('login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await axios.post('/api/auth/login', {
          email,
          password,
          portal,
        });
        if (res.data?.success) {
          login(res.data.token, res.data.user);
          onClose();
        }
      } else if (mode === 'register') {
        const payload = {
          name,
          email,
          password,
          phone,
          ward,
          role: portal === 'citizen' ? 'citizen' : 'field_worker', // staff role determined by invitation
          invitationCode: portal === 'municipal' ? invitationCode : undefined,
        };

        const res = await axios.post('/api/auth/register', payload);
        if (res.data?.success) {
          login(res.data.token, res.data.user);
          onClose();
        }
      } else if (mode === 'forgot') {
        const res = await axios.post('/api/auth/forgot-password', { email });
        setSuccessMsg(res.data.message || 'Password reset instructions sent.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0f131a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <img src="/images/samadhan-logo.png" alt="SAMADHAN Logo" className="w-9 h-9 object-contain" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">SAMADHAN ACCESS</h2>
            <p className="text-xs text-slate-400">Smart Civic Issue Reporting & Resolving Platform</p>
          </div>
        </div>

        {/* STEP 1: Portal Selection Screen */}
        {!portal ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 mb-2">Select your portal to proceed:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Citizen Card */}
              <button
                onClick={() => handlePortalSelect('citizen')}
                className="flex flex-col items-start p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Citizen Portal</h3>
                <p className="text-xs text-slate-400 mb-3">Report local civic issues, follow resolution progress & earn recognition points.</p>
                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 mt-auto">
                  <span>Enter as Citizen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Municipal Staff Card */}
              <button
                onClick={() => handlePortalSelect('municipal')}
                className="flex flex-col items-start p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Municipal Staff</h3>
                <p className="text-xs text-slate-400 mb-3">Admin review queue, supervisor assignment & field worker evidence upload.</p>
                <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1 mt-auto">
                  <span>Staff & Admin Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500">
                Staff accounts require invitation code issued by Municipal Admin
              </span>
            </div>
          </div>
        ) : (
          /* STEP 2: Login / Register / Forgot Password Forms */
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${portal === 'citizen' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {portal === 'citizen' ? 'Citizen Portal' : 'Municipal Staff Portal'}
                </span>
              </div>
              <button
                onClick={() => setPortal(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Switch Portal
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Sharma"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {portal === 'municipal' && (
                    <div>
                      <label className="block text-xs font-medium text-amber-300 mb-1">Admin Invitation Code *</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                        <input
                          type="text"
                          required
                          value={invitationCode}
                          onChange={(e) => setInvitationCode(e.target.value)}
                          placeholder="e.g. SAM-INV-FW-XXXX"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/30 text-amber-200 text-sm focus:outline-none focus:border-amber-400 uppercase font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Staff accounts can only be activated via invitation code.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Ward / Neighborhood</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <select
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141820] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                      >
                        {Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`).map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); }}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <span>
                    {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Complete Registration' : 'Send Reset Link'}
                  </span>
                )}
              </button>
            </form>

            {/* Switch between Login and Register */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    className="font-bold text-rose-400 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className="font-bold text-rose-400 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
