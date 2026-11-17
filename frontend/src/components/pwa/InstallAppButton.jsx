import React from 'react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';

export const InstallAppButton = ({ variant = 'header', className = '' }) => {
  const { installApp, isStandalone, isInstalled, canInstall } = usePwaInstall();

  // If already running in standalone mode, display installed indicator
  if (isStandalone) {
    if (variant === 'sidebar') {
      return (
        <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 ${className}`}>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>App Active (Standalone)</span>
        </div>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/30 ${className}`}>
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span className="hidden sm:inline">Installed & Standalone</span>
        <span className="sm:hidden">Installed</span>
      </span>
    );
  }

  // Header Variant
  if (variant === 'header') {
    return (
      <button
        type="button"
        id="pwa-header-install-btn"
        onClick={installApp}
        className={`relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-black text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-800 hover:shadow-lg transition-all active:scale-95 animate-pulse hover:animate-none ${className}`}
        title="Install JB Institute of Technology ERP App"
      >
        <Download className="h-4 w-4 shrink-0 text-amber-100" />
        <span className="font-extrabold tracking-wide">Install App</span>
        {canInstall && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        )}
      </button>
    );
  }

  // Sidebar Variant
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        id="pwa-sidebar-install-btn"
        onClick={installApp}
        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <Smartphone className="h-4 w-4 text-amber-400" />
          <span>Install App</span>
        </div>
        <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-300">
          PWA
        </span>
      </button>
    );
  }

  // Banner Variant (e.g. for Login page)
  if (variant === 'banner') {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border border-indigo-500/30 shadow-xl backdrop-blur-md ${className}`}>
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Install JBIT ERP Application
            </h4>
            <p className="text-[11px] text-slate-300">
              Add to your device home screen for quick offline-ready student portal access
            </p>
          </div>
        </div>
        <button
          type="button"
          id="pwa-banner-install-btn"
          onClick={installApp}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all shrink-0 active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>Install App</span>
        </button>
      </div>
    );
  }

  // Card Variant (e.g. in Student Profile / Settings)
  return (
    <div className={`rounded-2xl bg-white p-5 border border-slate-200 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              JBIT ERP Application
            </h4>
            <p className="text-[11px] text-slate-500">
              Install as standalone PWA on your phone or desktop
            </p>
          </div>
        </div>
        <button
          type="button"
          id="pwa-card-install-btn"
          onClick={installApp}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install App</span>
        </button>
      </div>
    </div>
  );
};
