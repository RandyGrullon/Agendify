'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getBusinessSettings, saveBusinessSettings } from '@/services/settings';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { BusinessSettings } from '@/types';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<BusinessSettings | null>(null);
    const [loading, setLoading] = useState(true);

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
                <p className="text-gray-600">Administra la información de tu negocio para recibos y reportes.</p>
            </div>

            <SettingsForm initialSettings={settings} onSave={handleSave} />
        </div>
    );
}
