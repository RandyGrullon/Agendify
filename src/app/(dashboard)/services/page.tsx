'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { subscribeToServices } from '@/services/service';
import { Service } from '@/types';
import ServiceForm from '@/components/dashboard/ServiceForm';
import ServiceTable from '@/components/dashboard/ServiceTable';

export default function ServicesPage() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToServices(user.uid, (data) => {
            setServices(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingService(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-0 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Servicios</h1>
                    <p className="text-sm sm:text-base text-gray-600">Gestiona tu catálogo de servicios y precios</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    <span>Nuevo Servicio</span>
                </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold text-purple-600">{services.length}</span> {services.length === 1 ? 'servicio' : 'servicios'} disponibles
                </p>
            </div>

            <ServiceTable services={services} onEdit={handleEdit} />

            <ServiceForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                serviceToEdit={editingService}
            />
        </div>
    );
}
