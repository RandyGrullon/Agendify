"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  subscribeToAgenda,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  checkTimeConflict,
} from "@/services/agenda";
import { getBusinessSettings } from "@/services/settings";

import { AgendaItem } from "@/types";
import AgendaTable from "@/components/dashboard/AgendaTable";
import AgendaForm from "@/components/dashboard/AgendaForm";
import ImportDialog from "@/components/dashboard/ImportDialog";
import CalendarView from "@/components/dashboard/CalendarView";
import KanbanView from "@/components/dashboard/KanbanView";
import {
  Plus,
  Download,
  Upload,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  Filter,
  List,
  AlertCircle,
  Layout,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
  isSameDay,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import WeeklyCalendarModal from "@/components/dashboard/WeeklyCalendarModal";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AgendaItem[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWeeklyCalendarOpen, setIsWeeklyCalendarOpen] = useState(false);

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

  // Only keep necessary state for metrics and basic list
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAgenda(user.uid, (data) => {
        setItems(data);
        // Sort by date ascending (próximas primero) and time ascending (earliest first)
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          // Sort by date ascending (closest dates first)
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          // For same date, sort by time ascending (earliest first)
          const timeA = a.startTime || a.time;
          const timeB = b.startTime || b.time;
          return timeA.localeCompare(timeB);
        });
        setFilteredItems(sorted);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = items.length;
    const confirmed = items.filter((i) => i.status === "confirmed").length;
    const pending = items.filter((i) => i.status === "pending").length;
    const totalRevenue = items
      .filter((i) => i.status === "completed")
      .reduce((sum, i) => sum + i.quotedAmount, 0);
    const totalProfit = items
      .filter((i) => i.status === "completed")
      .reduce((sum, i) => sum + i.myProfit, 0);
    const uniqueClients = new Set(items.map((i) => i.client)).size;

    const pendingPayment = items
      .filter((i) => i.status === "pending" || i.status === "confirmed")
      .reduce((sum, i) => sum + (i.quotedAmount - (i.deposit || 0)), 0);

    return {
      total,
      confirmed,
      pending,
      totalRevenue,
      totalProfit,
      uniqueClients,
      pendingPayment,
    };
  }, [items]);

  // Get today's and this week's appointments (sorted by time ascending)
  const { todayAppointments, weekAppointments } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const today = items
      .filter((item) => {
        const itemDate =
          typeof item.date === "number"
            ? new Date((item.date - 25569) * 86400 * 1000)
            : parseISO(item.date.toString());
        return isSameDay(itemDate, todayStart);
      })
      .sort((a, b) => {
        // Sort by time ascending (earliest first)
        const timeA = a.startTime || a.time;
        const timeB = b.startTime || b.time;
        return timeA.localeCompare(timeB);
      });

    const week = items
      .filter((item) => {
        const itemDate =
          typeof item.date === "number"
            ? new Date((item.date - 25569) * 86400 * 1000)
            : parseISO(item.date.toString());
        return itemDate >= weekStart && itemDate <= weekEnd;
      })
      .sort((a, b) => {
        const dateA =
          typeof a.date === "number"
            ? new Date((a.date - 25569) * 86400 * 1000)
            : parseISO(a.date.toString());
        const dateB =
          typeof b.date === "number"
            ? new Date((b.date - 25569) * 86400 * 1000)
            : parseISO(b.date.toString());
        // First sort by date ascending
        if (dateA.getTime() !== dateB.getTime())
          return dateA.getTime() - dateB.getTime();
        // Then by time ascending (earliest first)
        const timeA = a.startTime || a.time;
        const timeB = b.startTime || b.time;
        return timeA.localeCompare(timeB);
      });

    return { todayAppointments: today, weekAppointments: week };
  }, [items]);

  const handleCreate = async (
    data: Omit<AgendaItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;
    try {
      // Check for time conflicts
      const collaboratorNames = (data.collaborators || []).map((c: any) => c.name);
      const conflict = await checkTimeConflict(
        user.uid,
        data.date as string,
        data.startTime || data.time,
        data.endTime || data.time,
        data.clientId,
        collaboratorNames
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

      await addAgendaItem(user.uid, data);
      setIsFormOpen(false);
      toast.success("Cita creada");
    } catch (error) {
      toast.error("Error al crear cita");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen general de tu negocio</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span className="font-medium">Nueva Cita</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-8">
        {/* Total Citas Card */}
        <Link
          href="/appointments"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Citas
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
        </Link>

        {/* Confirmadas Card */}
        <Link
          href="/appointments?status=confirmed"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Confirmadas
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.confirmed}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-green-500 to-green-400"></div>
        </Link>

        {/* Clientes Únicos Card */}
        <Link
          href="/clients"
          className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 cursor-pointer"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Clientes Únicos
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {stats.uniqueClients}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
        </Link>

        {/* Ganancia Total Card */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-yellow-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Ganancia Total
              </p>
              <p
                className="text-xl sm:text-2xl font-bold text-gray-900 break-words"
                title={`$${stats.totalProfit.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}`}
              >
                $
                {stats.totalProfit.toLocaleString("es-MX", {
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
        </div>

        {/* Por Cobrar Card */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Por Cobrar
              </p>
              <p
                className="text-xl sm:text-2xl font-bold text-gray-900 break-words"
                title={`$${stats.pendingPayment.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}`}
              >
                $
                {stats.pendingPayment.toLocaleString("es-MX", {
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-red-500 to-red-400"></div>
        </div>
      </div>

      {/* Recent Appointments Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Próximas Citas
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsWeeklyCalendarOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium inline-flex items-center gap-2 transition-colors"
              >
                <CalendarIcon size={16} />
                Ver Calendario Semanal
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-medium text-blue-600 mb-1">
                Citas de Hoy
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {todayAppointments.length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs font-medium text-purple-600 mb-1">
                Citas esta Semana
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {weekAppointments.length}
              </p>
            </div>
          </div>
        </div>

        {todayAppointments.length === 0 && weekAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              No hay citas registradas
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Comienza creando tu primera cita
            </p>
          </div>
        ) : (
          <div>
            {/* Today's Appointments */}
            {todayAppointments.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900">
                    Hoy -{" "}
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {todayAppointments.map((item) => (
                    <Link
                      href={`/appointments/${item.id}`}
                      key={item.id}
                      className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              item.status === "confirmed"
                                ? "bg-green-100 text-green-600"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-600"
                                : item.status === "completed"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <CalendarIcon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {item.client}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {item.service}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                🕐 {formatTime(item.startTime || item.time)}
                                {item.endTime &&
                                  ` - ${formatTime(item.endTime)}`}
                              </p>
                              {item.duration && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-11 sm:pl-0">
                          <p className="font-bold text-gray-900 text-lg">
                            ${item.quotedAmount.toLocaleString("es-MX")}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              item.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status === "pending"
                              ? "Pendiente"
                              : item.status === "confirmed"
                              ? "Confirmado"
                              : item.status === "completed"
                              ? "Completado"
                              : "Cancelado"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* This Week's Appointments */}
            {weekAppointments.length > 0 && (
              <div>
                <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                  <h3 className="text-sm font-bold text-purple-900">
                    Esta Semana
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {weekAppointments.slice(0, 5).map((item) => (
                    <Link
                      href={`/appointments/${item.id}`}
                      key={item.id}
                      className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left side - Client info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              item.status === "confirmed"
                                ? "bg-green-100 text-green-600"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-600"
                                : item.status === "completed"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <CalendarIcon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {item.client}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {item.service}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {new Date(item.date).toLocaleDateString(
                                  "es-MX",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}{" "}
                                • {formatTime(item.startTime || item.time)}
                                {item.endTime &&
                                  ` - ${formatTime(item.endTime)}`}
                              </p>
                              {item.duration && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {item.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Amount and status */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-11 sm:pl-0">
                          <p className="font-bold text-gray-900 text-lg">
                            ${item.quotedAmount.toLocaleString("es-MX")}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              item.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : item.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status === "pending"
                              ? "Pendiente"
                              : item.status === "confirmed"
                              ? "Confirmado"
                              : item.status === "completed"
                              ? "Completado"
                              : "Cancelado"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <Link
            href="/appointments"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-1 transition-colors"
          >
            Gestionar agenda completa
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Dialogs */}
      <AgendaForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      <WeeklyCalendarModal
        isOpen={isWeeklyCalendarOpen}
        onClose={() => setIsWeeklyCalendarOpen(false)}
        appointments={weekAppointments}
      />
    </div>
  );
}
