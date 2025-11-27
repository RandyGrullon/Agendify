"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [pinEnabled, setPinEnabled] = useState(() => {
    try {
      return !!localStorage.getItem("agendify_pin");
    } catch (e) {
      return false;
    }
  });
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    try {
      return localStorage.getItem("agendify_biometric_enabled") === "true";
    } catch (e) {
      return false;
    }
  });
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [autoLockTime, setAutoLockTime] = useState("immediate");

  useEffect(() => {
    // Only set the auto lock time from localStorage on mount
    try {
      const lockTime = localStorage.getItem("agendify_autolock_time");
      setAutoLockTime(lockTime || "immediate");
    } catch (e) {}
    checkBiometricAvailability();
  }, []);
  const checkBiometricAvailability = async () => {
    if (window.PublicKeyCredential) {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setCanUseBiometric(available);
    }
  };

  const handleTogglePin = () => {
    if (pinEnabled) {
      // Disable PIN
      if (
        confirm(
          "¿Estás seguro de desactivar el PIN? Esto removerá la protección de tu app."
        )
      ) {
        localStorage.removeItem("agendify_pin");
        setPinEnabled(false);
        toast.success("PIN desactivado");
      }
    } else {
      // Enable PIN - user needs to set it
      setShowChangePin(true);
    }
  };

  const handleToggleBiometric = async () => {
    if (!pinEnabled) {
      toast.error("Primero debes activar un PIN");
      return;
    }

    if (biometricEnabled) {
      localStorage.removeItem("agendify_biometric_enabled");
      localStorage.removeItem("agendify_biometric_credential");
      setBiometricEnabled(false);
      toast.success("Autenticación biométrica desactivada");
    } else {
      try {
        await setupBiometric();
        setBiometricEnabled(true);
        toast.success("Autenticación biométrica activada");
      } catch (error) {
        console.error(error);
        toast.error("No se pudo activar la autenticación biométrica");
      }
    }
  };

  const setupBiometric = async () => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: "Agendify",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: "user@agendify.app",
          displayName: "Agendify User",
        },
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7,
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (credential) {
      const credentialId = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId))
      );
      localStorage.setItem("agendify_biometric_credential", credentialId);
      localStorage.setItem("agendify_biometric_enabled", "true");
    }
  };

  const handleChangePin = () => {
    if (!pinEnabled) {
      // Setting new PIN
      if (newPin.length < 4) {
        toast.error("El PIN debe tener al menos 4 dígitos");
        return;
      }
      if (newPin !== confirmNewPin) {
        toast.error("Los PINs no coinciden");
        return;
      }
      localStorage.setItem("agendify_pin", newPin);
      setPinEnabled(true);
      setShowChangePin(false);
      setNewPin("");
      setConfirmNewPin("");
      toast.success("PIN creado exitosamente");
    } else {
      // Changing existing PIN
      const storedPin = localStorage.getItem("agendify_pin");
      if (currentPin !== storedPin) {
        toast.error("PIN actual incorrecto");
        return;
      }
      if (newPin.length < 4) {
        toast.error("El nuevo PIN debe tener al menos 4 dígitos");
        return;
      }
      if (newPin !== confirmNewPin) {
        toast.error("Los nuevos PINs no coinciden");
        return;
      }
      localStorage.setItem("agendify_pin", newPin);
      setShowChangePin(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
      toast.success("PIN actualizado exitosamente");
    }
  };

  const handleAutoLockChange = (value: string) => {
    setAutoLockTime(value);
    localStorage.setItem("agendify_autolock_time", value);
    toast.success("Tiempo de bloqueo automático actualizado");
  };

  const handleResetTutorial = () => {
    localStorage.removeItem("agendify_tutorial_completed");
    toast.success(
      "Tutorial reiniciado. Recarga la página para verlo de nuevo."
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Status Card */}
      <div
        className={`p-6 rounded-lg border-2 ${
          pinEnabled
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-full ${
              pinEnabled ? "bg-green-100" : "bg-yellow-100"
            }`}
          >
            {pinEnabled ? (
              <CheckCircle
                className={`w-6 h-6 ${
                  pinEnabled ? "text-green-600" : "text-yellow-600"
                }`}
              />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold mb-1 ${
                pinEnabled ? "text-green-900" : "text-yellow-900"
              }`}
            >
              {pinEnabled
                ? "Tu app está protegida"
                : "Tu app no está protegida"}
            </h3>
            <p
              className={`text-sm ${
                pinEnabled ? "text-green-700" : "text-yellow-700"
              }`}
            >
              {pinEnabled
                ? "Has configurado medidas de seguridad para proteger tu información."
                : "Configura un PIN o autenticación biométrica para proteger tu información."}
            </p>
          </div>
        </div>
      </div>

      {/* PIN Settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  PIN de Seguridad
                </h4>
                <p className="text-sm text-gray-600">
                  Protege tu app con un código PIN
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={handleTogglePin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {pinEnabled && (
            <button
              onClick={() => setShowChangePin(true)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cambiar PIN
            </button>
          )}
        </div>
      </div>

      {/* Biometric Settings */}
      {canUseBiometric && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Fingerprint className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Autenticación Biométrica
                  </h4>
                  <p className="text-sm text-gray-600">
                    Face ID, Touch ID o huella digital
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={handleToggleBiometric}
                  disabled={!pinEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Auto Lock Settings */}
      {pinEnabled && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Bloqueo Automático
                </h4>
                <p className="text-sm text-gray-600">
                  Tiempo de inactividad antes de bloquear
                </p>
              </div>
            </div>
            <select
              value={autoLockTime}
              onChange={(e) => handleAutoLockChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="immediate">Inmediatamente</option>
              <option value="1">1 minuto</option>
              <option value="5">5 minutos</option>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="never">Nunca</option>
            </select>
          </div>
        </div>
      )}

      {/* Tutorial Reset */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-2">
            Tutorial de la Aplicación
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Reinicia el tutorial para verlo de nuevo la próxima vez que abras la
            app
          </p>
          <button
            onClick={handleResetTutorial}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Reiniciar Tutorial
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {pinEnabled ? "Cambiar PIN" : "Crear PIN"}
            </h3>

            <div className="space-y-4">
              {pinEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPins ? "text" : "password"}
                      value={currentPin}
                      onChange={(e) =>
                        setCurrentPin(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingresa tu PIN actual"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo PIN
                </label>
                <input
                  type={showPins ? "text" : "password"}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 4 dígitos"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nuevo PIN
                </label>
                <input
                  type={showPins ? "text" : "password"}
                  value={confirmNewPin}
                  onChange={(e) =>
                    setConfirmNewPin(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirma tu nuevo PIN"
                  maxLength={6}
                />
              </div>

              <button
                onClick={() => setShowPins(!showPins)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {showPins ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPins ? "Ocultar PINs" : "Mostrar PINs"}
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePin(false);
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmNewPin("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePin}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {pinEnabled ? "Cambiar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
