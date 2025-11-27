"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClientById, updateClient, deleteClient } from "@/services/client";
import { subscribeToAgenda } from "@/services/agenda";
import { Client, AgendaItem } from "@/types";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ClientForm from "@/components/dashboard/ClientForm";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<AgendaItem[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !clientId) return;

    // Load client data
    const loadClient = async () => {
      try {
        const clientData = await getClientById(user.uid, clientId);
        setClient(clientData);
      } catch (error) {
        console.error("Error loading client:", error);
        toast.error("Error al cargar cliente");
      } finally {
        setLoading(false);
      }
    };

    loadClient();

    // Subscribe to appointments
    const unsubscribe = subscribeToAgenda(user.uid, (items) => {
      // Filter appointments for this client
      const clientAppointments = items.filter(
        (item) => item.client === client?.name
      );
      setAppointments(
        clientAppointments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    });

    return () => unsubscribe();
  }, [user, clientId, client?.name]);

  const stats = useMemo(() => {
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed"
    ).length;
    const totalSpent = appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + a.quotedAmount, 0);
    const services = new Set(appointments.map((a) => a.service)).size;

    return { totalAppointments, completedAppointments, totalSpent, services };
  }, [appointments]);

  const handleUpdate = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user || !client) return;

    try {
      await updateClient(user.uid, client.id, clientData);
      setClient({ ...client, ...clientData });
      toast.success("Cliente actualizado exitosamente");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Error al actualizar cliente");
      throw error;
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !client) return;

    try {
      await deleteClient(user.uid, client.id);
      toast.success("Cliente eliminado exitosamente");
      router.push("/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar cliente");
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
            onClick={() => router.push("/clients")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-48 w-full absolute top-0 left-0 z-0" />

      <div className="relative z-10 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Navigation */}
        <button
          onClick={() => router.push("/clients")}
          className="flex items-center text-white/90 hover:text-white mb-6 transition-colors group"
        >
          <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors mr-3">
            <ArrowLeft size={20} />
          </div>
          <span className="font-medium">Volver a clientes</span>
        </button>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100">
                <span className="text-blue-600 font-bold text-4xl">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.name}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500">
                  <Calendar size={16} />
                  <span>
                    Cliente desde{" "}
                    {format(new Date(client.createdAt), "MMMM yyyy", {
                      locale: es,
                    })}
                  </span>
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
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">
                  Información de Contacto
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {client.email && (
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email
                      </p>
                      <a
                        href={`mailto:${client.email}`}
                        className="text-gray-900 hover:text-blue-600 transition-colors font-medium break-all"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Teléfono
                      </p>
                      <a
                        href={`tel:${client.phone}`}
                        className="text-gray-900 hover:text-green-600 transition-colors font-medium"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Dirección
                      </p>
                      <p className="text-gray-900 font-medium">
                        {client.address}
                      </p>
                    </div>
                  </div>
                )}
                {client.notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-3">
                      Notas Adicionales
                    </p>
                    <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-gray-700 text-sm leading-relaxed">
                      {client.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Total Citas
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAppointments}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Calendar size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Completadas
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedAppointments}
                </p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                      <DollarSign size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      Inversión Total
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  $
                  {stats.totalSpent.toLocaleString("es-MX", {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-900">
                  Historial de Citas
                </h2>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow text-sm font-medium"
                >
                  <Plus size={16} />
                  Nueva Cita
                </button>
              </div>
              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                      No hay citas registradas
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Las citas aparecerán aquí cuando las crees
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 relative overflow-hidden"
                      >
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${
                            appointment.status === "confirmed"
                              ? "bg-green-500"
                              : appointment.status === "pending"
                              ? "bg-yellow-500"
                              : appointment.status === "completed"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-900 text-lg">
                                {appointment.service}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  appointment.status === "confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : appointment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : appointment.status === "completed"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {appointment.status === "confirmed"
                                  ? "Confirmado"
                                  : appointment.status === "pending"
                                  ? "Pendiente"
                                  : appointment.status === "completed"
                                  ? "Completado"
                                  : "Cancelado"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 mt-3">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span className="font-medium text-gray-700">
                                  {format(
                                    new Date(appointment.date),
                                    "dd MMM yyyy",
                                    { locale: es }
                                  )}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign
                                  size={16}
                                  className="text-gray-400"
                                />
                                <span className="font-medium text-gray-900">
                                  $
                                  {appointment.quotedAmount.toLocaleString(
                                    "es-MX"
                                  )}
                                </span>
                              </div>
                              {appointment.location && (
                                <div className="flex items-center gap-2 sm:col-span-2">
                                  <MapPin size={16} className="text-gray-400" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}
                            </div>

                            {appointment.comments && (
                              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-sm text-gray-600 italic">
                                  "{appointment.comments}"
                                </p>
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
      <ClientForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={client}
        title="Editar Cliente"
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar cliente"
        message={`¿Estás seguro de que quieres eliminar al cliente "${client?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
