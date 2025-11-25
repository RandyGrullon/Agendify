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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        // Check if PIN is enabled
        const storedPin = localStorage.getItem("agendify_pin");
        setPinEnabled(!!storedPin);
        
        // If no PIN is set, app is "unlocked"
        if (!storedPin) {
            setIsUnlocked(true);
        }

        // Load sidebar collapsed state
        const savedSidebarState = localStorage.getItem('sidebar-collapsed');
        if (savedSidebarState !== null) {
            setSidebarCollapsed(savedSidebarState === 'true');
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

    // Listen for sidebar collapse changes
    useEffect(() => {
        const handleStorageChange = () => {
            const savedState = localStorage.getItem('sidebar-collapsed');
            if (savedState !== null) {
                setSidebarCollapsed(savedState === 'true');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Custom event for same-window updates
        const handleSidebarToggle = (e: CustomEvent) => {
            setSidebarCollapsed(e.detail.collapsed);
        };
        
        window.addEventListener('sidebar-toggle' as any, handleSidebarToggle as any);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle as any);
        };
    }, []);

    if (pinEnabled && !isUnlocked) {
        return <PINLockScreen onUnlock={() => setIsUnlocked(true)} />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div 
                className="transition-all duration-300"
                style={{ 
                    paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
                        ? (sidebarCollapsed ? '5rem' : '18rem') 
                        : '0' 
                }}
            >
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
