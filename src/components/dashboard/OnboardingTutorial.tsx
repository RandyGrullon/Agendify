"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Calendar, Users, Settings, BarChart3, FileText, Check } from "lucide-react";

interface TutorialStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    image?: string;
}

const tutorialSteps: TutorialStep[] = [
    {
        title: "¡Bienvenido a Agendify!",
        description: "Tu asistente personal para gestionar citas, clientes y servicios de manera profesional. Vamos a conocer las funcionalidades principales.",
        icon: <Check className="w-12 h-12 text-blue-600" />,
    },
    {
        title: "Dashboard",
        description: "Visualiza todas tus citas en un solo lugar. Cambia entre vista de lista, calendario y kanban según tus preferencias.",
        icon: <BarChart3 className="w-12 h-12 text-blue-600" />,
    },
    {
        title: "Gestión de Citas",
        description: "Crea, edita y organiza citas fácilmente. Rastrea pagos, abonos y lo que te queda por cobrar en tiempo real.",
        icon: <Calendar className="w-12 h-12 text-green-600" />,
    },
    {
        title: "Clientes",
        description: "Administra tu cartera de clientes con toda su información de contacto y historial de citas en un solo lugar.",
        icon: <Users className="w-12 h-12 text-purple-600" />,
    },
    {
        title: "Exportar e Importar",
        description: "Exporta tus datos a Excel para análisis externos. Importa citas masivamente desde archivos Excel.",
        icon: <FileText className="w-12 h-12 text-indigo-600" />,
    },
    {
        title: "Configuración",
        description: "Personaliza tu negocio, configura seguridad con PIN o biometría, y ajusta las preferencias de la aplicación.",
        icon: <Settings className="w-12 h-12 text-gray-600" />,
    },
];

export default function OnboardingTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen the tutorial
        const hasSeenTutorial = localStorage.getItem("agendify_tutorial_completed");
        if (!hasSeenTutorial) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("agendify_tutorial_completed", "true");
    };

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleClose();
    };

    if (!isOpen) return null;

    const step = tutorialSteps[currentStep];
    const isLastStep = currentStep === tutorialSteps.length - 1;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            {step.icon}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                        <p className="text-blue-100">{step.description}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Progress Indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {tutorialSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentStep
                                        ? "w-8 bg-blue-600"
                                        : index < currentStep
                                        ? "w-2 bg-green-500"
                                        : "w-2 bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="text-center mb-8">
                        <div className="text-gray-600 text-lg leading-relaxed">
                            {currentStep === 0 && (
                                <>
                                    Con Agendify puedes:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li className="flex items-center gap-2">
                                            <Check className="text-green-500" size={20} />
                                            <span>Gestionar citas y eventos</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="text-green-500" size={20} />
                                            <span>Administrar clientes y servicios</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="text-green-500" size={20} />
                                            <span>Controlar pagos y ganancias</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="text-green-500" size={20} />
                                            <span>Generar recibos en PDF</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="text-green-500" size={20} />
                                            <span>Exportar e importar datos</span>
                                        </li>
                                    </ul>
                                </>
                            )}
                            {currentStep === 1 && (
                                <>
                                    El Dashboard es tu centro de control. Aquí verás:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>📊 Estadísticas de tus citas</li>
                                        <li>💰 Ganancias y pagos pendientes</li>
                                        <li>👥 Número de clientes únicos</li>
                                        <li>🔍 Filtros avanzados de búsqueda</li>
                                    </ul>
                                </>
                            )}
                            {currentStep === 2 && (
                                <>
                                    Gestiona tus citas de forma profesional:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>✏️ Crea citas con todos los detalles</li>
                                        <li>💵 Registra abonos y pagos</li>
                                        <li>📋 Cambia estados fácilmente</li>
                                        <li>📄 Genera recibos automáticos</li>
                                        <li>📅 Vista de calendario y kanban</li>
                                    </ul>
                                </>
                            )}
                            {currentStep === 3 && (
                                <>
                                    Mantén organizados tus clientes:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>📇 Información completa de contacto</li>
                                        <li>📱 Teléfono, email y dirección</li>
                                        <li>📝 Notas y observaciones</li>
                                        <li>🔗 Vincula citas automáticamente</li>
                                    </ul>
                                </>
                            )}
                            {currentStep === 4 && (
                                <>
                                    Trabaja con tus datos:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>📥 Exporta a Excel para análisis</li>
                                        <li>📤 Importa citas desde archivos</li>
                                        <li>🔄 Sincronización automática</li>
                                        <li>☁️ Respaldo en la nube</li>
                                    </ul>
                                </>
                            )}
                            {currentStep === 5 && (
                                <>
                                    Personaliza y protege tu app:
                                    <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <li>🏢 Configura datos de tu negocio</li>
                                        <li>🔐 Activa PIN de seguridad</li>
                                        <li>👤 Habilita autenticación biométrica</li>
                                        <li>⚙️ Ajusta preferencias personales</li>
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                                currentStep === 0
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            <ChevronLeft size={20} />
                            Anterior
                        </button>

                        <button
                            onClick={handleSkip}
                            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        >
                            Saltar tutorial
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            {isLastStep ? "¡Comenzar!" : "Siguiente"}
                            {!isLastStep && <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
