'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { Client } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ClientTableProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onDelete: (clientId: string) => void;
    searchTerm?: string;
}

export default function ClientTable({ clients, onEdit, onDelete, searchTerm = '' }: ClientTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredClients = clients.filter((client) => {
        const search = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(search) ||
            client.email?.toLowerCase().includes(search) ||
            client.phone?.includes(search)
        );
    });

    const handleDelete = async (clientId: string) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            setDeletingId(clientId);
            try {
                await onDelete(clientId);
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleViewDetails = (clientId: string) => {
        router.push(`/clients/${clientId}`);
    };

    if (filteredClients.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contacto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dirección
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha de Registro
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client) => (
                            <tr
                                key={client.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => handleViewDetails(client.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold text-sm">
                                                {client.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                            {client.notes && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {client.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        {client.email && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Mail size={14} className="mr-2 text-gray-400" />
                                                {client.email}
                                            </div>
                                        )}
                                        {client.phone && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Phone size={14} className="mr-2 text-gray-400" />
                                                {client.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {client.address ? (
                                        <div className="flex items-start text-sm text-gray-600">
                                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <span className="line-clamp-2">{client.address}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {format(new Date(client.createdAt), 'dd MMM yyyy', { locale: es })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(client.id);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                                            title="Ver detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(client);
                                            }}
                                            className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 hover:bg-yellow-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(client.id);
                                            }}
                                            className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded disabled:opacity-50"
                                            title="Eliminar"
                                            disabled={deletingId === client.id}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
