"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeToInvoices } from "@/services/invoice";
import { Invoice } from "@/types";
import { Plus, FileText, Download, MoreVertical, Trash, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import CreateInvoiceModal from "@/components/billing/CreateInvoiceModal";

export default function BillingPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToInvoices(user.uid, (data) => {
            setInvoices(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPending = invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'draft')
        .reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20';
            case 'pending': return 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20';
            case 'cancelled': return 'bg-red-100 text-red-800 ring-1 ring-red-600/20';
            case 'draft': return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
            default: return 'bg-gray-100 text-gray-800 ring-1 ring-gray-600/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Pagada';
            case 'pending': return 'Pendiente';
            case 'cancelled': return 'Cancelada';
            case 'draft': return 'Borrador';
            default: return status;
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Facturación</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Gestiona tus facturas, recibos y pagos.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <Plus className="inline-block w-4 h-4 mr-1" />
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Stats */}
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Total Facturado</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">${totalBilled.toLocaleString('es-MX')}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Pendiente de Pago</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">${totalPending.toLocaleString('es-MX')}</dd>
                </div>
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Cobrado</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">${totalPaid.toLocaleString('es-MX')}</dd>
                </div>
            </dl>

            {/* Table */}
            <div className="mt-8">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Folio
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th scope="col" className="px-3 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Total
                                </th>
                                <th scope="col" className="relative py-4 pl-3 pr-6">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <FileText className="mx-auto h-12 w-12 text-gray-300" />
                                        <p className="mt-2 text-sm text-gray-500">No hay facturas registradas.</p>
                                        <p className="text-xs text-gray-400 mt-1">Crea tu primera factura usando el botón de arriba.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-blue-50/50 transition-colors duration-150">
                                        <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-100">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-semibold text-gray-900">{invoice.number}</div>
                                                    <div className="text-xs text-gray-500">{invoice.items.length} items</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4">
                                            <div className="text-sm font-medium text-gray-900">{invoice.clientName}</div>
                                            {invoice.clientEmail && (
                                                <div className="text-xs text-gray-500">{invoice.clientEmail}</div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                                            {format(invoice.date, "d MMM yyyy", { locale: es })}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                ${invoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </div>
                                            {invoice.tax > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    + ${invoice.tax.toLocaleString('es-MX')} IVA
                                                </div>
                                            )}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <Menu.Button className="flex items-center rounded-full bg-white p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                                    <span className="sr-only">Abrir opciones</span>
                                                    <MoreVertical className="h-5 w-5" aria-hidden="true" />
                                                </Menu.Button>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="py-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                                                    >
                                                                        <Edit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500" aria-hidden="true" />
                                                                        Editar factura
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        className={`${active ? 'bg-green-50 text-green-700' : 'text-gray-700'} group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                                                    >
                                                                        <Download className="mr-3 h-5 w-5 text-gray-400 group-hover:text-green-500" aria-hidden="true" />
                                                                        Descargar PDF
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <div className="border-t border-gray-100 my-1"></div>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600'} group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                                                    >
                                                                        <Trash className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" aria-hidden="true" />
                                                                        Eliminar factura
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {invoices.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No hay facturas registradas.</p>
                        </div>
                    ) : (
                        invoices.map((invoice) => (
                            <div key={invoice.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-100">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-gray-900">{invoice.number}</div>
                                                <div className="text-xs text-gray-500">{format(invoice.date, "d MMM yyyy", { locale: es })}</div>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                            {getStatusLabel(invoice.status)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Cliente</p>
                                            <p className="text-sm font-medium text-gray-900">{invoice.clientName}</p>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-gray-500">Total</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ${invoice.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">{invoice.items.length} items</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Edit className="h-4 w-4" />
                                            Editar
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                            <Download className="h-4 w-4" />
                                            PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <CreateInvoiceModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
}
