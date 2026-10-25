import React, { useState } from 'react';
import { Smartphone, Download, Share, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        toast.success('PredictPro installed to your device!');
      }
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install PredictPro Mobile & Desktop App"
        className="hidden sm:inline-flex h-8 px-2.5 rounded-md text-xs font-semibold items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
      >
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">{isInstallable ? 'Install App' : 'Get App'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0B101B] p-6 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center">
                  PP
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Install PredictPro App</h3>
                  <p className="text-xs text-slate-400">Fast Standalone Mobile &amp; Desktop Experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              {isIOS ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Share className="w-4 h-4" /> Install on iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-200">
                    <li>Tap the <strong>Share</strong> icon at the bottom of Safari.</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner to launch full-screen.</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" /> Instant Install (Android / Desktop)
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Open your browser menu (<strong>⋮</strong> in Chrome or Edge) and select <strong>Install App</strong> or <strong>Add to Home Screen</strong> to launch PredictPro in standalone full-screen mode.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                <div className="font-bold text-white">App Features Included</div>
                <ul className="space-y-1.5 text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Offline access to cached daily match predictions &amp; xG tables</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero browser address bar with native 60fps navigation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1-tap access to Live Scores, 17-Game Jackpot &amp; Slip Converter</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
