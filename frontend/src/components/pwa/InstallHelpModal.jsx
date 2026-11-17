import React from 'react';
import { usePwaInstall } from '../../context/PwaInstallContext';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle,
  X,
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react';
import { BRANDING } from '../../config/branding';

export const InstallHelpModal = () => {
  const { showHelpModal, setShowHelpModal, isStandalone, platform } = usePwaInstall();

  if (!showHelpModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setShowHelpModal(false)}
          className="absolute top-4 right-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <img
            src={BRANDING.LOGO}
            alt={BRANDING.LOGO_ALT}
            className="h-12 w-12 rounded-xl object-contain ring-1 ring-amber-400/40 p-0.5 bg-slate-900 drop-shadow-md"
          />
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              JB Institute of Technology
            </h3>
            <p className="text-xs font-semibold text-indigo-600">
              JBIT ERP &bull; Install Application
            </p>
          </div>
        </div>

        {/* Standalone Status */}
        {isStandalone ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2 mb-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-emerald-900">
              App Already Installed & Running
            </p>
            <p className="text-xs text-emerald-700">
              You are running JBIT ERP in standalone application mode directly from your device.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Install the official JBIT ERP app on your device for fast access, full-screen standalone experience, and instant academic & fee management.
            </p>

            {/* Platform Instructions */}
            {platform === 'ios' ? (
              /* iOS Safari Instructions */
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                  <span>How to Install on iPhone / iPad (Safari)</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal">
                  <li>
                    Tap the <strong>Share</strong> button <Share className="inline h-3.5 w-3.5 text-indigo-600 mx-0.5" /> at the bottom bar in Safari.
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="inline h-3.5 w-3.5 text-indigo-600 mx-0.5" />.
                  </li>
                  <li>
                    Tap <strong>"Add"</strong> in the top-right corner. JBIT ERP will appear on your Home Screen!
                  </li>
                </ol>
              </div>
            ) : platform === 'android' ? (
              /* Android Chrome Instructions */
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <span>How to Install on Android</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal">
                  <li>
                    Tap the browser menu (<strong>⋮</strong> or three dots) in the top-right corner.
                  </li>
                  <li>
                    Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Confirm the prompt. JBIT ERP will be installed as an APK-like standalone app on your device!
                  </li>
                </ol>
              </div>
            ) : (
              /* Desktop (Chrome / Edge / Windows / Mac) Instructions */
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <Laptop className="h-4 w-4 text-indigo-600" />
                  <span>How to Install on Desktop</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal">
                  <li>
                    Look at the right side of the URL/address bar for the <strong>Install</strong> icon <Download className="inline h-3.5 w-3.5 text-indigo-600 mx-0.5" />.
                  </li>
                  <li>
                    Or open browser menu (<strong>⋮</strong> or <strong>⋯</strong>) &rarr; select <strong>"Install JB Institute of Technology"</strong>.
                  </li>
                  <li>
                    Click <strong>"Install"</strong> to launch JBIT ERP in standalone window mode with desktop shortcuts.
                  </li>
                </ol>
              </div>
            )}

            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-800">
              💡 <strong>Note:</strong> Standalone mode provides zero browser clutter, fast navigation, and high security for your student and academic records.
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setShowHelpModal(false)}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
