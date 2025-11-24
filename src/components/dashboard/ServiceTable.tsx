'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock, DollarSign, Eye, FileText } from 'lucide-react';
import { Service } from '@/types';
import { deleteService } from '@/services/service';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface ServiceTableProps {
    services: Service[];
    onEdit: (service: Service) => void;
}

export default function ServiceTable({ services, onEdit }: ServiceTableProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
            try {
                await deleteService(user.uid, id);
                toast.success('Servicio eliminado exitosamente');
            } catch (error) {
                console.error('Error deleting service:', error);
                toast.error('Error al eliminar el servicio');
            }
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Mobile Card View
    if (isMobile) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <input
                        type="text"
                        placeholder="Buscar servicios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    />
                </div>

                {filteredServices.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No se encontraron servicios</p>
                    </div>
                ) : (
                    filteredServices.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                        >
                            {/* Header */}
                            <div 
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 cursor-pointer"
                                onClick={() => router.push(`/services/${service.id}`)}
                            >
                                <h3 className="font-semibold text-gray-900 text-lg">{service.name}</h3>
                                {service.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                                )}
                            </div>

                            {/* Body */}
                            <div className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Price */}
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <DollarSign size={16} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Precio</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ${service.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Clock size={16} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Duración</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {service.duration} min
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/services/${service.id}`);
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Ver detalles"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(service);
                                    }}
                                    className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(service.id);
                                    }}
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // Desktop Table View
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Buscar servicios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duración
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No se encontraron servicios
                                </td>
                            </tr>
                        ) : (
                            filteredServices.map((service) => (
                                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                        {service.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {service.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <DollarSign size={16} className="text-gray-400 mr-1" />
                                            {service.price.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Clock size={16} className="text-gray-400 mr-1" />
                                            {service.duration} min
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/services/${service.id}`)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                                                title="Ver detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(service)}
                                                className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 hover:bg-yellow-50 rounded"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
