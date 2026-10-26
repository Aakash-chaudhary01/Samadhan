import React, { useState } from 'react';
import { Search, Heart, Globe, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function HeroSection({ onExplore, onMeetCreatures, onOpenAuth, onOpenSearch, onOpenMap }) {
  const [activeLang, setActiveLang] = useState('EN');

  return (
    <div className="relative min-h-screen bg-[#07090d] text-white flex flex-col justify-between overflow-hidden selection:bg-rose-600 selection:text-white">
      {/* Background: Minimal, premium, editorial, mysterious dark aesthetic - No statues, flowers, or artwork */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-slate-900/40 via-emerald-950/15 to-transparent blur-3xl opacity-60"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rose-950/10 blur-[140px] rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-15"></div>
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07090d] to-transparent"></div>
      </div>

      {/* 1. TOP NAVIGATION BAR (Exact reference layout: Left logo, Center pill menu, Right utility pill) */}
      <header className="relative z-20 w-full px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand mark with official logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img
            src="/images/samadhan-logo.png"
            alt="SAMADHAN Official Emblem"
            className="w-10 h-10 object-contain drop-shadow"
          />
          <span className="font-extrabold tracking-widest text-lg uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            SAMADHAN
          </span>
        </div>

        {/* Center: Frosted Pill Navigation Menu */}
        <nav className="hidden md:flex items-center px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl space-x-7 text-xs font-medium tracking-wide text-slate-200">
          <a href="#highlights" className="hover:text-white transition-colors duration-200">Highlights</a>
          <a href="#reporting" onClick={(e) => { e.preventDefault(); onExplore && onExplore(); }} className="hover:text-white transition-colors duration-200">Report Issue</a>
          <a href="#ward-map" onClick={(e) => { e.preventDefault(); onOpenMap && onOpenMap(); }} className="hover:text-white transition-colors duration-200">Ward Map</a>
          <a href="#tracking" onClick={(e) => { e.preventDefault(); onOpenSearch && onOpenSearch(); }} className="hover:text-white transition-colors duration-200">Track Status</a>
          <a href="#portals" className="hover:text-white transition-colors duration-200">Civic Portals</a>
        </nav>

        {/* Far Right: Dark Pill Container [Language, Saved/Heart, Search] */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-black/60 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-md space-x-3">
            {/* Language toggle */}
            <button
              onClick={() => setActiveLang(activeLang === 'EN' ? 'HI' : 'EN')}
              className="flex items-center space-x-1 text-xs font-semibold hover:text-rose-400 transition-colors"
              title="Toggle English / Hindi"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeLang}</span>
            </button>

            <span className="text-white/20">|</span>

            {/* Heart / Saved */}
            <button
              onClick={() => onOpenAuth && onOpenAuth('citizen')}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Civic Badges & Points"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>

            <span className="text-white/20">|</span>

            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="text-slate-400 hover:text-white transition-colors"
              title="Search by Tracking ID"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onOpenAuth && onOpenAuth()}
            className="ml-2 text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-white"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* 2. HERO CENTER: Massive "SAMADHAN" dominant headline + Red Accent CTA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-16">
        {/* Dominant Headline */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-white uppercase select-none drop-shadow-2xl">
          SAMADHAN
        </h1>

        {/* Centered Accent Red Pill Button (replacing BELEEF BREDA in reference layout) */}
        <div className="mt-6 sm:mt-8">
          <button
            onClick={onExplore}
            className="px-8 py-3.5 rounded-full bg-[#e11d48] hover:bg-[#be123c] text-white text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-xl shadow-rose-900/40 hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <span>Scan & Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* 3. BOTTOM SECTION: Exact editorial split layout (Text area on left, Cards on right) */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-6 pb-12 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Left Column: Kicker, Headline, Description & 2 Buttons */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#e11d48]">
              BELEEF SAMADHAN
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Enter a world where creatures come alive
            </h2>

            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-md">
              An immersive world of curious creatures, magical places, and stories waiting to be discovered.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onExplore}
                className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-slate-200 text-xs font-bold tracking-wide transition-all shadow-md flex items-center space-x-1.5"
              >
                <span>Scan & Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onMeetCreatures}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold tracking-wide transition-all flex items-center space-x-1.5"
              >
                <span>Meet the Creatures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Cards in horizontal orientation (matching reference) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div
              onClick={onExplore}
              className="group cursor-pointer rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:border-rose-500/50 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#e11d48] mb-4">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-rose-400 transition-colors">
                Instant Geo-Report
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Pinpoint potholes, dumps, or broken streetlights directly with verified GPS precision.
              </p>
            </div>

            {/* Card 2 */}
            <div
              onClick={onMeetCreatures}
              className="group cursor-pointer rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:border-emerald-500/50 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                Curious Guardians
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Earn recognition points & badges while tracking neighborhood impact step-by-step.
              </p>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => onOpenAuth && onOpenAuth('municipal')}
              className="group cursor-pointer rounded-2xl bg-white/[0.04] border border-white/10 p-5 hover:border-blue-500/50 hover:bg-white/[0.07] transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                Municipal Action
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                Verified work proof uploads and transparent status timelines for field teams.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
