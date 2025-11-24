"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition, Combobox } from "@headlessui/react";
import { X, Check, ChevronsUpDown, Calendar } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeToClients } from "@/services/client";
import { subscribeToAgenda } from "@/services/agenda";
import { createInvoice, updateInvoice } from "@/services/invoice";
import { Client, AgendaItem, InvoiceItem, Invoice } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: Invoice | null;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  editingInvoice,
}: CreateInvoiceModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<AgendaItem[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientButtonRef = useRef<HTMLButtonElement>(null);

  const isEditMode = !!editingInvoice;

  useEffect(() => {
    if (!user) return;
    const unsubscribeClients = subscribeToClients(user.uid, setClients);
    const unsubscribeAgenda = subscribeToAgenda(user.uid, setAppointments);
    return () => {
      unsubscribeClients();
      unsubscribeAgenda();
    };
  }, [user]);

  // Initialize form with editing invoice data
  useEffect(() => {
    if (editingInvoice && clients.length > 0) {
      const client = clients.find((c) => c.id === editingInvoice.clientId);
      if (client) {
        setSelectedClient(client);
        // In edit mode, skip to step 2 since we already have the client
        setStep(2);
      }
    } else if (!editingInvoice) {
      // Reset form when creating new invoice
      setSelectedClient(null);
      setSelectedAppointments([]);
      setStep(1);
    }
  }, [editingInvoice, clients]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedClient(null);
      setSelectedAppointments([]);
    }
  }, [isOpen]);

  const filteredClients =
    clientQuery === ""
      ? clients
      : clients.filter((client) =>
          client.name.toLowerCase().includes(clientQuery.toLowerCase())
        );

  const clientAppointments = appointments.filter(
    (app) =>
      selectedClient &&
      (app.clientId === selectedClient.id || app.client === selectedClient.name)
  );

  const handleCreateInvoice = async () => {
    if (!user || !selectedClient) return;
    setIsSubmitting(true);

    try {
      if (isEditMode && editingInvoice) {
        // Update existing invoice
        const selectedApps = clientAppointments.filter((app) =>
          selectedAppointments.includes(app.id)
        );

        const items: InvoiceItem[] = selectedApps.map((app, index) => ({
          id: `item-${Date.now()}-${index}`,
          description: `${app.service} - ${format(new Date(app.date), "d MMM", {
            locale: es,
          })}`,
          quantity: 1,
          price: app.quotedAmount,
          total: app.quotedAmount,
          tax: 0,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = 0;
        const discount = editingInvoice.discount || 0;
        const total = subtotal + tax - discount;
        const balance = total - editingInvoice.amountPaid;

        await updateInvoice(user.uid, editingInvoice.id, {
          items,
          subtotal,
          tax,
          total,
          balance,
          notes: `Factura actualizada para ${selectedApps.length} citas.`,
        });

        toast.success("Factura actualizada exitosamente");
      } else {
        // Create new invoice
        const selectedApps = clientAppointments.filter((app) =>
          selectedAppointments.includes(app.id)
        );

        const items: InvoiceItem[] = selectedApps.map((app, index) => ({
          id: `item-${Date.now()}-${index}`,
          description: `${app.service} - ${format(new Date(app.date), "d MMM", {
            locale: es,
          })}`,
          quantity: 1,
          price: app.quotedAmount,
          total: app.quotedAmount,
          tax: 0,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const tax = 0;
        const discount = 0;
        const total = subtotal + tax - discount;

        await createInvoice(user.uid, {
          number: `INV-${Date.now().toString().slice(-6)}`,
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          clientEmail: selectedClient.email,
          clientAddress: selectedClient.address,
          date: Date.now(),
          dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          status: "pending",
          items,
          subtotal,
          tax,
          discount,
          total,
          amountPaid: 0,
          balance: total,
          paymentHistory: [],
          notes: `Factura generada para ${selectedApps.length} citas.`,
        });

        toast.success("Factura creada exitosamente");
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        isEditMode
          ? "Error al actualizar la factura"
          : "Error al crear la factura"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAppointment = (id: string) => {
    setSelectedAppointments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block z-10">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-bold leading-6 text-gray-900 mb-6"
                    >
                      {isEditMode ? "Editar Factura" : "Nueva Factura"}{" "}
                      {step === 1
                        ? "- Seleccionar Cliente"
                        : "- Seleccionar Citas"}
                    </Dialog.Title>

                    {step === 1 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cliente
                        </label>
                        <Combobox
                          value={selectedClient}
                          onChange={setSelectedClient}
                        >
                          {({ open }) => (
                            <div className="relative mt-1">
                              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                                <Combobox.Input
                                  className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                  displayValue={(client: Client) =>
                                    client?.name
                                  }
                                  onChange={(event) =>
                                    setClientQuery(event.target.value)
                                  }
                                  onClick={() => {
                                    if (!open) {
                                      clientButtonRef.current?.click();
                                    }
                                  }}
                                  placeholder="Buscar cliente..."
                                />
                                <Combobox.Button
                                  ref={clientButtonRef}
                                  className="absolute inset-y-0 right-0 flex items-center pr-2"
                                >
                                  <ChevronsUpDown
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                </Combobox.Button>
                              </div>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterLeave={() => setClientQuery("")}
                              >
                                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                                  {filteredClients.length === 0 &&
                                  clientQuery !== "" ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                      No se encontraron clientes.
                                    </div>
                                  ) : (
                                    filteredClients.map((client) => (
                                      <Combobox.Option
                                        key={client.id}
                                        className={({ active }) =>
                                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                            active
                                              ? "bg-blue-600 text-white"
                                              : "text-gray-900"
                                          }`
                                        }
                                        value={client}
                                      >
                                        {({ selected, active }) => (
                                          <>
                                            <span
                                              className={`block truncate ${
                                                selected
                                                  ? "font-medium"
                                                  : "font-normal"
                                              }`}
                                            >
                                              {client.name}
                                            </span>
                                            {selected ? (
                                              <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                  active
                                                    ? "text-white"
                                                    : "text-blue-600"
                                                }`}
                                              >
                                                <Check
                                                  className="h-5 w-5"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Combobox.Option>
                                    ))
                                  )}
                                </Combobox.Options>
                              </Transition>
                            </div>
                          )}
                        </Combobox>

                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            disabled={!selectedClient}
                            onClick={() => setStep(2)}
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-4">
                          Selecciona las citas que deseas incluir en esta
                          factura para <strong>{selectedClient?.name}</strong>.
                        </p>

                        {clientAppointments.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              No hay citas registradas para este cliente.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto border rounded-md divide-y divide-gray-200">
                            {clientAppointments.map((app) => (
                              <div
                                key={app.id}
                                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                  selectedAppointments.includes(app.id)
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                                onClick={() => toggleAppointment(app.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                                      selectedAppointments.includes(app.id)
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {selectedAppointments.includes(app.id) && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {app.service}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {format(
                                        new Date(app.date),
                                        "d MMM yyyy",
                                        { locale: es }
                                      )}{" "}
                                      - {app.time}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  ${app.quotedAmount}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-6 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                          >
                            Atrás
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateInvoice}
                            disabled={
                              isSubmitting || selectedAppointments.length === 0
                            }
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
                          >
                            {isSubmitting
                              ? isEditMode
                                ? "Actualizando..."
                                : "Creando..."
                              : isEditMode
                              ? "Actualizar Factura"
                              : "Crear Factura"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
