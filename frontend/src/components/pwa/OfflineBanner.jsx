import React, { useState } from 'react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export const OfflineBanner = () => {
  const { isOffline, serverUnavailable, setServerUnavailable } = usePwaInstall();
  const [retrying, setRetrying] = useState(false);

  // Show banner if either browser reports offline or backend server is unavailable
  if (!isOffline && !serverUnavailable) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      // Test basic connection to backend health check
      const res = await fetch('http://localhost:5000/api/health', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        setServerUnavailable(false);
      }
    } catch (e) {
      console.log('Retry check failed:', e);
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-rose-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-rose-200" />
        <span>Server unavailable. Please check your connection/server.</span>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold text-white transition-all disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
};
