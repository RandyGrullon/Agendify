"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Fingerprint, Shield } from "lucide-react";

interface PINLockScreenProps {
    onUnlock: () => void;
}

export default function PINLockScreen({ onUnlock }: PINLockScreenProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [confirmPin, setConfirmPin] = useState("");
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [showPin, setShowPin] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [canUseBiometric, setCanUseBiometric] = useState(false);

    useEffect(() => {
        // Check if PIN is set
        const storedPin = localStorage.getItem("agendify_pin");
        setIsSettingPin(!storedPin);

        // Check if biometric authentication is available
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        if (window.PublicKeyCredential) {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setCanUseBiometric(available);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            // Check if credentials exist
            const credentialId = localStorage.getItem("agendify_biometric_credential");
            
            if (!credentialId) {
                // First time setup
                await setupBiometric();
                return;
            }

            // Authenticate with existing credential
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                        type: 'public-key',
                        transports: ['internal'],
                    }],
                    timeout: 60000,
                    userVerification: 'required',
                }
            }) as PublicKeyCredential;

            if (credential) {
                onUnlock();
            }
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            setError("Autenticación biométrica falló. Usa tu PIN.");
        }
    };

    const setupBiometric = async () => {
        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);
            
            const userId = new Uint8Array(16);
            crypto.getRandomValues(userId);

            const credential = await navigator.credentials.create({
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
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7, // ES256
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                    },
                    timeout: 60000,
                }
            }) as PublicKeyCredential;

            if (credential) {
                const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
                localStorage.setItem("agendify_biometric_credential", credentialId);
                localStorage.setItem("agendify_biometric_enabled", "true");
                onUnlock();
            }
        } catch (error) {
            console.error('Biometric setup failed:', error);
            setError("No se pudo configurar la autenticación biométrica.");
        }
    };

    const handlePinInput = (value: string) => {
        if (value.length <= 6) {
            setPin(value);
            setError("");
        }
    };

    const handleSubmit = () => {
        if (isSettingPin) {
            if (step === 'enter') {
                if (pin.length < 4) {
                    setError("El PIN debe tener al menos 4 dígitos");
                    return;
                }
                setConfirmPin(pin);
                setPin("");
                setStep('confirm');
            } else {
                if (pin !== confirmPin) {
                    setError("Los PINs no coinciden. Intenta de nuevo.");
                    setPin("");
                    setConfirmPin("");
                    setStep('enter');
                    return;
                }
                localStorage.setItem("agendify_pin", pin);
                setIsSettingPin(false);
                onUnlock();
            }
        } else {
            const storedPin = localStorage.getItem("agendify_pin");
            if (pin === storedPin) {
                setAttempts(0);
                onUnlock();
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                
                if (newAttempts >= 5) {
                    setIsLocked(true);
                    setError("Demasiados intentos fallidos. Intenta en 30 segundos.");
                    setTimeout(() => {
                        setIsLocked(false);
                        setAttempts(0);
                        setError("");
                    }, 30000);
                } else {
                    setError(`PIN incorrecto. Intentos restantes: ${5 - newAttempts}`);
                }
                setPin("");
            }
        }
    };

    const handleNumberClick = (num: number) => {
        if (pin.length < 6) {
            handlePinInput(pin + num);
        }
    };

    const handleDelete = () => {
        handlePinInput(pin.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isSettingPin 
                            ? (step === 'enter' ? "Crear PIN de Seguridad" : "Confirmar PIN") 
                            : "Ingresar PIN"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {isSettingPin
                            ? (step === 'enter' 
                                ? "Crea un PIN de 4-6 dígitos para proteger tu información" 
                                : "Vuelve a ingresar tu PIN para confirmarlo")
                            : "Ingresa tu PIN para acceder a la aplicación"}
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center items-center gap-3 mb-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                                i < pin.length
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-300 bg-white"
                            }`}
                        >
                            {i < pin.length && (showPin ? pin[i] : "•")}
                        </div>
                    ))}
                    <button
                        onClick={() => setShowPin(!showPin)}
                        className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            disabled={isLocked}
                            className="h-16 text-2xl font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {num}
                        </button>
                    ))}
                    
                    {/* Biometric Button */}
                    {canUseBiometric && !isSettingPin && (
                        <button
                            onClick={handleBiometricAuth}
                            disabled={isLocked}
                            className="h-16 flex items-center justify-center text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Fingerprint size={28} />
                        </button>
                    )}
                    <button
                        onClick={() => handleNumberClick(0)}
                        disabled={isLocked}
                        className={`h-16 text-2xl font-semibold text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            !canUseBiometric || isSettingPin ? 'col-start-2' : ''
                        }`}
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLocked}
                        className="h-16 flex items-center justify-center text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ⌫
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={pin.length < 4 || isLocked}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSettingPin 
                        ? (step === 'enter' ? "Continuar" : "Confirmar PIN") 
                        : "Desbloquear"}
                </button>

                {/* Help Text */}
                {!isSettingPin && (
                    <div className="mt-4 text-center">
                        <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                            ¿Olvidaste tu PIN?
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
