"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  subscribeToInvoices,
  deleteInvoice,
  updateInvoice,
} from "@/services/invoice";
import { Invoice } from "@/types";
import {
  Plus,
  FileText,
  Download,
  MoreVertical,
  Trash,
  Edit,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import CreateInvoiceModalAlias from "@/components/billing/CreateInvoiceModal";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { subscribeToSettings } from "@/services/settings";
import { BusinessSettings, PaymentRecord } from "@/types";
import { toast } from "sonner";

export default function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Invoice>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    if (!user) return;
    const unsubscribeInvoices = subscribeToInvoices(user.uid, (data) => {
      setInvoices(data);
      setIsLoading(false);
    });
    const unsubscribeSettings = subscribeToSettings(user.uid, setSettings);
    return () => {
      unsubscribeInvoices();
      unsubscribeSettings();
    };
  }, [user]);

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.number.toLowerCase().includes(query) ||
          inv.clientName.toLowerCase().includes(query) ||
          inv.clientEmail?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / pageSize);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleSort = (field: keyof Invoice) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!user) return;

    if (
      !confirm(
        `¿Eliminar la factura ${invoice.number}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await deleteInvoice(user.uid, invoice.id);
      toast.success("Factura eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Error al eliminar la factura");
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      generateInvoicePDF(invoice, settings);
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    }
  };

  const handleStatusChange = async (
    invoice: Invoice,
    newStatus: Invoice["status"]
  ) => {
    if (!user) return;

    try {
      const updates: Partial<Invoice> = {
        status: newStatus,
      };

      // If marking as paid, update payment info
      if (newStatus === "paid" && invoice.status !== "paid") {
        updates.paidAt = Date.now();
        updates.amountPaid = invoice.total;
        updates.balance = 0;
      }

      await updateInvoice(user.uid, invoice.id, updates);
      toast.success("Estado actualizado");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingInvoice(null);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentRecorded = async (payment: PaymentRecord) => {
    if (!user || !selectedInvoiceForPayment) return;

    const newAmountPaid = selectedInvoiceForPayment.amountPaid + payment.amount;
    const newBalance = selectedInvoiceForPayment.total - newAmountPaid;
    const newStatus =
      newBalance === 0 ? "paid" : selectedInvoiceForPayment.status;

    const updates: Partial<Invoice> = {
      amountPaid: newAmountPaid,
      balance: newBalance,
      status: newStatus as Invoice["status"],
      paymentHistory: [...selectedInvoiceForPayment.paymentHistory, payment],
    };

    if (newStatus === "paid") {
      updates.paidAt = Date.now();
    }

    await updateInvoice(user.uid, selectedInvoiceForPayment.id, updates);
  };

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = invoices
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + inv.balance, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20";
      case "pending":
        return "bg-amber-100 text-amber-800 ring-1 ring-amber-600/20";
      case "cancelled":
        return "bg-red-100 text-red-800 ring-1 ring-red-600/20";
      case "draft":
        return "bg-gray-100 text-gray-800 ring-1 ring-gray-600/20";
      default:
        return "bg-gray-100 text-gray-800 ring-1 ring-gray-600/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      case "draft":
        return "Borrador";
      default:
        return status;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <CreateInvoiceModalAlias
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        editingInvoice={editingInvoice}
      />
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        invoice={selectedInvoiceForPayment}
        onPaymentRecorded={handlePaymentRecorded}
      />
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
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Facturado
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ${totalBilled.toLocaleString("es-MX")}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Pendiente de Pago
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-600">
            ${totalPending.toLocaleString("es-MX")}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Cobrado
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
            ${totalPaid.toLocaleString("es-MX")}
          </dd>
        </div>
      </dl>

      {/* Search and Filters */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {paginatedInvoices.length} de{" "}
          {filteredAndSortedInvoices.length} facturas
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-8 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="mt-4">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden bg-white shadow-md rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="py-4 pl-6 pr-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort("number")}
                  >
                    <div className="flex items-center gap-1">
                      Folio
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort("clientName")}
                  >
                    <div className="flex items-center gap-1">
                      Cliente
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Fecha
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Estado
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th scope="col" className="relative py-4 pl-3 pr-6">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">
                        No hay facturas registradas.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Crea tu primera factura usando el botón de arriba.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="whitespace-nowrap py-4 pl-6 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {invoice.number}
                            </div>
                            <div className="text-xs text-gray-500">
                              {invoice.items.length} items
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.clientName}
                        </div>
                        {invoice.clientEmail && (
                          <div className="text-xs text-gray-500">
                            {invoice.clientEmail}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                        {format(invoice.date, "d MMM yyyy", { locale: es })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          $
                          {invoice.total.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        {invoice.amountPaid > 0 && invoice.balance > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            Pagado: $
                            {invoice.amountPaid.toLocaleString("es-MX")}
                          </div>
                        )}
                        {invoice.balance > 0 &&
                          invoice.status !== "cancelled" && (
                            <div className="text-xs text-orange-600">
                              Saldo: ${invoice.balance.toLocaleString("es-MX")}
                            </div>
                          )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right">
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <Menu.Button className="flex items-center rounded-full bg-white p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                            <span className="sr-only">Abrir opciones</span>
                            <MoreVertical
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
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
                                      onClick={() => handleEdit(invoice)}
                                      className={`${
                                        active
                                          ? "bg-blue-50 text-blue-700"
                                          : "text-gray-700"
                                      } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                    >
                                      <Edit
                                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500"
                                        aria-hidden="true"
                                      />
                                      Editar factura
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDownloadPDF(invoice)}
                                      className={`${
                                        active
                                          ? "bg-green-50 text-green-700"
                                          : "text-gray-700"
                                      } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                    >
                                      <Download
                                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-green-500"
                                        aria-hidden="true"
                                      />
                                      Descargar PDF
                                    </button>
                                  )}
                                </Menu.Item>
                                <div className="border-t border-gray-100 my-1"></div>
                                {invoice.balance > 0 &&
                                  invoice.status !== "cancelled" && (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleRecordPayment(invoice)
                                          }
                                          className={`${
                                            active
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                        >
                                          <DollarSign
                                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500"
                                            aria-hidden="true"
                                          />
                                          Registrar pago
                                        </button>
                                      )}
                                    </Menu.Item>
                                  )}
                                {invoice.status !== "paid" && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() =>
                                          handleStatusChange(invoice, "paid")
                                        }
                                        className={`${
                                          active
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "text-gray-700"
                                        } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                      >
                                        <Check
                                          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500"
                                          aria-hidden="true"
                                        />
                                        Marcar como pagada
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                {invoice.status !== "cancelled" && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() =>
                                          handleStatusChange(
                                            invoice,
                                            "cancelled"
                                          )
                                        }
                                        className={`${
                                          active
                                            ? "bg-orange-50 text-orange-700"
                                            : "text-gray-700"
                                        } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                      >
                                        <X
                                          className="mr-3 h-5 w-5 text-gray-400 group-hover:text-orange-500"
                                          aria-hidden="true"
                                        />
                                        Cancelar factura
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}
                                <div className="border-t border-gray-100 my-1"></div>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDelete(invoice)}
                                      className={`${
                                        active
                                          ? "bg-red-50 text-red-700"
                                          : "text-red-600"
                                      } group flex w-full items-center px-4 py-2.5 text-sm transition-colors`}
                                    >
                                      <Trash
                                        className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500"
                                        aria-hidden="true"
                                      />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando página{" "}
                    <span className="font-medium">{currentPage}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {paginatedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white shadow rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {invoice.number}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(invoice.date, "d MMM yyyy", { locale: es })}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.clientName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {invoice.items.length} items
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <div className="text-lg font-bold text-gray-900">
                    $
                    {invoice.total.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(invoice)}
                      className="p-2 text-gray-400 hover:text-green-600 bg-gray-50 rounded-full"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
