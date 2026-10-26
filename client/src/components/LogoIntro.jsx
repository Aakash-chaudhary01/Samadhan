import React, { useState, useEffect } from 'react';

export default function LogoIntro({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(0.4);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Check if already shown in this session
    const alreadyShown = sessionStorage.getItem('samadhan_intro_completed');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (alreadyShown || prefersReducedMotion) {
      setVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // Trigger smooth zoom from 0.4 to 1.0
    const startTimer = setTimeout(() => {
      setOpacity(1);
      setScale(1.0);
    }, 50);

    // Fade out and close after 2.4s
    const exitTimer = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    const finishTimer = setTimeout(() => {
      sessionStorage.setItem('samadhan_intro_completed', 'true');
      setVisible(false);
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090d] transition-opacity duration-500 ease-out cursor-pointer"
      style={{ opacity, pointerEvents: opacity === 0 ? 'none' : 'auto' }}
      onClick={() => {
        sessionStorage.setItem('samadhan_intro_completed', 'true');
        setVisible(false);
        if (onComplete) onComplete();
      }}
    >
      <div
        className="flex flex-col items-center text-center transition-transform duration-1000 ease-out px-4"
        style={{
          transform: `scale(${scale})`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="relative mb-6">
          <div className="absolute -inset-6 bg-blue-500/20 blur-3xl rounded-full"></div>
          <img
            src="/images/samadhan-logo.png"
            alt="SAMADHAN Official Emblem"
            className="w-48 h-36 md:w-72 md:h-52 object-contain relative drop-shadow-2xl"
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-widest text-white uppercase mb-2">
          SAMADHAN
        </h1>
        <p className="text-sm md:text-base text-sky-400 font-medium tracking-wider uppercase max-w-md">
          Smart Civic Issue Reporting & Resolving Platform
        </p>

        <span className="mt-8 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Click anywhere to skip
        </span>
      </div>
    </div>
  );
}
