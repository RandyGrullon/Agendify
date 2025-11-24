'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getClientById, updateClient, deleteClient } from '@/services/client';
import { subscribeToAgenda } from '@/services/agenda';
import { Client, AgendaItem } from '@/types';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar, DollarSign, Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ClientForm from '@/components/dashboard/ClientForm';
import { toast } from 'sonner';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const clientId = params.id as string;

    const [client, setClient] = useState<Client | null>(null);
    const [appointments, setAppointments] = useState<AgendaItem[]>([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !clientId) return;

        // Load client data
        const loadClient = async () => {
            try {
                const clientData = await getClientById(user.uid, clientId);
                setClient(clientData);
            } catch (error) {
                console.error('Error loading client:', error);
                toast.error('Error al cargar cliente');
            } finally {
                setLoading(false);
            }
        };

        loadClient();

        // Subscribe to appointments
        const unsubscribe = subscribeToAgenda(user.uid, (items) => {
            // Filter appointments for this client
            const clientAppointments = items.filter(item => item.client === client?.name);
            setAppointments(clientAppointments.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
        });

        return () => unsubscribe();
    }, [user, clientId, client?.name]);

    const stats = useMemo(() => {
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(a => a.status === 'completed').length;
        const totalSpent = appointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.quotedAmount, 0);
        const services = new Set(appointments.map(a => a.service)).size;

        return { totalAppointments, completedAppointments, totalSpent, services };
    }, [appointments]);

    const handleUpdate = async (clientData: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !client) return;

        try {
            await updateClient(user.uid, client.id, clientData);
            setClient({ ...client, ...clientData });
            toast.success('Cliente actualizado exitosamente');
        } catch (error) {
            console.error('Error updating client:', error);
            toast.error('Error al actualizar cliente');
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!user || !client) return;
        
        if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await deleteClient(user.uid, client.id);
            toast.success('Cliente eliminado exitosamente');
            router.push('/clients');
        } catch (error) {
            console.error('Error deleting client:', error);
            toast.error('Error al eliminar cliente');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Cliente no encontrado</p>
                    <button
                        onClick={() => router.push('/clients')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Volver a clientes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/clients')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Volver a clientes
                </button>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-3xl">
                                {client.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <p className="text-gray-600 mt-1">
                                Cliente desde {format(new Date(client.createdAt), 'MMMM yyyy', { locale: es })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Edit size={18} />
                            Editar
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={18} />
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.email && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-gray-900">{client.email}</p>
                            </div>
                        </div>
                    )}
                    {client.phone && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Phone size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Teléfono</p>
                                <p className="text-gray-900">{client.phone}</p>
                            </div>
                        </div>
                    )}
                    {client.address && (
                        <div className="flex items-start gap-3 md:col-span-2">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <MapPin size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Dirección</p>
                                <p className="text-gray-900">{client.address}</p>
                            </div>
                        </div>
                    )}
                    {client.notes && (
                        <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 mb-1">Notas</p>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{client.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Citas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAppointments}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completadas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedAppointments}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Gastado</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ${stats.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Servicios</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.services}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Package className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments History */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Historial de Citas</h2>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus size={16} />
                            Nueva Cita
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {appointments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay citas registradas para este cliente</p>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900">{appointment.service}</h3>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        appointment.status === 'confirmed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : appointment.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : appointment.status === 'completed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {appointment.status === 'confirmed'
                                                        ? 'Confirmado'
                                                        : appointment.status === 'pending'
                                                        ? 'Pendiente'
                                                        : appointment.status === 'completed'
                                                        ? 'Completado'
                                                        : 'Cancelado'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar size={16} className="mr-2" />
                                                    {format(new Date(appointment.date), 'dd MMM yyyy', { locale: es })} a las {appointment.time}
                                                </div>
                                                {appointment.location && (
                                                    <div className="flex items-center text-gray-600">
                                                        <MapPin size={16} className="mr-2" />
                                                        {appointment.location}
                                                    </div>
                                                )}
                                                <div className="flex items-center text-gray-600">
                                                    <DollarSign size={16} className="mr-2" />
                                                    ${appointment.quotedAmount.toLocaleString('es-MX')}
                                                </div>
                                            </div>
                                            {appointment.comments && (
                                                <p className="text-sm text-gray-600 mt-2 italic">"{appointment.comments}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <ClientForm
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdate}
                initialData={client}
                title="Editar Cliente"
            />
        </div>
    );
}
