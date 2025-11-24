'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getServiceById, updateService, deleteService } from '@/services/service';
import { subscribeToAgenda } from '@/services/agenda';
import { Service, AgendaItem } from '@/types';
import { ArrowLeft, Edit, Trash2, DollarSign, Clock, Calendar, TrendingUp, Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ServiceForm from '@/components/dashboard/ServiceForm';
import { toast } from 'sonner';

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const serviceId = params.id as string;

    const [service, setService] = useState<Service | null>(null);
    const [appointments, setAppointments] = useState<AgendaItem[]>([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !serviceId) return;

        // Load service data
        const loadService = async () => {
            try {
                const serviceData = await getServiceById(user.uid, serviceId);
                setService(serviceData);
            } catch (error) {
                console.error('Error loading service:', error);
                toast.error('Error al cargar servicio');
            } finally {
                setLoading(false);
            }
        };

        loadService();

        // Subscribe to appointments
        const unsubscribe = subscribeToAgenda(user.uid, (items) => {
            // Filter appointments for this service
            const serviceAppointments = items.filter(item => item.service === service?.name);
            setAppointments(serviceAppointments.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
        });

        return () => unsubscribe();
    }, [user, serviceId, service?.name]);

    const stats = useMemo(() => {
        const totalBookings = appointments.length;
        const completedBookings = appointments.filter(a => a.status === 'completed').length;
        const totalRevenue = appointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.quotedAmount, 0);
        const uniqueClients = new Set(appointments.map(a => a.client)).size;

        return { totalBookings, completedBookings, totalRevenue, uniqueClients };
    }, [appointments]);

    const handleDelete = async () => {
        if (!user || !service) return;
        
        if (appointments.length > 0) {
            toast.error('No se puede eliminar un servicio con citas asociadas');
            return;
        }

        if (!window.confirm('¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            await deleteService(user.uid, service.id);
            toast.success('Servicio eliminado exitosamente');
            router.push('/services');
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Error al eliminar servicio');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Servicio no encontrado</p>
                    <button
                        onClick={() => router.push('/services')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Volver a servicios
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
                    onClick={() => router.push('/services')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Volver a servicios
                </button>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center">
                            <Package size={40} className="text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                            <p className="text-gray-600 mt-1">
                                Creado {format(new Date(service.createdAt), 'MMMM yyyy', { locale: es })}
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

            {/* Service Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Servicio</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Precio</p>
                            <p className="text-xl font-bold text-gray-900">
                                ${service.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Duración</p>
                            <p className="text-xl font-bold text-gray-900">{service.duration} min</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Package size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Veces Usado</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalBookings}</p>
                        </div>
                    </div>
                </div>
                {service.description && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Descripción</p>
                        <p className="text-gray-900">{service.description}</p>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Reservas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
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
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedBookings}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Ingresos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
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
                            <p className="text-sm text-gray-600">Clientes Únicos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uniqueClients}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments History */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Historial de Reservas</h2>
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
                        <p className="text-center text-gray-500 py-8">No hay reservas registradas para este servicio</p>
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
                                                <h3 className="font-semibold text-gray-900">{appointment.client}</h3>
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
                                                <div className="flex items-center text-gray-600">
                                                    <DollarSign size={16} className="mr-2" />
                                                    ${appointment.quotedAmount.toLocaleString('es-MX')}
                                                </div>
                                                {appointment.peopleCount > 0 && (
                                                    <div className="flex items-center text-gray-600">
                                                        👥 {appointment.peopleCount} personas
                                                    </div>
                                                )}
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
            <ServiceForm
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                serviceToEdit={service}
            />
        </div>
    );
}
