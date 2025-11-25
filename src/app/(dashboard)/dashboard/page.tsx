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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-8">
                {/* Total Citas Card */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                <CalendarIcon className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Citas</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                </div>

                {/* Confirmadas Card */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 bg-green-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Confirmadas</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.confirmed}</p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-green-500 to-green-400"></div>
                </div>

                {/* Clientes Únicos Card */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 bg-purple-50 rounded-lg">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Clientes Únicos</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.uniqueClients}</p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
                </div>

                {/* Ganancia Total Card */}
                <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2.5 bg-yellow-50 rounded-lg">
                                <DollarSign className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Ganancia Total</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words" title={`$${stats.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}>
                                ${stats.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
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
                            <p className="text-sm font-medium text-gray-600 mb-1">Por Cobrar</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words" title={`$${stats.pendingPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}>
                                ${stats.pendingPayment.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-red-500 to-red-400"></div>
                </div>
            </div>

            {/* Charts Section */}
            <DashboardCharts items={items} />

            {/* Recent Appointments Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Próximas Citas</h2>
                    <a href="/appointments" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
                        Ver todas
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
                
                {filteredItems.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <CalendarIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No hay citas registradas</p>
                        <p className="text-gray-400 text-sm mt-1">Comienza creando tu primera cita</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredItems.slice(0, 5).map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    {/* Left side - Client info */}
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                                            item.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                            item.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            <CalendarIcon size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 truncate">{item.client}</p>
                                            <p className="text-sm text-gray-600 truncate">{item.service}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(item.date).toLocaleDateString('es-MX', { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })} • {item.time}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Right side - Amount and status */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-11 sm:pl-0">
                                        <p className="font-bold text-gray-900 text-lg">
                                            ${item.quotedAmount.toLocaleString('es-MX')}
                                        </p>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
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
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <a href="/appointments" className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-1 transition-colors">
                        Gestionar agenda completa
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
