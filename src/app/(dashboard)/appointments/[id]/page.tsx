"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getAgendaItem,
  updateAgendaItem,
  checkTimeConflict,
  deleteAgendaItem,
} from "@/services/agenda";
import { AgendaItem } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AgendaForm from "@/components/dashboard/AgendaForm";
import { Dialog } from "@headlessui/react";

export default function AppointmentDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<AgendaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!user || !params.id) return;
      try {
        const data = await getAgendaItem(user.uid, params.id as string);
        if (data) {
          setItem(data);
        } else {
          toast.error("Cita no encontrada");
          router.push("/appointments");
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
        toast.error("Error al cargar la cita");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [user, params.id, router]);

  const handleEditComplete = async (data: any) => {
    if (!user || !item) return;
    try {
      // Check for time conflicts if date or time changed
      if (data.date || data.startTime || data.endTime || data.time) {
        const collaboratorNames = (
          data.collaborators ||
          item.collaborators ||
          []
        ).map((c: any) => c.name);
        const conflict = await checkTimeConflict(
          user.uid,
          (data.date as string) || (item.date as string),
          data.startTime || data.time || item.startTime || item.time,
          data.endTime || item.endTime || data.time || item.time,
          data.clientId || item.clientId,
          collaboratorNames,
          item.id // Exclude current item from conflict check
        );

        if (conflict) {
          toast.error(
            `Ya existe una cita a las ${
              conflict.startTime || conflict.time
            } con el mismo cliente o colaborador`,
            { duration: 4000 }
          );
          return;
        }
      }

      await updateAgendaItem(user.uid, item.id, data);
      setIsEditModalOpen(false);
      const updated = await getAgendaItem(user.uid, item.id);
      if (updated) setItem(updated);
      toast.success("Cita actualizada correctamente");
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Error al actualizar la cita");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user || !item) return;
    setIsStatusUpdating(true);
    try {
      const updatedItem = {
        ...item,
        status: newStatus as AgendaItem["status"],
      };
      await updateAgendaItem(user.uid, item.id, updatedItem);
      setItem(updatedItem);
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !item) return;
    setIsDeleting(true);
    try {
      await deleteAgendaItem(user.uid, item.id);
      toast.success("Cita eliminada exitosamente");
      router.push("/appointments");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Error al eliminar la cita");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) return null;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch (e) {
      return timeStr;
    }
  };

  const formatDate = (date: string | number) => {
    if (!date) return "N/A";
    try {
      let dateObj: Date;
      if (typeof date === "number") {
        const excelEpoch = new Date(1899, 11, 30);
        dateObj = new Date(excelEpoch.getTime() + date * 86400000);
      } else {
        dateObj = new Date(date.includes("T") ? date : date + "T00:00:00");
      }
      return format(dateObj, "EEEE d 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Pendiente",
        };
      case "confirmed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          label: "Confirmada",
        };
      case "completed":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Completada",
        };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", label: "Cancelada" };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: "Sin estado",
        };
    }
  };

  const currentStatus = getStatusColor(item.status);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Volver</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {item.service}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <span className="font-medium">{formatDate(item.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                <span className="font-medium">
                  {item.startTime && item.endTime
                    ? `${formatTime(item.startTime)} - ${formatTime(
                        item.endTime
                      )}`
                    : formatTime(item.time)}
                </span>
              </div>
              {item.duration && (
                <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-blue-200">
                  Duración: {Math.floor(item.duration / 60)}h{" "}
                  {item.duration % 60}m
                </span>
              )}
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Estado de la cita
            </label>
            <select
              value={item.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={isStatusUpdating}
              className={`px-4 py-2 rounded-lg font-semibold border-2 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentStatus.bg} ${currentStatus.text} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="pending">⏳ Pendiente</option>
              <option value="confirmed">✅ Confirmada</option>
              <option value="completed">🎉 Completada</option>
              <option value="cancelled">❌ Cancelada</option>
            </select>
          </div>
        </div>

        {/* Reminders Info */}
        {item.reminders && item.reminders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              🔔 Recordatorios configurados:
            </p>
            <div className="flex flex-wrap gap-2">
              {item.reminders
                .filter((r) => r.enabled)
                .map((reminder, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-blue-200"
                  >
                    {reminder.value}{" "}
                    {reminder.type === "days"
                      ? "días"
                      : reminder.type === "hours"
                      ? "horas"
                      : "minutos"}{" "}
                    antes
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Info */}
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="text-blue-600" size={20} />
              Información del Cliente
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-sm text-gray-500 block">Nombre</label>
                <p className="font-medium text-gray-900">{item.client}</p>
              </div>
              {/* Add more client fields if available in the future, e.g. phone, email */}
              <div>
                <label className="text-sm text-gray-500 block">Personas</label>
                <p className="font-medium text-gray-900">{item.peopleCount}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-red-500" size={20} />
              Ubicación
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-900">
                {item.location || "No especificada"}
              </p>
            </div>
          </section>

          {item.comments && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="text-gray-500" size={20} />
                Comentarios
              </h2>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {item.comments}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Financial Info */}
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="text-green-600" size={20} />
              Detalles Financieros
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Monto Cotizado</span>
                <span className="font-semibold text-lg text-gray-900">
                  RD$ {item.quotedAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Abono / Seña</span>
                <span className="font-medium text-green-600">
                  - RD$ {item.deposit?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium text-gray-900">
                  Pendiente por Cobrar
                </span>
                <span className="font-bold text-xl text-blue-600">
                  RD${" "}
                  {(item.quotedAmount - (item.deposit || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="text-purple-600" size={20} />
              Información Interna
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 block">
                    Mi Ganancia Total
                  </label>
                  <p className="font-medium text-green-700">
                    RD$ {item.myProfit?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block">
                    {(item.collaboratorPayment || 0) < 0
                      ? "Ganancia de Colaboradores"
                      : "Pago a Colaboradores"}
                  </label>
                  <p
                    className={`font-medium ${
                      (item.collaboratorPayment || 0) < 0
                        ? "text-green-600"
                        : "text-orange-700"
                    }`}
                  >
                    RD${" "}
                    {Math.abs(item.collaboratorPayment || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Collaborators List */}
              {(item.collaborators && item.collaborators.length > 0) ||
              item.collaborator ? (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="text-sm text-gray-500 block mb-2">
                    Detalle Colaboradores
                  </label>
                  {item.collaborators && item.collaborators.length > 0 ? (
                    <div className="space-y-2">
                      {item.collaborators.map((collab, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm"
                        >
                          <span className="font-medium text-gray-900">
                            {collab.name}
                          </span>
                          <div className="text-right">
                            <span
                              className={`block font-semibold ${
                                collab.paymentType === "charge"
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {collab.paymentType === "charge" ? "+" : "-"} RD${" "}
                              {Number(collab.amount).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {collab.paymentType === "charge"
                                ? "Cobro (Ganancia)"
                                : "Pago (Gasto)"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Legacy support
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                      <span className="font-medium text-gray-900">
                        {item.collaborator}
                      </span>
                      <span className="font-semibold text-orange-600">
                        - RD$ {item.collaboratorPayment?.toLocaleString() || 0}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              {item.bank && (
                <div className="mt-2">
                  <label className="text-sm text-gray-500 block">Banco</label>
                  <p className="font-medium text-gray-900">{item.bank}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AgendaForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditComplete}
        initialData={item}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                ¿Eliminar cita?
              </Dialog.Title>
            </div>
            <Dialog.Description className="text-sm text-gray-600 mb-6">
              Esta acción no se puede deshacer. La cita con{" "}
              <strong>{item?.client}</strong> el{" "}
              <strong>{item && formatDate(item.date)}</strong> será eliminada
              permanentemente.
            </Dialog.Description>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Eliminar cita
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
