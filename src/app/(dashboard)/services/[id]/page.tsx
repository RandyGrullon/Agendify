'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCatalogItemById, updateCatalogItem, deleteCatalogItem } from '@/services/catalog';
import { subscribeToAgenda } from '@/services/agenda';
import { CatalogItem, AgendaItem } from '@/types';
import { ArrowLeft, Edit, Trash2, DollarSign, Clock, Calendar, TrendingUp, Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CatalogItemForm from '@/components/dashboard/CatalogItemForm';
import DeleteConfirmationModal from '@/components/dashboard/DeleteConfirmationModal';
import { toast } from 'sonner';

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const serviceId = params.id as string;

    const [service, setService] = useState<CatalogItem | null>(null);
    const [appointments, setAppointments] = useState<AgendaItem[]>([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (!user || !serviceId) return;

        // Load service data
        const loadService = async () => {
            try {
                const serviceData = await getCatalogItemById(user.uid, serviceId);
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

        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!user || !service) return;

        try {
            await deleteCatalogItem(user.uid, service.id);
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
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Background */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 h-48 w-full absolute top-0 left-0 z-0" />

            <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto">
                {/* Navigation */}
                <button
                    onClick={() => router.push('/services')}
                    className="flex items-center text-white/90 hover:text-white mb-6 transition-colors group"
                >
                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors mr-3">
                        <ArrowLeft size={20} />
                    </div>
                    <span className="font-medium">Volver a servicios</span>
                </button>

                {/* Main Service Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center shadow-inner border border-purple-100">
                                <Package size={40} className="text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                                <div className="flex items-center gap-2 mt-2 text-gray-500">
                                    <Calendar size={16} />
                                    <span>Creado el {format(new Date(service.createdAt), 'dd MMMM yyyy', { locale: es })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
                            >
                                <Edit size={18} />
                                Editar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 hover:border-red-200 transition-all font-medium"
                            >
                                <Trash2 size={18} />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Info & Stats */}
                    <div className="space-y-8">
                        {/* Service Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900">Detalles del Servicio</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                            <DollarSign size={18} />
                                            <span className="text-sm font-medium">Precio</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-800">
                                            ${service.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                            <Clock size={18} />
                                            <span className="text-sm font-medium">Duración</span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-800">
                                            {service.duration ? `${service.duration} min` : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {service.description && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-500 mb-3">Descripción</p>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed">
                                            {service.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Reservas</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <TrendingUp size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Clientes</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.uniqueClients}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                            <DollarSign size={18} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Ingresos Totales</span>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                                <h2 className="text-lg font-bold text-gray-900">Historial de Reservas</h2>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:shadow text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Nueva Cita
                                </button>
                            </div>
                            <div className="p-6">
                                {appointments.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-gray-500 font-medium">No hay reservas registradas</p>
                                        <p className="text-sm text-gray-400 mt-1">Las reservas aparecerán aquí cuando se agenden</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {appointments.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all duration-200 relative overflow-hidden"
                                            >
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${appointment.status === 'confirmed' ? 'bg-green-500' :
                                                        appointment.status === 'pending' ? 'bg-yellow-500' :
                                                            appointment.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                                                    }`} />

                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-bold text-gray-900 text-lg">{appointment.client}</h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                        appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-red-100 text-red-700'
                                                                }`}>
                                                                {appointment.status === 'confirmed' ? 'Confirmado' :
                                                                    appointment.status === 'pending' ? 'Pendiente' :
                                                                        appointment.status === 'completed' ? 'Completado' : 'Cancelado'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 mt-3">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} className="text-gray-400" />
                                                                <span className="font-medium text-gray-700">
                                                                    {format(new Date(appointment.date), 'dd MMM yyyy', { locale: es })}
                                                                </span>
                                                                <span className="text-gray-400">•</span>
                                                                <span>{appointment.time}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign size={16} className="text-gray-400" />
                                                                <span className="font-medium text-gray-900">
                                                                    ${appointment.quotedAmount.toLocaleString('es-MX')}
                                                                </span>
                                                            </div>
                                                            {appointment.peopleCount > 0 && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400">👥</span>
                                                                    <span>{appointment.peopleCount} personas</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {appointment.comments && (
                                                            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                <p className="text-sm text-gray-600 italic">"{appointment.comments}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <CatalogItemForm
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                itemToEdit={service}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar servicio"
                message={`¿Estás seguro de que quieres eliminar el servicio "${service?.name}"? Esta acción no se puede deshacer.`}
            />
        </div>
    );
}
