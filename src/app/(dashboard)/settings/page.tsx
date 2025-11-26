'use client';

import SecuritySettings from '@/components/dashboard/SecuritySettings';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                <p className="text-gray-600">Administra la seguridad de tu aplicación.</p>
            </div>

            <SecuritySettings />
        </div>
    );
}
