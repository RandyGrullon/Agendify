"use client";

import { useState, useEffect, useMemo } from "react";
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
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { Plus, Download, Upload, Calendar as CalendarIcon, DollarSign, Users, TrendingUp, Search, Filter, List, AlertCircle, Layout } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<AgendaItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<AgendaItem[]>([]);
    
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Only keep necessary state for metrics and basic list
    useEffect(() => {
        if (user) {
            const unsubscribe = subscribeToAgenda(user.uid, (data) => {
                setItems(data);
                // Sort by date descending for the list
                const sorted = [...data].sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateB - dateA;
                });
                setFilteredItems(sorted);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = items.length;
        const confirmed = items.filter(i => i.status === 'confirmed').length;
        const pending = items.filter(i => i.status === 'pending').length;
        const totalRevenue = items
            .filter(i => i.status === 'completed')
            .reduce((sum, i) => sum + i.quotedAmount, 0);
        const totalProfit = items
            .filter(i => i.status === 'completed')
            .reduce((sum, i) => sum + i.myProfit, 0);
        const uniqueClients = new Set(items.map(i => i.client)).size;
        
        const pendingPayment = items
            .filter(i => i.status === 'pending' || i.status === 'confirmed')
            .reduce((sum, i) => sum + (i.quotedAmount - (i.deposit || 0)), 0);

        return { total, confirmed, pending, totalRevenue, totalProfit, uniqueClients, pendingPayment };
    }, [items]);

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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-600 truncate" title="Total Citas">Total Citas</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2 truncate">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-600 truncate" title="Confirmadas">Confirmadas</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2 truncate">{stats.confirmed}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full flex-shrink-0">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-600 truncate" title="Clientes Únicos">Clientes Únicos</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2 truncate">{stats.uniqueClients}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full flex-shrink-0">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-600 truncate" title="Ganancia Total">Ganancia Total</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2 truncate" title={`$${stats.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}>
                                ${stats.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full flex-shrink-0">
                            <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 overflow-hidden transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-4">
                            <p className="text-sm font-medium text-gray-600 truncate" title="Por Cobrar">Por Cobrar</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2 truncate" title={`$${stats.pendingPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}>
                                ${stats.pendingPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <DashboardCharts items={items} />

            {/* Recent Appointments Preview */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
                    <a href="/appointments" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Ver todas
                    </a>
                </div>
                
                {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay citas registradas.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredItems.slice(0, 5).map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${
                                        item.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                        item.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        <CalendarIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.client}</p>
                                        <p className="text-sm text-gray-500">{item.service} • {item.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                        ${item.quotedAmount.toLocaleString('es-MX')}
                                    </p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {item.status === 'pending' ? 'Pendiente' : 
                                         item.status === 'confirmed' ? 'Confirmado' :
                                         item.status === 'completed' ? 'Completado' : 'Cancelado'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <a href="/appointments" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center">
                        Gestionar agenda completa
                    </a>
                </div>
            </div>

            {/* Dialogs */}
            <AgendaForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreate}
            />
        </div>
    );
}
