'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getBusinessSettings, saveBusinessSettings } from '@/services/settings';
import SettingsForm from '@/components/dashboard/SettingsForm';
import SecuritySettings from '@/components/dashboard/SecuritySettings';
import { BusinessSettings } from '@/types';
import { Loader2, Building2, Shield } from 'lucide-react';

type TabType = 'business' | 'security';

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<BusinessSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('business');

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                try {
                    const data = await getBusinessSettings(user.uid);
                    setSettings(data);
                } catch (error) {
                    console.error('Error loading settings:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSettings();
    }, [user]);

    const handleSave = async (data: any) => {
        if (!user) return;
        await saveBusinessSettings(user.uid, data);
        setSettings({ ...data, userId: user.uid });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                <p className="text-gray-600">Administra tu negocio y seguridad de la aplicación.</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('business')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                            activeTab === 'business'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <Building2 size={20} />
                        Mi Negocio
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                            activeTab === 'security'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <Shield size={20} />
                        Seguridad
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'business' && (
                <SettingsForm initialSettings={settings} onSave={handleSave} />
            )}
            {activeTab === 'security' && (
                <SecuritySettings />
            )}
        </div>
    );
}
