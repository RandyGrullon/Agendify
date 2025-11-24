"use client";

import { useState, useEffect } from "react";
import { AgendaItem } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trash, Copy, MapPin, Users as UsersIcon, DollarSign, FileText, Clock, Calendar } from "lucide-react";

interface AgendaTableProps {
    items: AgendaItem[];
    onEdit: (item: AgendaItem) => void;
    onDelete: (item: AgendaItem) => void;
    onDuplicate: (item: AgendaItem) => void;
    onDownloadReceipt: (item: AgendaItem) => void;
    onStatusChange?: (itemId: string, newStatus: AgendaItem['status']) => void;
}

const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
    confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmado' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completado' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
};

export default function AgendaTable({ items, onEdit, onDelete, onDuplicate, onDownloadReceipt, onStatusChange }: AgendaTableProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No hay citas registradas</p>
                <p className="text-gray-400 text-sm mt-2">Crea tu primera cita para comenzar</p>
            </div>
        );
    }

    // Mobile Card View
    if (isMobile) {
        return (
            <div className="space-y-4">
                {items.map((item) => {
                    const status = statusConfig[item.status];
                    return (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{item.client}</h3>
                                        <p className="text-sm text-gray-600 truncate">{item.service}</p>
                                    </div>
                                    {onStatusChange ? (
                                        <select
                                            value={item.status}
                                            onChange={(e) => onStatusChange(item.id, e.target.value as AgendaItem['status'])}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${status.bg} ${status.text}`}
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="confirmed">Confirmado</option>
                                            <option value="completed">Completado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-4 py-3 space-y-3">
                                {/* Date and Time */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>{format(new Date(item.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Clock size={16} className="text-gray-400" />
                                        <span>{item.time}</span>
                                    </div>
                                </div>

                                {/* Details */}
                                {(item.location || item.peopleCount > 0 || item.collaborator) && (
                                    <div className="space-y-1.5">
                                        {item.location && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-1">{item.location}</span>
                                            </div>
                                        )}
                                        {item.peopleCount > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <UsersIcon size={14} className="text-gray-400" />
                                                <span>{item.peopleCount} personas</span>
                                            </div>
                                        )}
                                        {item.collaborator && (
                                            <div className="text-sm text-gray-600">
                                                Colaborador: {item.collaborator}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Financial */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Total:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            ${item.quotedAmount.toLocaleString('es-MX')}
                                        </span>
                                    </div>
                                    {(item.deposit || 0) > 0 && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Abonado:</span>
                                                <span className="text-sm text-green-600">
                                                    ${(item.deposit || 0).toLocaleString('es-MX')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Resta:</span>
                                                <span className="text-sm font-semibold text-red-600">
                                                    ${(item.quotedAmount - (item.deposit || 0)).toLocaleString('es-MX')}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                                        <span className="text-sm text-gray-600">Ganancia:</span>
                                        <span className="text-sm font-semibold text-green-600">
                                            ${item.myProfit.toLocaleString('es-MX')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    onClick={() => onDownloadReceipt(item)}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                                    title="Recibo"
                                >
                                    <FileText size={18} />
                                </button>
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => onDuplicate(item)}
                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Duplicar"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(item)}
                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Desktop Table View
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha y Hora
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente y Servicio
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detalles
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Financiero
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => {
                            const status = statusConfig[item.status];
                            return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {format(new Date(item.date + 'T00:00:00'), "d MMM yyyy", { locale: es })}
                                        </div>
                                        <div className="text-sm text-gray-500">{item.time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{item.client}</div>
                                        <div className="text-sm text-gray-500">{item.service}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {item.location && (
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <MapPin size={14} className="mr-1 text-gray-400" />
                                                    <span className="truncate max-w-xs">{item.location}</span>
                                                </div>
                                            )}
                                            {item.peopleCount > 0 && (
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <UsersIcon size={14} className="mr-1 text-gray-400" />
                                                    {item.peopleCount} personas
                                                </div>
                                            )}
                                            {item.collaborator && (
                                                <div className="text-xs text-gray-500">
                                                    Colaborador: {item.collaborator}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {onStatusChange ? (
                                            <select
                                                value={item.status}
                                                onChange={(e) => onStatusChange(item.id, e.target.value as AgendaItem['status'])}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${status.bg} ${status.text}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="pending">Pendiente</option>
                                                <option value="confirmed">Confirmado</option>
                                                <option value="completed">Completado</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                ${item.quotedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                            {(item.deposit || 0) > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Abonado: ${(item.deposit || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                            {(item.quotedAmount - (item.deposit || 0)) > 0 && (
                                                <div className="text-xs font-medium text-red-600">
                                                    Resta: ${(item.quotedAmount - (item.deposit || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                            <div className="flex items-center text-xs text-green-600 pt-1 border-t border-gray-100 mt-1">
                                                <DollarSign size={12} className="mr-0.5" />
                                                Ganancia: ${item.myProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onDownloadReceipt(item)}
                                                className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-100 rounded"
                                                title="Descargar Recibo"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDuplicate(item)}
                                                className="text-green-600 hover:text-green-900 transition-colors p-1 hover:bg-green-50 rounded"
                                                title="Duplicar"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                                                title="Eliminar"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
