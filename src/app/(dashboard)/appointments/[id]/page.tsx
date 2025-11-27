"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAgendaItem } from "@/services/agenda";
import { AgendaItem } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, FileText, CheckCircle, XCircle, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function AppointmentDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState<AgendaItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItem = async () => {
            if (!user || !params.id) return;
            try {
                const data = await getAgendaItem(user.uid, params.id as string);
                if (data) {
                    setItem(data);
                } else {
                    toast.error("Cita no encontrada");
                    router.push("/appointments");
                }
            } catch (error) {
                console.error("Error fetching appointment:", error);
                toast.error("Error al cargar la cita");
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [user, params.id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!item) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-800";
            case "completed": return "bg-blue-100 text-blue-800";
            case "cancelled": return "bg-red-100 text-red-800";
            default: return "bg-yellow-100 text-yellow-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed": return <CheckCircle className="w-5 h-5" />;
            case "completed": return <CheckCircle className="w-5 h-5" />;
            case "cancelled": return <XCircle className="w-5 h-5" />;
            default: return <AlertCircle className="w-5 h-5" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending": return "Pendiente";
            case "confirmed": return "Confirmado";
            case "completed": return "Completado";
            case "cancelled": return "Cancelado";
            default: return status;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return "";
        try {
            const [hours, minutes] = timeStr.split(":");
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return format(date, "h:mm a");
        } catch (e) {
            return timeStr;
        }
    };

    const formatDate = (date: string | number) => {
        if (!date) return "N/A";
        try {
            let dateObj: Date;
            if (typeof date === "number") {
                const excelEpoch = new Date(1899, 11, 30);
                dateObj = new Date(excelEpoch.getTime() + date * 86400000);
            } else {
                dateObj = new Date(date.includes("T") ? date : date + "T00:00:00");
            }
            return format(dateObj, "EEEE d 'de' MMMM, yyyy", { locale: es });
        } catch (e) {
            return "Fecha inválida";
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Volver</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{item.service}</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={16} />
                            {formatDate(item.date)}
                            <span className="mx-1">•</span>
                            <Clock size={16} />
                            {formatTime(item.time)}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{getStatusLabel(item.status)}</span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Client Info */}
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="text-blue-600" size={20} />
                                Información del Cliente
                            </h2>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="text-sm text-gray-500 block">Nombre</label>
                                    <p className="font-medium text-gray-900">{item.client}</p>
                                </div>
                                {/* Add more client fields if available in the future, e.g. phone, email */}
                                <div>
                                    <label className="text-sm text-gray-500 block">Personas</label>
                                    <p className="font-medium text-gray-900">{item.peopleCount}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="text-red-500" size={20} />
                                Ubicación
                            </h2>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-900">{item.location || "No especificada"}</p>
                            </div>
                        </section>

                        {item.comments && (
                            <section>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="text-gray-500" size={20} />
                                    Comentarios
                                </h2>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">{item.comments}</p>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="text-green-600" size={20} />
                                Detalles Financieros
                            </h2>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-gray-600">Monto Cotizado</span>
                                    <span className="font-semibold text-lg text-gray-900">RD$ {item.quotedAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <span className="text-gray-600">Abono / Seña</span>
                                    <span className="font-medium text-green-600">- RD$ {item.deposit?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="font-medium text-gray-900">Pendiente por Cobrar</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        RD$ {(item.quotedAmount - (item.deposit || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="text-purple-600" size={20} />
                                Información Interna
                            </h2>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block">Mi Ganancia Total</label>
                                        <p className="font-medium text-green-700">RD$ {item.myProfit?.toLocaleString() || 0}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block">
                                            {(item.collaboratorPayment || 0) < 0 ? 'Ganancia de Colaboradores' : 'Pago a Colaboradores'}
                                        </label>
                                        <p className={`font-medium ${(item.collaboratorPayment || 0) < 0 ? 'text-green-600' : 'text-orange-700'}`}>
                                            RD$ {Math.abs(item.collaboratorPayment || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Collaborators List */}
                                {(item.collaborators && item.collaborators.length > 0) || item.collaborator ? (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <label className="text-sm text-gray-500 block mb-2">Detalle Colaboradores</label>
                                        {item.collaborators && item.collaborators.length > 0 ? (
                                            <div className="space-y-2">
                                                {item.collaborators.map((collab, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                                                        <span className="font-medium text-gray-900">{collab.name}</span>
                                                        <div className="text-right">
                                                            <span className={`block font-semibold ${collab.paymentType === 'charge' ? 'text-green-600' : 'text-orange-600'}`}>
                                                                {collab.paymentType === 'charge' ? '+' : '-'} RD$ {Number(collab.amount).toLocaleString()}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {collab.paymentType === 'charge' ? 'Cobro (Ganancia)' : 'Pago (Gasto)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Legacy support
                                            <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                                                <span className="font-medium text-gray-900">{item.collaborator}</span>
                                                <span className="font-semibold text-orange-600">
                                                    - RD$ {item.collaboratorPayment?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {item.bank && (
                                    <div className="mt-2">
                                        <label className="text-sm text-gray-500 block">Banco</label>
                                        <p className="font-medium text-gray-900">{item.bank}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
