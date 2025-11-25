"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import { Dialog, Transition, Combobox, Tab } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AgendaItem, Client, Service } from "@/types";
import { X, Check, ChevronsUpDown, UserPlus, Plus } from "lucide-react";
import { subscribeToClients, createClient } from "@/services/client";
import { subscribeToServices } from "@/services/service";
import { useAuth } from "@/components/providers/AuthProvider";
import ClientForm from "./ClientForm";
import ServiceForm from "./ServiceForm";
import { toast } from "sonner";
import Link from "next/link";

const schema = z.object({
    date: z.string().min(1, "Fecha requerida").refine((date) => {
        // Compare dates as strings to avoid timezone issues
        const today = new Date().toISOString().split('T')[0];
        return date >= today;
    }, "La fecha no puede ser anterior a hoy"),
    time: z.string().min(1, "Hora requerida").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    client: z.string().min(1, "Cliente requerido"),
    collaborator: z.string().optional(),
    location: z.string().optional(),
    peopleCount: z.coerce.number().min(1, "Mínimo 1 persona").max(1000, "Número demasiado grande"),
    quotedAmount: z.number().min(0, "El monto no puede ser negativo"),
    deposit: z.number().min(0, "El abono no puede ser negativo").optional().or(z.nan()),
    service: z.string().min(1, "Servicio requerido"),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    myProfit: z.number().min(0, "La ganancia no puede ser negativa"),
    bank: z.string().optional(),
    collaboratorPayment: z.number().min(0, "El pago no puede ser negativo"),
    comments: z.string().max(500, "Comentarios muy largos (máx. 500 caracteres)").optional(),
});

type FormData = z.infer<typeof schema>;

interface AgendaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: AgendaItem | null;
}

