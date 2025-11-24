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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
                    <p className="text-gray-600">Gestiona tu catálogo de servicios y precios</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Servicio
                </button>
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
