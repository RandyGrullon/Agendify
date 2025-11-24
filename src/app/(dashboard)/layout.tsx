"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import PINLockScreen from "@/components/dashboard/PINLockScreen";
import OnboardingTutorial from "@/components/dashboard/OnboardingTutorial";
import PWAInstallPrompt from "@/components/dashboard/PWAInstallPrompt";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);

    useEffect(() => {
        // Check if PIN is enabled
        const storedPin = localStorage.getItem("agendify_pin");
        setPinEnabled(!!storedPin);
        
        // If no PIN is set, app is "unlocked"
        if (!storedPin) {
            setIsUnlocked(true);
        }

        // Handle auto-lock on visibility change
        const handleVisibilityChange = () => {
            if (document.hidden && storedPin) {
                const autoLockTime = localStorage.getItem("agendify_autolock_time") || "immediate";
                
                if (autoLockTime === "immediate") {
                    setIsUnlocked(false);
                } else if (autoLockTime !== "never") {
                    const lockTimeout = setTimeout(() => {
                        setIsUnlocked(false);
                    }, parseInt(autoLockTime) * 60 * 1000);
                    
                    return () => clearTimeout(lockTimeout);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    if (pinEnabled && !isUnlocked) {
        return <PINLockScreen onUnlock={() => setIsUnlocked(true)} />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="lg:pl-72">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Onboarding Tutorial */}
            <OnboardingTutorial />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    );
}
