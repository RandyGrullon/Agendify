"use client";

import { Fragment, useEffect, useState, useRef } from "react";
import { Dialog, Transition, Combobox, Tab } from "@headlessui/react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AgendaItem,
  Client,
  CatalogItem,
  CollaboratorPayment,
  ReminderConfig,
} from "@/types";
import {
  X,
  Check,
  ChevronsUpDown,
  UserPlus,
  Plus,
  Trash2,
  Clock,
  Bell,
} from "lucide-react";
import { subscribeToClients, createClient } from "@/services/client";
import { subscribeToCatalog } from "@/services/catalog";
import { subscribeToCollaborators } from "@/services/collaborator";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Collaborator } from "@/types";
import ClientForm from "./ClientForm";
import CatalogItemForm from "./CatalogItemForm";
import CollaboratorForm from "./CollaboratorForm";
import TimePicker from "./TimePicker";
import { toast } from "sonner";
import Link from "next/link";
import type { FieldErrors } from "react-hook-form";

const schema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  time: z.string().optional(), // Deprecated, kept for backward compatibility
  startTime: z
    .string()
    .min(1, "Hora de inicio requerida")
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Formato de hora inválido (HH:MM)"
    ),
  endTime: z
    .string()
    .min(1, "Hora final requerida")
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Formato de hora inválido (HH:MM)"
    ),
  duration: z.coerce.number().optional(),
  client: z.string().min(1, "Cliente requerido"),
  location: z.string().optional(),
  peopleCount: z.coerce
    .number()
    .min(1, "Mínimo 1 persona")
    .max(1000, "Número demasiado grande"),
  quotedAmount: z.number().min(0, "El monto no puede ser negativo"),
  deposit: z
    .number()
    .min(0, "El abono no puede ser negativo")
    .optional()
    .or(z.nan()),
  service: z.string().min(1, "Servicio requerido"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  bank: z.string().optional(),
  comments: z
    .string()
    .max(500, "Comentarios muy largos (máx. 500 caracteres)")
    .optional(),
});

type FormData = z.infer<typeof schema>;

interface AgendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<AgendaItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => void;
  initialData?: AgendaItem | null;
}

