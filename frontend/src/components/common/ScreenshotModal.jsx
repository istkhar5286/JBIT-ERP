import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

export const ScreenshotModal = ({ isOpen, onClose, imageSrc, title = 'Payment Receipt Screenshot' }) => {
  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'payment_verification_screenshot.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-white">
          <span className="font-bold text-sm truncate">{title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
          <img
            src={imageSrc}
            alt={title}
            className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
