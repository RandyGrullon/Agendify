"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(() => {
    try {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream
      );
    } catch (e) {
      return false;
    }
  });
  const [isStandalone, setIsStandalone] = useState(() => {
    try {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ||
        document.referrer.includes("android-app://")
      );
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    // Check if running as PWA
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem("pwa_install_dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed =
      (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not dismissed or dismissed more than 7 days ago
    if (!isInStandaloneMode && (!dismissed || daysSinceDismissed > 7)) {
      if (iOS) {
        // For iOS, show custom prompt after 3 seconds
        setTimeout(() => setShowPrompt(true), 3000);
      } else {
        // For other browsers, listen for beforeinstallprompt event
        const handler = (e: Event) => {
          e.preventDefault();
          setDeferredPrompt(e as BeforeInstallPromptEvent);
          setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              {isIOS ? <Smartphone size={24} /> : <Monitor size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-lg">Instala Agendify</h3>
              <p className="text-sm text-blue-100">
                Acceso rápido desde tu dispositivo
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-gray-700 text-sm">
                Para instalar Agendify en tu iPhone o iPad:
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>
                  Toca el botón <strong>Compartir</strong>{" "}
                  <span className="inline-block">⎋</span>
                </li>
                <li>
                  Desplázate y toca{" "}
                  <strong>"Agregar a pantalla de inicio"</strong>
                </li>
                <li>
                  Toca <strong>Agregar</strong> en la esquina superior derecha
                </li>
              </ol>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Más tarde
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700 text-sm">
                Instala Agendify para tener acceso rápido y trabajar sin
                conexión.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Acceso desde tu pantalla de inicio</li>
                <li>✓ Funciona sin conexión</li>
                <li>✓ Notificaciones instantáneas</li>
                <li>✓ Experiencia de app nativa</li>
              </ul>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Más tarde
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Instalar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
