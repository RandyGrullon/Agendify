"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import {
  subscribeToAgenda,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
} from "@/services/agenda";
import { getBusinessSettings } from "@/services/settings";
import { AgendaItem } from "@/types";
import AgendaTable from "@/components/dashboard/AgendaTable";
import AgendaForm from "@/components/dashboard/AgendaForm";
import ImportDialog from "@/components/dashboard/ImportDialog";
import CalendarView from "@/components/dashboard/CalendarView";
import KanbanView from "@/components/dashboard/KanbanView";
import FilterDrawer from "@/components/dashboard/FilterDrawer";
import ViewSwitcher from "@/components/dashboard/ViewSwitcher";
import ActionMenu from "@/components/dashboard/ActionMenu";
import { Plus, Filter } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: searchParams.get("status") || "all",
    dateFrom: "",
    dateTo: "",
  });

  const [viewMode, setViewMode] = useState<"list" | "calendar" | "kanban">(
    "list"
  );

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToAgenda(user.uid, (data) => {
        setItems(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    const lowerTerm = filters.searchTerm.toLowerCase();
    let filtered = items.filter(
      (item) =>
        item.client.toLowerCase().includes(lowerTerm) ||
        item.service.toLowerCase().includes(lowerTerm) ||
        item.status.toLowerCase().includes(lowerTerm)
    );

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter((item) => {
        try {
          if (!item.date) return false;

          let dateStr: string;

          // Handle Excel serial dates
          if (typeof item.date === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const tempDate = new Date(
              excelEpoch.getTime() + item.date * 86400000
            );
            dateStr = tempDate.toISOString().split("T")[0];
          } else {
            dateStr = item.date.includes("T")
              ? item.date.split("T")[0]
              : item.date;
          }

          const itemDate = new Date(dateStr + "T00:00:00");

          if (isNaN(itemDate.getTime())) return false;

          return isWithinInterval(itemDate, {
            start: new Date(filters.dateFrom),
            end: new Date(filters.dateTo),
          });
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [filters, items]);

  const handleCreate = async (
    data: Omit<AgendaItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;
    try {
      await addAgendaItem(user.uid, data);
      setIsFormOpen(false);
      toast.success("Cita creada");
    } catch (error) {
      toast.error("Error al crear cita");
    }
  };

  const handleUpdate = async (data: Partial<AgendaItem>) => {
    if (!user || !editingItem) return;
    try {
      await updateAgendaItem(user.uid, editingItem.id, data);
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success("Cita actualizada");
    } catch (error) {
      toast.error("Error al actualizar cita");
    }
  };

  const handleDelete = async (itemOrId: AgendaItem | string) => {
    const id = typeof itemOrId === "string" ? itemOrId : itemOrId.id;
    if (!user || !confirm("¿Estás seguro de eliminar esta cita?")) return;
    try {
      await deleteAgendaItem(user.uid, id);
      toast.success("Cita eliminada");
    } catch (error) {
      toast.error("Error al eliminar cita");
    }
  };

  const handleDuplicate = async (item: AgendaItem) => {
    if (!user) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = item;
      await addAgendaItem(user.uid, { ...rest });
      toast.success("Cita duplicada");
    } catch (error) {
      toast.error("Error al duplicar cita");
    }
  };

  const handleStatusChange = async (
    itemId: string,
    newStatus: AgendaItem["status"]
  ) => {
    if (!user) return;
    try {
      await updateAgendaItem(user.uid, itemId, { status: newStatus });
      toast.success("Estado actualizado");
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleExport = () => {
    // Format data for export
    const exportData = filteredItems.map((item) => {
      const porCobrar = item.quotedAmount - (item.deposit || 0);
      const showPorCobrar =
        porCobrar > 0 &&
        (item.status === "pending" || item.status === "confirmed");
      return {
        Fecha: item.date,
        Hora: item.time,
        Cliente: item.client,
        Servicio: item.service,
        Estado:
          item.status === "pending"
            ? "Pendiente"
            : item.status === "confirmed"
            ? "Confirmado"
            : item.status === "completed"
            ? "Completado"
            : "Cancelado",
        Personas: item.peopleCount,
        Ubicación: item.location || "",
        "Monto Cotizado": item.quotedAmount,
        Abono: item.deposit || 0,
        ...(showPorCobrar && { "Por Cobrar": porCobrar }),
        "Mi Ganancia": item.myProfit,
        "Pago Colaborador": item.collaboratorPayment,
        Colaborador: item.collaborator || "",
        Banco: item.bank || "",
        Comentarios: item.comments || "",
        Creado: item.createdAt
          ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: es })
          : "",
        Actualizado: item.updatedAt
          ? format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })
          : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda");
    XLSX.writeFile(wb, `agenda_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exportado exitosamente");
  };

  const handleImport = async (
    importedItems: Omit<
      AgendaItem,
      "id" | "userId" | "createdAt" | "updatedAt"
    >[]
  ) => {
    if (!user) return;

    try {
      for (const item of importedItems) {
        await addAgendaItem(user.uid, item);
      }
      toast.success(`${importedItems.length} citas importadas exitosamente`);
    } catch (error) {
      console.error("Error al importar:", error);
      throw error;
    }
  };

  const setThisMonth = () => {
    const now = new Date();
    setFilters((prev) => ({
      ...prev,
      dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
      dateTo: format(endOfMonth(now), "yyyy-MM-dd"),
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-1">
            {filteredItems.length} citas encontradas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />

          <button
            onClick={() => setIsFilterOpen(true)}
            className={`p-2 rounded-full transition-colors ${
              filters.searchTerm || filters.dateFrom || filters.status !== "all"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100 text-gray-500"
            }`}
            title="Filtros"
          >
            <Filter size={20} />
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nueva Cita</span>
          </button>

          <ActionMenu
            onImport={() => setIsImportOpen(true)}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === "calendar" ? (
        <div className="min-h-[600px]">
          <CalendarView
            items={filteredItems}
            onEventClick={(item) => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          {viewMode === "list" && (
            <AgendaTable
              items={filteredItems}
              onEdit={(item) => {
                setEditingItem(item);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onStatusChange={handleStatusChange}
            />
          )}

          {viewMode === "kanban" && (
            <KanbanView
              items={filteredItems}
              onStatusChange={handleStatusChange}
              onEventClick={(item) => {
                setEditingItem(item);
                setIsFormOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* Dialogs & Drawers */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onSetThisMonth={setThisMonth}
      />

      <AgendaForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdate : handleCreate}
        initialData={editingItem}
      />

      <ImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