export default function AgendaForm({ isOpen, onClose, onSubmit, initialData }: AgendaFormProps) {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [clientQuery, setClientQuery] = useState("");
    const [serviceQuery, setServiceQuery] = useState("");
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);
    const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);

    const clientButtonRef = useRef<HTMLButtonElement>(null);
    const serviceButtonRef = useRef<HTMLButtonElement>(null);

    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            status: 'pending',
            peopleCount: 1,
            quotedAmount: undefined,
            deposit: undefined,
            myProfit: undefined,
            collaboratorPayment: undefined,
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            client: '',
            service: '',
        }
    });

    const quotedAmount = watch('quotedAmount') || 0;
    const deposit = watch('deposit') || 0;
    const balance = Math.max(0, quotedAmount - deposit);

    // Subscribe to clients and services
    useEffect(() => {
        if (!user) return;

        const unsubscribeClients = subscribeToClients(user.uid, (updatedClients) => {
            setClients(updatedClients);
        });

        const unsubscribeServices = subscribeToServices(user.uid, (updatedServices) => {
            setServices(updatedServices);
        });

        return () => {
            unsubscribeClients();
            unsubscribeServices();
        };
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                Object.keys(initialData).forEach((key) => {
                    // @ts-ignore
                    setValue(key, initialData[key]);
                });

                // Find and set the client
                let client;
                if (initialData.clientId) {
                    client = clients.find(c => c.id === initialData.clientId);
                }
                if (!client) {
                    client = clients.find(c => c.name === initialData.client);
                }
                if (client) {
                    setSelectedClient(client);
                }

                // Find and set the service
                const service = services.find(s => s.name === initialData.service);
                if (service) {
                    setSelectedService(service);
                }
            } else {
                // Only reset if we are opening a fresh form, NOT if we are just receiving updates
                // Calculate today's date fresh each time to ensure it's always current
                const today = new Date().toISOString().split('T')[0];
                reset({
                    status: 'pending',
                    peopleCount: 1,
                    quotedAmount: undefined,
                    deposit: undefined,
                    myProfit: undefined,
                    collaboratorPayment: undefined,
                    date: today,
                    time: '09:00',
                    client: '',
                    service: '',
                });
                setSelectedClient(null);
                setSelectedService(null);
            }
        }
    }, [initialData, reset, setValue, isOpen]); // Removed clients and services from dependencies to prevent reset on list update

    // Separate effect to sync selected client/service when lists load (only for editing)
    useEffect(() => {
        if (initialData && isOpen) {
            if (!selectedClient && clients.length > 0) {
                let client;
                if (initialData.clientId) {
                    client = clients.find(c => c.id === initialData.clientId);
                }
                if (!client) {
                    client = clients.find(c => c.name === initialData.client);
                }
                if (client) setSelectedClient(client);
            }

            if (!selectedService && services.length > 0) {
                const service = services.find(s => s.name === initialData.service);
                if (service) setSelectedService(service);
            }
        }
    }, [clients, services, initialData, isOpen, selectedClient, selectedService]);

    const filteredClients = clientQuery === ""
        ? clients
        : clients.filter((client) => {
            return client.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
                client.email?.toLowerCase().includes(clientQuery.toLowerCase()) ||
                client.phone?.includes(clientQuery);
        });

    const filteredServices = serviceQuery === ""
        ? services
        : services.filter((service) => {
            return service.name.toLowerCase().includes(serviceQuery.toLowerCase());
        });

    const handleCreateClient = async (clientData: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user) return;

        try {
            // Create the client in Firestore
            const docRef = await createClient(user.uid, clientData);

            // Construct the full client object optimistically
            const newClient: Client = {
                ...clientData,
                id: docRef.id,
                userId: user.uid,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            toast.success('Cliente creado exitosamente');

            // Immediately select the new client without waiting for subscription
            setSelectedClient(newClient);
            setValue('client', newClient.name);
            setIsClientFormOpen(false);

        } catch (error) {
            console.error('Error al crear cliente:', error);
            toast.error('Error al crear cliente');
        }
    };

    const handleCreateService = (service: Service) => {
        // Immediately select the new service
        setSelectedService(service);
        setValue('service', service.name);
        setValue('quotedAmount', service.price);
        setValue('myProfit', service.price);
        setIsServiceFormOpen(false);
        toast.success('Servicio creado y seleccionado');
    };

    const handleFormSubmit = (data: FormData) => {
        const enhancedData = {
            ...data,
            clientId: selectedClient?.id,
            // We could also save serviceId if we wanted to link services strictly
            // serviceId: selectedService?.id 
        };
        onSubmit(enhancedData);
    };

    return (
        <>
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
                        <div className="flex min-h-full items-end justify-center text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative flex flex-col w-full h-full sm:h-auto transform overflow-hidden sm:rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                    {/* Header - Sticky en mobile */}
                                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between">
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                            {initialData ? 'Editar Cita' : 'Nueva Cita'}
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none p-1 hover:bg-gray-100 transition-colors"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    {/* Content - Scrollable */}
                                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                                        <div className="w-full">
                                            <form id="appointment-form" onSubmit={handleSubmit(handleFormSubmit)}>
                                                <Tab.Group>
                                                    <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1 mb-6">
                                                        <Tab
                                                            className={({ selected }) =>
                                                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                                                                ${selected
                                                                    ? 'bg-white text-blue-700 shadow'
                                                                    : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                                                                }`
                                                            }
                                                        >
                                                            Información de la Cita
                                                        </Tab>
                                                        <Tab
                                                            className={({ selected }) =>
                                                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                                                                ${selected
                                                                    ? 'bg-white text-blue-700 shadow'
                                                                    : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                                                                }`
                                                            }
                                                        >
                                                            Información de Pago
                                                        </Tab>
                                                    </Tab.List>
                                                    <Tab.Panels>
                                                        {/* Tab 1: Información de la Cita */}
                                                        <Tab.Panel className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-4">
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                                    Fecha <span className="text-red-500">*</span>
                                                                </label>
                                                                <input {...register("date")} type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900" />
                                                                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                                                            </div>
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                                    Hora <span className="text-red-500">*</span>
                                                                </label>
                                                                <input {...register("time")} type="time" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900" />
                                                                {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
                                                            </div>

                                                            {/* Cliente y Personas en la misma línea */}
                                                            <div className="sm:col-span-3">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                                    Cliente <span className="text-red-500">*</span>
                                                                </label>
                                                                <Controller
                                                                    name="client"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Combobox
                                                                            value={selectedClient}
                                                                            onChange={(client) => {
                                                                                setSelectedClient(client);
                                                                                field.onChange(client?.name || '');
                                                                            }}
                                                                        >
                                                                            {({ open }) => (
                                                                                <div className="relative">
                                                                                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                                                                                        <Combobox.Input
                                                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                                                            displayValue={(client: Client | null) => client?.name || ''}
                                                                                            onChange={(event) => setClientQuery(event.target.value)}
                                                                                            onClick={() => !open && clientButtonRef.current?.click()}
                                                                                            placeholder="Selecciona o busca un cliente"
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
                                                                                        afterLeave={() => setClientQuery('')}
                                                                                    >
                                                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setIsClientFormOpen(true)}
                                                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                                                                            >
                                                                                                <UserPlus size={16} />
                                                                                                Crear nuevo cliente
                                                                                            </button>
                                                                                            {filteredClients.length === 0 && clientQuery !== '' ? (
                                                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                                                    No se encontraron clientes.
                                                                                                </div>
                                                                                            ) : (
                                                                                                filteredClients.map((client) => (
                                                                                                    <Combobox.Option
                                                                                                        key={client.id}
                                                                                                        className={({ active }) =>
                                                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                                                                            }`
                                                                                                        }
                                                                                                        value={client}
                                                                                                    >
                                                                                                        {({ selected, active }) => (
                                                                                                            <>
                                                                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                                                                    {client.name}
                                                                                                                </span>
                                                                                                                {client.phone && (
                                                                                                                    <span className={`block text-xs ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                                                                                                                        {client.phone}
                                                                                                                    </span>
                                                                                                                )}
                                                                                                                {selected ? (
                                                                                                                    <span
                                                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                                                                                                            }`}
                                                                                                                    >
                                                                                                                        <Check className="h-5 w-5" aria-hidden="true" />
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
                                                                    )}
                                                                />
                                                                {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-1">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                                    Personas <span className="text-red-500">*</span>
                                                                </label>
                                                                <input {...register("peopleCount")} type="number" min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900" />
                                                                {errors.peopleCount && <p className="text-red-500 text-xs mt-1">{errors.peopleCount.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-4">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                                    Servicio <span className="text-red-500">*</span>
                                                                </label>
                                                                <Controller
                                                                    name="service"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Combobox
                                                                            value={selectedService}
                                                                            onChange={(service) => {
                                                                                setSelectedService(service);
                                                                                field.onChange(service?.name || '');
                                                                            }}
                                                                        >
                                                                            {({ open }) => (
                                                                                <div className="relative">
                                                                                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                                                                                        <Combobox.Input
                                                                                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 placeholder:text-gray-500"
                                                                                            displayValue={(service: Service | null) => service?.name || field.value}
                                                                                            onChange={(event) => {
                                                                                                setServiceQuery(event.target.value);
                                                                                                field.onChange(event.target.value);
                                                                                            }}
                                                                                            onClick={() => !open && serviceButtonRef.current?.click()}
                                                                                            placeholder="Selecciona o escribe un servicio"
                                                                                        />
                                                                                        <Combobox.Button
                                                                                            ref={serviceButtonRef}
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
                                                                                        afterLeave={() => setServiceQuery('')}
                                                                                    >
                                                                                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setIsServiceFormOpen(true)}
                                                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                                                                            >
                                                                                                <Plus size={16} />
                                                                                                Crear nuevo servicio
                                                                                            </button>
                                                                                            {filteredServices.length === 0 && serviceQuery !== '' ? (
                                                                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                                                                    No se encontraron servicios.
                                                                                                </div>
                                                                                            ) : (
                                                                                                filteredServices.map((service) => (
                                                                                                    <Combobox.Option
                                                                                                        key={service.id}
                                                                                                        className={({ active }) =>
                                                                                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                                                                            }`
                                                                                                        }
                                                                                                        value={service}
                                                                                                    >
                                                                                                        {({ selected, active }) => (
                                                                                                            <>
                                                                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                                                                    {service.name}
                                                                                                                </span>
                                                                                                                <span className={`block text-xs ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                                                                                                                    ${service.price} - {service.duration} min
                                                                                                                </span>
                                                                                                                {selected ? (
                                                                                                                    <span
                                                                                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                                                                                                            }`}
                                                                                                                    >
                                                                                                                        <Check className="h-5 w-5" aria-hidden="true" />
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
                                                                    )}
                                                                />
                                                                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service.message}</p>}
                                                            </div>

                                                            {/* Estatus y Colaborador en la misma línea */}
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Estatus</label>
                                                                <select {...register("status")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900">
                                                                    <option value="pending">Pendiente</option>
                                                                    <option value="confirmed">Confirmado</option>
                                                                    <option value="completed">Completado</option>
                                                                    <option value="cancelled">Cancelado</option>
                                                                </select>
                                                            </div>

                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Colaborador</label>
                                                                <input {...register("collaborator")} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900 placeholder:text-gray-500" placeholder="Nombre del colaborador" />
                                                            </div>

                                                            {/* Ubicación en toda la línea */}
                                                            <div className="sm:col-span-4">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Ubicación</label>
                                                                <input {...register("location")} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900 placeholder:text-gray-500" placeholder="Dirección del evento" />
                                                            </div>

                                                            {/* Comentarios compartidos */}
                                                            <div className="sm:col-span-4">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Comentarios</label>
                                                                <textarea {...register("comments")} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 resize-none text-gray-900 placeholder:text-gray-500" placeholder="Notas adicionales sobre la cita..." />
                                                                {errors.comments && <p className="text-red-500 text-xs mt-1">{errors.comments.message}</p>}
                                                            </div>
                                                        </Tab.Panel>

                                                        {/* Tab 2: Información de Pago */}
                                                        <Tab.Panel className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                                                            <div className="sm:col-span-1">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Monto Cotizado</label>
                                                                <div className="relative">
                                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</span>
                                                                    <input {...register("quotedAmount", { valueAsNumber: true })} type="number" min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pl-7 text-gray-900 placeholder:text-gray-400" placeholder="Ingrese monto" />
                                                                </div>
                                                                {errors.quotedAmount && <p className="text-red-500 text-xs mt-1">{errors.quotedAmount.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-1">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Abono / Seña</label>
                                                                <div className="relative">
                                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 z-10">$</span>
                                                                    <input {...register("deposit", { valueAsNumber: true })} type="number" min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pl-7 pr-28 text-gray-900 placeholder:text-gray-400" placeholder="Ingrese abono" />
                                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                        <span className={`text-xs font-medium ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                            Restan: ${balance.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {errors.deposit && <p className="text-red-500 text-xs mt-1">{errors.deposit.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-1">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Mi Ganancia</label>
                                                                <div className="relative">
                                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</span>
                                                                    <input {...register("myProfit", { valueAsNumber: true })} type="number" min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pl-7 text-gray-900 placeholder:text-gray-400" placeholder="Ingrese ganancia" />
                                                                </div>
                                                                {errors.myProfit && <p className="text-red-500 text-xs mt-1">{errors.myProfit.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-1">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Pago a Colaborador</label>
                                                                <div className="relative">
                                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</span>
                                                                    <input {...register("collaboratorPayment", { valueAsNumber: true })} type="number" min="0" step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pl-7 text-gray-900 placeholder:text-gray-400" placeholder="Ingrese pago" />
                                                                </div>
                                                                {errors.collaboratorPayment && <p className="text-red-500 text-xs mt-1">{errors.collaboratorPayment.message}</p>}
                                                            </div>

                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Banco</label>
                                                                <input {...register("bank")} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900 placeholder:text-gray-500" placeholder="Banco de pago" />
                                                            </div>

                                                            {/* Comentarios compartidos */}
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-sm font-semibold text-gray-900 mb-1">Comentarios</label>
                                                                <textarea {...register("comments")} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 resize-none text-gray-900 placeholder:text-gray-500" placeholder="Notas adicionales sobre la cita..." />
                                                                {errors.comments && <p className="text-red-500 text-xs mt-1">{errors.comments.message}</p>}
                                                            </div>
                                                        </Tab.Panel>
                                                    </Tab.Panels>
                                                </Tab.Group>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Footer - Sticky en mobile, visible en desktop */}
                                    <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
                                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                                                onClick={onClose}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                form="appointment-form"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2.5 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors sm:text-sm"
                                            >
                                                {initialData ? 'Actualizar' : 'Crear Cita'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            <ClientForm
                isOpen={isClientFormOpen}
                onClose={() => setIsClientFormOpen(false)}
                onSubmit={handleCreateClient}
                title="Crear Cliente"
                initialName={clientQuery}
            />

            <ServiceForm
                isOpen={isServiceFormOpen}
                onClose={() => setIsServiceFormOpen(false)}
                onSuccess={handleCreateService}
                initialName={serviceQuery}
            />
        </>
    );
}
