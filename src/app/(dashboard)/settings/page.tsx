'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import SecuritySettings from '@/components/dashboard/SecuritySettings';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                <p className="text-gray-600">Administra la seguridad de la aplicación.</p>
            </div>

            {/* Security Settings */}
            <SecuritySettings />
        </div>
    );
}
