"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeToAgenda, addAgendaItem, updateAgendaItem, deleteAgendaItem } from "@/services/agenda";
import { getBusinessSettings } from "@/services/settings";
import { generateReceipt } from "@/lib/pdfGenerator";
import { AgendaItem } from "@/types";
import AgendaTable from "@/components/dashboard/AgendaTable";
import AgendaForm from "@/components/dashboard/AgendaForm";
import ImportDialog from "@/components/dashboard/ImportDialog";
import CalendarView from "@/components/dashboard/CalendarView";
import KanbanView from "@/components/dashboard/KanbanView";
import { Plus, Download, Upload, Calendar as CalendarIcon, Search, Filter, List, Layout } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<AgendaItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<AgendaItem[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban'>('list');

    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAgenda(user.uid, (data) => {
                setItems(data);
                setFilteredItems(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        let filtered = items.filter(item =>
            item.client.toLowerCase().includes(lowerTerm) ||
            item.service.toLowerCase().includes(lowerTerm) ||
            item.status.toLowerCase().includes(lowerTerm)
        );

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // Date range filter
        if (dateFrom && dateTo) {
            filtered = filtered.filter(item => {
                try {
                    if (!item.date) return false;
                    
                    let dateStr: string;
                    
                    // Handle Excel serial dates
                    if (typeof item.date === 'number') {
                        const excelEpoch = new Date(1899, 11, 30);
                        const tempDate = new Date(excelEpoch.getTime() + item.date * 86400000);
                        dateStr = tempDate.toISOString().split('T')[0];
                    } else {
                        dateStr = item.date.includes('T') ? item.date.split('T')[0] : item.date;
                    }
                    
                    const itemDate = new Date(dateStr + 'T00:00:00');
                    
                    if (isNaN(itemDate.getTime())) return false;
                    
                    return isWithinInterval(itemDate, {
                        start: new Date(dateFrom),
                        end: new Date(dateTo)
                    });
                } catch {
                    return false;
                }
            });
        }

        setFilteredItems(filtered);
    }, [searchTerm, items, statusFilter, dateFrom, dateTo]);

    const handleCreate = async (data: any) => {
        if (!user) return;
        try {
            await addAgendaItem(user.uid, data);
            setIsFormOpen(false);
            toast.success("Cita creada");
        } catch (error) {
            toast.error("Error al crear cita");
        }
    };

    const handleUpdate = async (data: any) => {
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

    const handleDelete = async (item: AgendaItem) => {
        if (!user || !confirm("¿Estás seguro de eliminar esta cita?")) return;
        try {
            await deleteAgendaItem(user.uid, item.id);
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

    const handleStatusChange = async (itemId: string, newStatus: AgendaItem['status']) => {
        if (!user) return;
        try {
            await updateAgendaItem(user.uid, itemId, { status: newStatus });
            toast.success("Estado actualizado");
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    const handleDownloadReceipt = async (item: AgendaItem) => {
        if (!user) return;
        try {
            const settings = await getBusinessSettings(user.uid);
            generateReceipt(item, settings);
            toast.success("Recibo generado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar recibo");
        }
    };

    const handleExport = () => {
        // Format data for export
        const exportData = filteredItems.map(item => {
            const porCobrar = item.quotedAmount - (item.deposit || 0);
            const showPorCobrar = porCobrar > 0 && (item.status === 'pending' || item.status === 'confirmed');
            return {
                'Fecha': item.date,
                'Hora': item.time,
                'Cliente': item.client,
                'Servicio': item.service,
                'Estado': item.status === 'pending' ? 'Pendiente' : 
                         item.status === 'confirmed' ? 'Confirmado' :
                         item.status === 'completed' ? 'Completado' : 'Cancelado',
                'Personas': item.peopleCount,
                'Ubicación': item.location || '',
                'Monto Cotizado': item.quotedAmount,
                'Abono': item.deposit || 0,
                ...(showPorCobrar && { 'Por Cobrar': porCobrar }),
                'Mi Ganancia': item.myProfit,
                'Pago Colaborador': item.collaboratorPayment,
                'Colaborador': item.collaborator || '',
                'Banco': item.bank || '',
                'Comentarios': item.comments || '',
                'Creado': item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : '',
                'Actualizado': item.updatedAt ? format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: es }) : '',
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Agenda");
        XLSX.writeFile(wb, `agenda_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
        toast.success("Exportado exitosamente");
    };

    const handleImport = async (importedItems: Omit<AgendaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => {
        if (!user) return;
        
        try {
            for (const item of importedItems) {
                await addAgendaItem(user.uid, item);
            }
            toast.success(`${importedItems.length} citas importadas exitosamente`);
        } catch (error) {
            console.error('Error al importar:', error);
            throw error;
        }
    };

    const setThisMonth = () => {
        const now = new Date();
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Agenda de Citas</h1>
                <p className="text-gray-600">Gestiona, filtra y organiza todas tus citas</p>
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col gap-4">
                    {/* Search and Primary Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente, servicio o estado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            />
                        </div>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Nueva Cita
                        </button>
                    </div>

                    {/* Filters and Secondary Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vista de Lista"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vista de Calendario"
                            >
                                <CalendarIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Vista Kanban"
                            >
                                <Layout size={18} />
                            </button>
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                        
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => setIsImportOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Upload size={18} />
                                Importar
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Download size={18} />
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    <Filter size={18} className="text-gray-500" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Desde"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Hasta"
                    />
                    <button
                        onClick={setThisMonth}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
                    >
                        Este mes
                    </button>
                    {(dateFrom || dateTo || statusFilter !== "all" || searchTerm) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Mostrando <span className="font-semibold">{filteredItems.length}</span> de <span className="font-semibold">{items.length}</span> citas
            </div>

            {/* Content */}
            {viewMode === 'list' && (
                <AgendaTable
                    items={filteredItems}
                    onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownloadReceipt={handleDownloadReceipt}
                    onStatusChange={handleStatusChange}
                />
            )}
            
            {viewMode === 'calendar' && (
                <CalendarView
                    items={filteredItems}
                    onEventClick={(item) => { setEditingItem(item); setIsFormOpen(true); }}
                    onStatusChange={handleStatusChange}
                />
            )}

            {viewMode === 'kanban' && (
                <KanbanView
                    items={filteredItems}
                    onStatusChange={handleStatusChange}
                    onEventClick={(item) => { setEditingItem(item); setIsFormOpen(true); }}
                />
            )}

            {/* Dialogs */}
            <AgendaForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
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