export default function AgendaForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AgendaFormProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [savedCollaborators, setSavedCollaborators] = useState<Collaborator[]>(
    []
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(
    null
  );
  const [clientQuery, setClientQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [collaboratorQuery, setCollaboratorQuery] = useState("");
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isCollaboratorFormOpen, setIsCollaboratorFormOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  // Refs para los campos del formulario
  const dateInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const peopleCountInputRef = useRef<HTMLInputElement>(null);
  const serviceInputRef = useRef<HTMLInputElement>(null);
  const quotedAmountInputRef = useRef<HTMLInputElement>(null);

  // Common time slots
  const timeOptions = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
  ];
  // Allow amount to be string for input handling
  const [collaborators, setCollaborators] = useState<
    (Omit<CollaboratorPayment, "amount"> & { amount: number | string })[]
  >([]);

  const [reminders, setReminders] = useState<ReminderConfig[]>([
    { id: "1", type: "days", value: 1, enabled: true },
  ]);

  const clientButtonRef = useRef<HTMLButtonElement>(null);
  const serviceButtonRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      status: "pending",
      peopleCount: 1,
      quotedAmount: undefined,
      deposit: undefined,
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      time: "09:00", // backward compatibility
      client: "",
      service: "",
    },
  });

  // Función para manejar errores de validación y navegar al campo con error
  const handleValidationError = (errors: FieldErrors<FormData>) => {
    // Campos del Tab 1 (Información de la Cita)
    const tab1Fields = [
      "date",
      "startTime",
      "endTime",
      "client",
      "peopleCount",
      "service",
      "status",
      "location",
      "comments",
    ];

    // Campos del Tab 2 (Información de Pago)
    const tab2Fields = ["quotedAmount", "deposit", "bank"];

    // Verificar si hay errores en el Tab 1
    const hasTab1Error = tab1Fields.some(
      (field) => errors[field as keyof FormData]
    );

    // Verificar si hay errores en el Tab 2
    const hasTab2Error = tab2Fields.some(
      (field) => errors[field as keyof FormData]
    );

    // Encontrar el primer campo con error
    const firstErrorField = Object.keys(errors)[0] as keyof FormData;

    // Cambiar al tab correspondiente
    if (hasTab1Error && selectedTab !== 0) {
      setSelectedTab(0);
      // Esperar a que el tab se renderice antes de hacer focus
      setTimeout(() => focusErrorField(firstErrorField), 100);
    } else if (hasTab2Error && selectedTab !== 1) {
      setSelectedTab(1);
      // Esperar a que el tab se renderice antes de hacer focus
      setTimeout(() => focusErrorField(firstErrorField), 100);
    } else {
      // Si ya estamos en el tab correcto, hacer focus inmediatamente
      focusErrorField(firstErrorField);
    }

    // Mostrar toast con el error
    toast.error(
      `Por favor, completa el campo: ${getFieldLabel(firstErrorField)}`
    );
  };

  // Función para hacer focus en el campo con error
  const focusErrorField = (fieldName: keyof FormData) => {
    switch (fieldName) {
      case "date":
        dateInputRef.current?.focus();
        break;
      case "client":
        clientInputRef.current?.focus();
        break;
      case "peopleCount":
        peopleCountInputRef.current?.focus();
        break;
      case "service":
        serviceInputRef.current?.focus();
        break;
      case "quotedAmount":
        quotedAmountInputRef.current?.focus();
        break;
    }
  };

  // Función para obtener el label del campo
  const getFieldLabel = (fieldName: keyof FormData): string => {
    const labels: Record<string, string> = {
      date: "Fecha",
      startTime: "Hora de Inicio",
      endTime: "Hora Final",
      client: "Cliente",
      peopleCount: "Personas",
      service: "Servicio",
      quotedAmount: "Monto Cotizado",
      deposit: "Abono",
      status: "Estatus",
      location: "Ubicación",
      bank: "Banco",
      comments: "Comentarios",
    };
    return labels[fieldName] || fieldName;
  };

  const quotedAmount = watch("quotedAmount") || 0;
  const deposit = watch("deposit") || 0;
  const balance = Math.max(0, quotedAmount - deposit);
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  // Calculate duration in minutes based on start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    try {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      const start = new Date();
      start.setHours(startHours, startMinutes, 0, 0);

      const end = new Date();
      end.setHours(endHours, endMinutes, 0, 0);

      const diffMs = end.getTime() - start.getTime();
      return Math.max(0, Math.round(diffMs / 60000)); // Convert to minutes
    } catch {
      return 0;
    }
  };

  // Calculate duration whenever start or end time changes
  const calculatedDuration = calculateDuration(
    watchedStartTime || "",
    watchedEndTime || ""
  );

  // Update duration field and time (for backward compatibility)
  useEffect(() => {
    if (watchedStartTime) {
      setValue("time", watchedStartTime);
    }
    if (calculatedDuration > 0) {
      setValue("duration", calculatedDuration);
    }
  }, [watchedStartTime, calculatedDuration, setValue]);

  // Calculate total collaborator payments and charges
  const totalCollaboratorPayments = collaborators.reduce((sum, c) => {
    const amount = Number(c.amount) || 0;
    if (c.paymentType === "charge") {
      // If charge, we collect from them (adds to profit)
      return sum - amount;
    }
    // If payment or undefined (backward compatibility), we pay them (subtracts from profit)
    return sum + amount;
  }, 0);

  // Calculate profit: Quoted Amount - Sum of Collaborator Payments + Charges
  const calculatedProfit = Math.max(
    0,
    quotedAmount - totalCollaboratorPayments
  );

  // Subscribe to clients, services, and collaborators
  useEffect(() => {
    if (!user) return;

    const unsubscribeClients = subscribeToClients(
      user.uid,
      (updatedClients) => {
        setClients(updatedClients);
      }
    );

    const unsubscribeServices = subscribeToCatalog(user.uid, (updatedItems) => {
      setCatalogItems(updatedItems);
    });

    const unsubscribeCollaborators = subscribeToCollaborators(
      user.uid,
      (updatedCollaborators) => {
        setSavedCollaborators(updatedCollaborators);
      }
    );

    return () => {
      unsubscribeClients();
      unsubscribeServices();
      unsubscribeCollaborators();
    };
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        Object.keys(initialData).forEach((key) => {
          // @ts-expect-error initialData contains keys not present in FormData; safely setting values for editing
          setValue(key, initialData[key]);
        });

        // Find and set the client
        let client;
        if (initialData.clientId) {
          client = clients.find((c) => c.id === initialData.clientId);
        }
        if (!client) {
          client = clients.find((c) => c.name === initialData.client);
        }
        if (client) {
          setSelectedClient(client);
        }

        // Find and set the service
        const service = catalogItems.find(
          (s) => s.name === initialData.service
        );
        if (service) {
          setSelectedService(service);
        }

        // Load collaborators (support old format too)
        if (initialData.collaborators && initialData.collaborators.length > 0) {
          // Ensure paymentType exists for backward compatibility
          setCollaborators(
            initialData.collaborators.map((c) => ({
              ...c,
              paymentType: c.paymentType || "payment",
              amount: c.amount === 0 ? "" : c.amount,
            }))
          );
        } else if (initialData.collaborator) {
          // Migrate old single collaborator format
          setCollaborators([
            {
              name: initialData.collaborator,
              amount: initialData.collaboratorPayment || "",
              paymentType: "payment",
            },
          ]);
        } else {
          setCollaborators([]);
        }

        // Load reminders if available
        if (initialData.reminders && initialData.reminders.length > 0) {
          setReminders(initialData.reminders);
        } else {
          setReminders([{ id: "1", type: "days", value: 1, enabled: true }]);
        }

        // Set startTime and endTime from initialData, or fallback to time field
        if (initialData.startTime) {
          setValue("startTime", initialData.startTime);
        } else if (initialData.time) {
          setValue("startTime", initialData.time);
        }

        if (initialData.endTime) {
          setValue("endTime", initialData.endTime);
        } else if (initialData.time && initialData.duration) {
          // Calculate endTime from time and duration for backward compatibility
          const [hours, minutes] = initialData.time.split(":").map(Number);
          const start = new Date();
          start.setHours(hours, minutes, 0, 0);
          const end = new Date(start.getTime() + initialData.duration * 60000);
          const endTimeStr = `${String(end.getHours()).padStart(
            2,
            "0"
          )}:${String(end.getMinutes()).padStart(2, "0")}`;
          setValue("endTime", endTimeStr);
        }
      } else {
        // Only reset if we are opening a fresh form, NOT if we are just receiving updates
        // Calculate today's date fresh each time to ensure it's always current
        const today = new Date().toISOString().split("T")[0];
        reset({
          status: "pending",
          peopleCount: 1,
          quotedAmount: undefined,
          deposit: undefined,
          date: today,
          time: "09:00",
          startTime: "09:00",
          endTime: "10:00",
          duration: undefined,
          client: "",
          service: "",
        });
        setSelectedClient(null);
        setSelectedService(null);
        setCollaborators([]);
        setReminders([{ id: "1", type: "days", value: 1, enabled: true }]);
      }
    }
  }, [initialData, reset, setValue, isOpen]); // Removed clients and services from dependencies to prevent reset on list update

  // Separate effect to sync selected client/service when lists load (only for editing)
  useEffect(() => {
    if (initialData && isOpen) {
      if (!selectedClient && clients.length > 0) {
        let client;
        if (initialData.clientId) {
          client = clients.find((c) => c.id === initialData.clientId);
        }
        if (!client) {
          client = clients.find((c) => c.name === initialData.client);
        }
        if (client) setSelectedClient(client);
      }

      if (!selectedService && catalogItems.length > 0) {
        const service = catalogItems.find(
          (s) => s.name === initialData.service
        );
        if (service) setSelectedService(service);
      }
    }
  }, [
    clients,
    catalogItems,
    initialData,
    isOpen,
    selectedClient,
    selectedService,
  ]);

  const filteredClients =
    clientQuery === ""
      ? clients
      : clients.filter((client) => {
          return (
            client.name.toLowerCase().includes(clientQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(clientQuery.toLowerCase()) ||
            client.phone?.includes(clientQuery)
          );
        });

  const filteredServices =
    serviceQuery === ""
      ? catalogItems
      : catalogItems.filter((service) => {
          return service.name
            .toLowerCase()
            .includes(serviceQuery.toLowerCase());
        });

  const handleCreateClient = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
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
        updatedAt: Date.now(),
      };

      toast.success("Cliente creado exitosamente");

      // Immediately select the new client without waiting for subscription
      setSelectedClient(newClient);
      setValue("client", newClient.name);
      setIsClientFormOpen(false);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear cliente");
    }
  };

  const handleCreateService = (service: CatalogItem) => {
    // Immediately select the new service
    setSelectedService(service);
    setValue("service", service.name);
    setValue("quotedAmount", service.price);
    if (service.duration) {
      // Calculate endTime based on startTime and service duration
      const currentStartTime = watchedStartTime || "09:00";
      const [hours, minutes] = currentStartTime.split(":").map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + service.duration * 60000);
      const endTimeStr = `${String(end.getHours()).padStart(2, "0")}:${String(
        end.getMinutes()
      ).padStart(2, "0")}`;
      setValue("endTime", endTimeStr);
      setValue("duration", service.duration);
    }
    setIsServiceFormOpen(false);
    toast.success("Ítem creado y seleccionado");
  };

  const handleFormSubmit = (data: FormData) => {
    // Ensure amounts are numbers
    const finalCollaborators = collaborators.map((c) => ({
      ...c,
      amount: Number(c.amount) || 0,
    }));

    const enhancedData = {
      ...data,
      time: data.startTime, // Use startTime as time for backward compatibility
      myProfit: calculatedProfit,
      collaborators: finalCollaborators,
      reminders: reminders.filter((r) => r.enabled),
      // Keep backward compatibility
      collaborator:
        finalCollaborators.length > 0 ? finalCollaborators[0].name : "",
      collaboratorPayment: totalCollaboratorPayments,
      clientId: selectedClient?.id,
      // We could also save serviceId if we wanted to link services strictly
      // serviceId: selectedService?.id
    };
    onSubmit(enhancedData);
  };

  const handleFormError = (errors: FieldErrors<FormData>) => {
    handleValidationError(errors);
  };

  const addCollaborator = () => {
    setShowCollaboratorPicker(true);
  };

  const addCollaboratorFromList = (collaborator: Collaborator) => {
    setCollaborators([
      ...collaborators,
      {
        name: collaborator.name,
        amount: "",
        paymentType: "payment",
      },
    ]);
    setShowCollaboratorPicker(false);
    setCollaboratorQuery("");
    toast.success(`${collaborator.name} agregado`);
  };

  const addManualCollaborator = () => {
    setCollaborators([
      ...collaborators,
      { name: "", amount: "", paymentType: "payment" },
    ]);
    setShowCollaboratorPicker(false);
  };

  const handleCreateCollaborator = async (
    collaboratorData: Omit<
      Collaborator,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ) => {
    if (!user) return;

    try {
      const { createCollaborator } = await import("@/services/collaborator");
      await createCollaborator(user.uid, collaboratorData);

      // Agregar automáticamente el colaborador recién creado a la cita
      setCollaborators([
        ...collaborators,
        {
          name: collaboratorData.name,
          amount: "",
          paymentType: "payment",
        },
      ]);

      toast.success(`${collaboratorData.name} creado y agregado`);
      setIsCollaboratorFormOpen(false);
    } catch (error) {
      console.error("Error al crear colaborador:", error);
      toast.error("Error al crear colaborador");
    }
  };

  const removeCollaborator = (index: number) => {
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };

  const updateCollaborator = (
    index: number,
    field: "name" | "amount" | "paymentType",
    value: string | number
  ) => {
    const updated = [...collaborators];
    if (field === "name") {
      updated[index].name = value as string;
    } else if (field === "paymentType") {
      updated[index].paymentType = value as "payment" | "charge";
    } else {
      updated[index].amount = value;
    }
    setCollaborators(updated);
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
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-bold leading-6 text-gray-900"
                    >
                      {initialData ? "Editar Cita" : "Nueva Cita"}
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
                      <form
                        id="appointment-form"
                        onSubmit={handleSubmit(
                          handleFormSubmit,
                          handleFormError
                        )}
                      >
                        <Tab.Group
                          selectedIndex={selectedTab}
                          onChange={setSelectedTab}
                        >
                          <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1 mb-6">
                            <Tab
                              className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                                                                ${
                                                                  selected
                                                                    ? "bg-white text-blue-700 shadow"
                                                                    : "text-blue-600 hover:bg-white/[0.12] hover:text-blue-700"
                                                                }`
                              }
                            >
                              Información de la Cita
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                                                                ${
                                                                  selected
                                                                    ? "bg-white text-blue-700 shadow"
                                                                    : "text-blue-600 hover:bg-white/[0.12] hover:text-blue-700"
                                                                }`
                              }
                            >
                              Información de Pago
                            </Tab>
                          </Tab.List>
                          <Tab.Panels>
                            {/* Tab 1: Información de la Cita */}
                            <Tab.Panel className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-4">
                              {/* Fecha, Hora Inicio, Hora Final y Duración en la misma línea */}
                              <div className="sm:col-span-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Fecha <span className="text-red-500">*</span>
                                </label>
                                <input
                                  {...register("date")}
                                  ref={(e) => {
                                    register("date").ref(e);
                                    dateInputRef.current = e;
                                  }}
                                  type="date"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
                                />
                                {errors.date && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.date.message}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-1">
                                <Controller
                                  name="startTime"
                                  control={control}
                                  render={({ field }) => (
                                    <TimePicker
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      label="Hora Inicio"
                                      error={errors.startTime?.message}
                                      required
                                    />
                                  )}
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <Controller
                                  name="endTime"
                                  control={control}
                                  render={({ field }) => (
                                    <TimePicker
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      label="Hora Final"
                                      error={errors.endTime?.message}
                                      required
                                    />
                                  )}
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Duración
                                </label>
                                <div className="mt-1 flex items-center h-[42px] px-3 rounded-md bg-blue-50 border border-blue-200">
                                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                                  <span className="text-sm font-semibold text-blue-900">
                                    {calculatedDuration > 0
                                      ? `${Math.floor(
                                          calculatedDuration / 60
                                        )}h ${calculatedDuration % 60}m`
                                      : "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Cliente y Personas en la misma línea */}
                              <div className="sm:col-span-3">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Cliente{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                  name="client"
                                  control={control}
                                  render={({ field }) => (
                                    <Combobox
                                      value={selectedClient}
                                      onChange={(client) => {
                                        setSelectedClient(client);
                                        field.onChange(client?.name || "");
                                      }}
                                    >
                                      {({ open }) => (
                                        <div className="relative">
                                          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                                            <Combobox.Input
                                              ref={clientInputRef}
                                              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                              displayValue={(
                                                client: Client | null
                                              ) => client?.name || ""}
                                              onChange={(event) =>
                                                setClientQuery(
                                                  event.target.value
                                                )
                                              }
                                              onClick={() =>
                                                !open &&
                                                clientButtonRef.current?.click()
                                              }
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
                                            afterLeave={() =>
                                              setClientQuery("")
                                            }
                                          >
                                            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setIsClientFormOpen(true)
                                                }
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                              >
                                                <UserPlus size={16} />
                                                Crear nuevo cliente
                                              </button>
                                              {filteredClients.length === 0 &&
                                              clientQuery !== "" ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                  No se encontraron clientes.
                                                </div>
                                              ) : (
                                                filteredClients.map(
                                                  (client) => (
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
                                                      {({
                                                        selected,
                                                        active,
                                                      }) => (
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
                                                          {client.phone && (
                                                            <span
                                                              className={`block text-xs ${
                                                                active
                                                                  ? "text-blue-200"
                                                                  : "text-gray-500"
                                                              }`}
                                                            >
                                                              {client.phone}
                                                            </span>
                                                          )}
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
                                                  )
                                                )
                                              )}
                                            </Combobox.Options>
                                          </Transition>
                                        </div>
                                      )}
                                    </Combobox>
                                  )}
                                />
                                {errors.client && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.client.message}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-1">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Personas{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  {...register("peopleCount")}
                                  ref={(e) => {
                                    register("peopleCount").ref(e);
                                    peopleCountInputRef.current = e;
                                  }}
                                  type="number"
                                  min="1"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
                                />
                                {errors.peopleCount && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.peopleCount.message}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Servicio{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                  name="service"
                                  control={control}
                                  render={({ field }) => (
                                    <Combobox
                                      value={selectedService}
                                      onChange={(service) => {
                                        setSelectedService(service);
                                        field.onChange(service?.name || "");
                                        if (service?.duration) {
                                          // Calculate endTime based on startTime and service duration
                                          const currentStartTime =
                                            watchedStartTime || "09:00";
                                          const [hours, minutes] =
                                            currentStartTime
                                              .split(":")
                                              .map(Number);
                                          const start = new Date();
                                          start.setHours(hours, minutes, 0, 0);
                                          const end = new Date(
                                            start.getTime() +
                                              service.duration * 60000
                                          );
                                          const endTimeStr = `${String(
                                            end.getHours()
                                          ).padStart(2, "0")}:${String(
                                            end.getMinutes()
                                          ).padStart(2, "0")}`;
                                          setValue("endTime", endTimeStr);
                                          setValue(
                                            "duration",
                                            service.duration
                                          );
                                        }
                                      }}
                                    >
                                      {({ open }) => (
                                        <div className="relative">
                                          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm">
                                            <Combobox.Input
                                              ref={serviceInputRef}
                                              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 placeholder:text-gray-500"
                                              displayValue={(
                                                service: CatalogItem | null
                                              ) => service?.name || field.value}
                                              onChange={(event) => {
                                                setServiceQuery(
                                                  event.target.value
                                                );
                                                field.onChange(
                                                  event.target.value
                                                );
                                              }}
                                              onClick={() =>
                                                !open &&
                                                serviceButtonRef.current?.click()
                                              }
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
                                            afterLeave={() =>
                                              setServiceQuery("")
                                            }
                                          >
                                            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setIsServiceFormOpen(true)
                                                }
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-b border-gray-200"
                                              >
                                                <Plus size={16} />
                                                Crear nuevo servicio
                                              </button>
                                              {filteredServices.length === 0 &&
                                              serviceQuery !== "" ? (
                                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                  No se encontraron servicios.
                                                </div>
                                              ) : (
                                                filteredServices.map(
                                                  (service) => (
                                                    <Combobox.Option
                                                      key={service.id}
                                                      className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                          active
                                                            ? "bg-blue-600 text-white"
                                                            : "text-gray-900"
                                                        }`
                                                      }
                                                      value={service}
                                                    >
                                                      {({
                                                        selected,
                                                        active,
                                                      }) => (
                                                        <>
                                                          <span
                                                            className={`block truncate ${
                                                              selected
                                                                ? "font-medium"
                                                                : "font-normal"
                                                            }`}
                                                          >
                                                            {service.name}
                                                          </span>
                                                          <span
                                                            className={`block text-xs ${
                                                              active
                                                                ? "text-blue-200"
                                                                : "text-gray-500"
                                                            }`}
                                                          >
                                                            ${service.price}
                                                            {service.duration
                                                              ? ` - ${service.duration} min`
                                                              : ""}
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
                                                  )
                                                )
                                              )}
                                            </Combobox.Options>
                                          </Transition>
                                        </div>
                                      )}
                                    </Combobox>
                                  )}
                                />
                                {errors.service && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.service.message}
                                  </p>
                                )}
                              </div>

                              {/* Estatus */}
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Estatus
                                </label>
                                <select
                                  {...register("status")}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900"
                                >
                                  <option value="pending">Pendiente</option>
                                  <option value="confirmed">Confirmado</option>
                                  <option value="completed">Completado</option>
                                  <option value="cancelled">Cancelado</option>
                                </select>
                              </div>

                              {/* Ubicación */}
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Ubicación
                                </label>
                                <input
                                  {...register("location")}
                                  type="text"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 text-gray-900 placeholder:text-gray-500"
                                  placeholder="Dirección del evento"
                                />
                              </div>

                              {/* Comentarios compartidos */}
                              <div className="sm:col-span-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                  Comentarios
                                </label>
                                <textarea
                                  {...register("comments")}
                                  rows={3}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 resize-none text-gray-900 placeholder:text-gray-500"
                                  placeholder="Notas adicionales sobre la cita..."
                                />
                                {errors.comments && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.comments.message}
                                  </p>
                                )}
                              </div>

                              {/* Reminders Section */}
                              <div className="sm:col-span-4">
                                <div className="border-t border-gray-200 pt-5">
                                  <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Bell size={16} className="text-blue-600" />
                                    Recordatorios
                                  </label>
                                  <div className="space-y-3">
                                    {reminders.map((reminder, index) => (
                                      <div
                                        key={reminder.id}
                                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={reminder.enabled}
                                          onChange={(e) => {
                                            const updated = [...reminders];
                                            updated[index].enabled =
                                              e.target.checked;
                                            setReminders(updated);
                                          }}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <input
                                          type="number"
                                          min="1"
                                          value={reminder.value}
                                          onChange={(e) => {
                                            const updated = [...reminders];
                                            updated[index].value = Number(
                                              e.target.value
                                            );
                                            setReminders(updated);
                                          }}
                                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 text-gray-900"
                                        />
                                        <select
                                          value={reminder.type}
                                          onChange={(e) => {
                                            const updated = [...reminders];
                                            updated[index].type = e.target
                                              .value as
                                              | "days"
                                              | "hours"
                                              | "minutes";
                                            setReminders(updated);
                                          }}
                                          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 text-gray-900"
                                        >
                                          <option value="days">
                                            Días antes
                                          </option>
                                          <option value="hours">
                                            Horas antes
                                          </option>
                                          <option value="minutes">
                                            Minutos antes
                                          </option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReminders(
                                              reminders.filter(
                                                (_, i) => i !== index
                                              )
                                            );
                                          }}
                                          className="ml-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReminders([
                                          ...reminders,
                                          {
                                            id: Date.now().toString(),
                                            type: "hours",
                                            value: 2,
                                            enabled: true,
                                          },
                                        ]);
                                      }}
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                    >
                                      <Plus size={16} />
                                      Agregar recordatorio
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Tab.Panel>

                            {/* Tab 2: Información de Pago */}
                            <Tab.Panel className="space-y-6">
                              {/* Summary Cards - Top Section */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Monto Cotizado Card */}
                                <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Monto Cotizado
                                  </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                      $
                                    </span>
                                    <input
                                      {...register("quotedAmount", {
                                        valueAsNumber: true,
                                      })}
                                      ref={(e) => {
                                        register("quotedAmount", {
                                          valueAsNumber: true,
                                        }).ref(e);
                                        quotedAmountInputRef.current = e;
                                      }}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2.5 pl-7 text-gray-900 font-semibold placeholder:text-gray-400"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  {errors.quotedAmount && (
                                    <p className="text-red-500 text-xs mt-1">
                                      {errors.quotedAmount.message}
                                    </p>
                                  )}
                                </div>

                                {/* Abono Card */}
                                <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Abono / Seña
                                  </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                      $
                                    </span>
                                    <input
                                      {...register("deposit", {
                                        valueAsNumber: true,
                                      })}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2.5 pl-7 text-gray-900 font-semibold placeholder:text-gray-400"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  {errors.deposit && (
                                    <p className="text-red-500 text-xs mt-1">
                                      {errors.deposit.message}
                                    </p>
                                  )}
                                  <p
                                    className={`text-xs font-medium mt-2 ${
                                      balance > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    Restante: ${balance.toFixed(2)}
                                  </p>
                                </div>

                                {/* Mi Ganancia Card */}
                                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Mi Ganancia
                                  </label>
                                  <div className="flex items-center h-[42px]">
                                    <span
                                      className={`text-2xl font-bold ${
                                        calculatedProfit > 0
                                          ? "text-gray-900"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      ${calculatedProfit.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-2">
                                    Calculada automáticamente
                                  </p>
                                </div>
                              </div>

                              {/* Banco */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  Banco
                                </label>
                                <input
                                  {...register("bank")}
                                  type="text"
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2.5 text-gray-900 placeholder:text-gray-500"
                                  placeholder="Ej: Banco Popular, BHD León..."
                                />
                              </div>

                              {/* Collaborators Section */}
                              <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-200">
                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900">
                                      Colaboradores
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Administra los pagos a tu equipo
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={addCollaborator}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                  >
                                    <Plus size={16} />
                                    Agregar
                                  </button>
                                </div>

                                {/* Collaborator Picker Modal */}
                                {showCollaboratorPicker && (
                                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                                      <div className="p-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                          Agregar Colaborador
                                        </h3>
                                        <input
                                          type="text"
                                          placeholder="Buscar colaborador..."
                                          value={collaboratorQuery}
                                          onChange={(e) =>
                                            setCollaboratorQuery(e.target.value)
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                        />
                                      </div>
                                      <div className="max-h-[400px] overflow-y-auto">
                                        {savedCollaborators
                                          .filter((c) =>
                                            c.name
                                              .toLowerCase()
                                              .includes(
                                                collaboratorQuery.toLowerCase()
                                              )
                                          )
                                          .map((collaborator) => (
                                            <button
                                              key={collaborator.id}
                                              type="button"
                                              onClick={() =>
                                                addCollaboratorFromList(
                                                  collaborator
                                                )
                                              }
                                              className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="font-medium text-gray-900">
                                                    {collaborator.name}
                                                  </p>
                                                  {(collaborator.email ||
                                                    collaborator.phone) && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      {collaborator.email ||
                                                        collaborator.phone}
                                                    </p>
                                                  )}
                                                </div>
                                                <Plus className="h-5 w-5 text-blue-600" />
                                              </div>
                                            </button>
                                          ))}
                                        {savedCollaborators.length === 0 && (
                                          <div className="p-8 text-center text-gray-500">
                                            <p className="mb-2">
                                              No hay colaboradores guardados
                                            </p>
                                            <Link
                                              href="/collaborators"
                                              className="text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                              Crear colaboradores
                                            </Link>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowCollaboratorPicker(false);
                                            setIsCollaboratorFormOpen(true);
                                          }}
                                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                          Crear Colaborador
                                        </button>
                                        <button
                                          type="button"
                                          onClick={addManualCollaborator}
                                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                          Agregar colaborador manualmente
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowCollaboratorPicker(false);
                                            setCollaboratorQuery("");
                                          }}
                                          className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {collaborators.length === 0 ? (
                                  <div className="text-center py-8 px-5 bg-gray-50 rounded-b-lg border-2 border-dashed border-gray-300 m-5 mt-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-300 mb-3">
                                      <UserPlus
                                        size={24}
                                        className="text-gray-400"
                                      />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                      Sin colaboradores
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Agrega colaboradores para gestionar pagos
                                    </p>
                                  </div>
                                ) : (
                                  <div className="max-h-[400px] overflow-y-auto p-5 pt-4 space-y-2.5">
                                    {collaborators.map((collab, index) => (
                                      <div
                                        key={index}
                                        className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                                      >
                                        <div className="flex-1 space-y-3">
                                          {/* Nombre */}
                                          <input
                                            type="text"
                                            value={collab.name}
                                            onChange={(e) =>
                                              updateCollaborator(
                                                index,
                                                "name",
                                                e.target.value
                                              )
                                            }
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 text-gray-900"
                                            placeholder="Nombre del colaborador"
                                          />

                                          {/* Tipo de Pago y Monto */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <select
                                              value={
                                                collab.paymentType || "payment"
                                              }
                                              onChange={(e) =>
                                                updateCollaborator(
                                                  index,
                                                  "paymentType",
                                                  e.target.value
                                                )
                                              }
                                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 text-gray-900"
                                            >
                                              <option value="payment">
                                                Pagar Monto Fijo
                                              </option>
                                              <option value="charge">
                                                Cobrar Monto Fijo
                                              </option>
                                            </select>

                                            <div className="relative">
                                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-sm">
                                                $
                                              </span>
                                              <input
                                                type="number"
                                                value={
                                                  collab.amount === 0
                                                    ? ""
                                                    : collab.amount
                                                }
                                                onChange={(e) =>
                                                  updateCollaborator(
                                                    index,
                                                    "amount",
                                                    e.target.value
                                                  )
                                                }
                                                min="0"
                                                step="0.01"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-2 pl-7 text-gray-900 font-medium"
                                                placeholder="0.00"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeCollaborator(index)
                                          }
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-0.5"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Total Summary - Always visible at bottom */}
                                {collaborators.length > 0 && (
                                  <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-300">
                                    <span className="text-sm font-semibold text-gray-900">
                                      Total a Colaboradores
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                      ${totalCollaboratorPayments.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Comentarios */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                  Comentarios
                                </label>
                                <textarea
                                  {...register("comments")}
                                  rows={3}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-3 resize-none text-gray-900 placeholder:text-gray-500"
                                  placeholder="Notas adicionales sobre el pago o acuerdos especiales..."
                                />
                                {errors.comments && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors.comments.message}
                                  </p>
                                )}
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
                        {initialData ? "Actualizar" : "Crear Cita"}
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

      <CatalogItemForm
        isOpen={isServiceFormOpen}
        onClose={() => setIsServiceFormOpen(false)}
        onSuccess={handleCreateService}
        initialName={serviceQuery}
      />

      <CollaboratorForm
        isOpen={isCollaboratorFormOpen}
        onClose={() => setIsCollaboratorFormOpen(false)}
        onSubmit={handleCreateCollaborator}
      />
    </>
  );
}
