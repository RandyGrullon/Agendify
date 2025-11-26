'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar as CalendarIcon, Clock, DollarSign, User } from 'lucide-react';
import { AgendaItem } from '@/types';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: AgendaItem[];
}

export default function WeeklyCalendarModal({ isOpen, onClose, appointments }: WeeklyCalendarModalProps) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    
    // Generate array of 7 days starting from Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Group appointments by day
    const getAppointmentsForDay = (day: Date) => {
        return appointments.filter(apt => {
            const aptDate = typeof apt.date === 'number' 
                ? new Date((apt.date - 25569) * 86400 * 1000)
                : parseISO(apt.date.toString());
            return isSameDay(aptDate, day);
        }).sort((a, b) => a.time.localeCompare(b.time));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmado';
            case 'pending': return 'Pendiente';
            case 'completed': return 'Completado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
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
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-7xl max-h-[90vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <CalendarIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-bold text-white">
                                                Calendario Semanal
                                            </Dialog.Title>
                                            <p className="text-sm text-blue-100">
                                                {format(weekStart, 'd MMM', { locale: es })} - {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="flex-1 overflow-auto p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                                        {weekDays.map((day, index) => {
                                            const dayAppointments = getAppointmentsForDay(day);
                                            const isToday = isSameDay(day, today);
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    className={`rounded-xl border-2 ${
                                                        isToday 
                                                            ? 'border-blue-500 bg-blue-50/50' 
                                                            : 'border-gray-200 bg-white'
                                                    } overflow-hidden flex flex-col`}
                                                >
                                                    {/* Day Header */}
                                                    <div className={`p-3 text-center ${
                                                        isToday 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-gray-50 text-gray-900'
                                                    }`}>
                                                        <p className="text-sm font-bold uppercase">
                                                            {format(day, 'EEE', { locale: es })}
                                                        </p>
                                                        <p className={`text-2xl font-bold mt-1 ${
                                                            isToday ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                            {format(day, 'd')}
                                                        </p>
                                                        <p className={`text-xs ${
                                                            isToday ? 'text-blue-100' : 'text-gray-500'
                                                        }`}>
                                                            {format(day, 'MMM', { locale: es })}
                                                        </p>
                                                    </div>

                                                    {/* Appointments List */}
                                                    <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                                                        {dayAppointments.length === 0 ? (
                                                            <div className="flex items-center justify-center h-full">
                                                                <p className="text-xs text-gray-400 text-center">
                                                                    Sin citas
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            dayAppointments.map((apt) => (
                                                                <div
                                                                    key={apt.id}
                                                                    className={`p-3 rounded-lg border ${getStatusColor(apt.status)} hover:shadow-md transition-all cursor-pointer group`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                                                            <Clock size={12} />
                                                                            {apt.time}
                                                                        </div>
                                                                        <span className="text-xs font-bold">
                                                                            ${apt.quotedAmount.toLocaleString('es-MX')}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <User size={12} className="flex-shrink-0" />
                                                                            <p className="text-xs font-semibold truncate">
                                                                                {apt.client}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        <p className="text-xs truncate">
                                                                            {apt.service}
                                                                        </p>
                                                                        
                                                                        <div className="pt-1">
                                                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold">
                                                                                {getStatusText(apt.status)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Day Footer - Count */}
                                                    {dayAppointments.length > 0 && (
                                                        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-center">
                                                            <p className="text-xs font-semibold text-gray-600">
                                                                {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                                            <span className="text-gray-600">Confirmado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                                            <span className="text-gray-600">Pendiente</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                                            <span className="text-gray-600">Completado</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
