import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '../utils/cn';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    if (iOS) {
      // Show iOS install instructions after a delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <Smartphone className="text-white" size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-sm">Install TradeVault</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isIOS 
                    ? 'Add to home screen for the best experience'
                    : 'Install as an app for quick access'
                  }
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-3 p-2.5 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tap <span className="inline-flex items-center mx-0.5 px-1.5 py-0.5 bg-slate-700 rounded text-white font-medium">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V13a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z"/>
                      <path d="M3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                    </svg>
                    Share
                  </span> then <span className="font-medium text-white">"Add to Home Screen"</span>
                </p>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                    'bg-blue-600 text-white hover:bg-blue-500'
                  )}
                >
                  <Download size={14} />
                  Install
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
