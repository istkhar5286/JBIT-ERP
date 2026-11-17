import React, { createContext, useContext, useState, useEffect } from 'react';

const PwaInstallContext = createContext(null);

export const PwaInstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [platform, setPlatform] = useState('desktop'); // 'ios' | 'android' | 'desktop'
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [serverUnavailable, setServerUnavailable] = useState(false);

  useEffect(() => {
    // 1. Detect Standalone Mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // 2. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 3. Native PWA Install Prompt Capture
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event captured');
      setDeferredPrompt(e);
    };

    // 4. App Installed Event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowHelpModal(false);
    };

    // 5. Online/Offline Network Status
    const handleOnline = () => {
      setIsOffline(false);
      setServerUnavailable(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setServerUnavailable(true);
    };

    // 6. Custom Server Unavailable Event (from Axios interceptors)
    const handleServerDown = () => {
      setServerUnavailable(true);
    };

    const handleServerRecovered = () => {
      setServerUnavailable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('erp_server_unavailable', handleServerDown);
    window.addEventListener('erp_server_recovered', handleServerRecovered);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('erp_server_unavailable', handleServerDown);
      window.removeEventListener('erp_server_recovered', handleServerRecovered);
    };
  }, []);

  /**
   * Primary action to install the ERP application.
   * - If native prompt is ready: triggers prompt directly.
   * - If not supported or deferredPrompt is absent: shows helpful installation guide.
   */
  const installApp = async () => {
    if (isStandalone) {
      setShowHelpModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
          setIsInstalled(true);
          setDeferredPrompt(null);
        } else {
          console.log('[PWA] User dismissed the install prompt');
        }
      } catch (err) {
        console.error('[PWA] Error executing install prompt:', err);
        setShowHelpModal(true);
      }
    } else {
      // Browser does not expose programmatic prompt (e.g. iOS Safari, Firefox, or already prompted)
      setShowHelpModal(true);
    }
  };

  return (
    <PwaInstallContext.Provider
      value={{
        canInstall: !!deferredPrompt,
        isStandalone,
        isInstalled,
        platform,
        showHelpModal,
        setShowHelpModal,
        installApp,
        isOffline,
        serverUnavailable,
        setServerUnavailable
      }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
};

export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  }
  return context;
};

export default PwaInstallContext;
