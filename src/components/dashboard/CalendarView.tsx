'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AgendaItem } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    items: AgendaItem[];
    onEventClick: (item: AgendaItem) => void;
    onStatusChange?: (itemId: string, newStatus: AgendaItem['status']) => void;
}

export default function CalendarView({ items, onEventClick, onStatusChange }: CalendarViewProps) {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const events = items.map(item => {
        const start = new Date(`${item.date}T${item.time}`);
        // Assuming 1 hour duration if not specified, or use service duration if we had it linked
        // For now, let's default to 1 hour
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        
        return {
            id: item.id,
            title: `${item.client} - ${item.service}`,
            start,
            end,
            resource: item,
        };
    });

    const eventStyleGetter = (event: any) => {
        const status = event.resource.status;
        let backgroundColor = '#3b82f6'; // blue-500

        switch (status) {
            case 'confirmed':
                backgroundColor = '#22c55e'; // green-500
                break;
            case 'completed':
                backgroundColor = '#6b7280'; // gray-500
                break;
            case 'cancelled':
                backgroundColor = '#ef4444'; // red-500
                break;
            case 'pending':
            default:
                backgroundColor = '#eab308'; // yellow-500
                break;
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const CustomEvent = ({ event }: any) => {
        const item = event.resource as AgendaItem;
        const isWeekOrDay = view === Views.WEEK || view === Views.DAY || view === Views.AGENDA;
        
        return (
            <div className="flex flex-col h-full px-1 py-0.5 overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                    <span className={`truncate flex-1 font-medium ${isWeekOrDay ? 'text-xs' : 'text-[10px]'}`}>
                        {isMobile ? item.client : event.title}
                    </span>
                    {onStatusChange && !isMobile && (
                        <select
                            value={item.status}
                            onChange={(e) => {
                                e.stopPropagation();
                                onStatusChange(item.id, e.target.value as AgendaItem['status']);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] px-1 py-0 bg-white/90 border border-white rounded cursor-pointer focus:ring-1 focus:ring-white"
                            title="Cambiar estado"
                        >
                            <option value="pending">⏳</option>
                            <option value="confirmed">✓</option>
                            <option value="completed">✔</option>
                            <option value="cancelled">✗</option>
                        </select>
                    )}
                </div>
                {isWeekOrDay && (
                    <span className="text-[10px] opacity-90 truncate">
                        {item.service}
                    </span>
                )}
            </div>
        );
    };

    const CustomToolbar = (toolbar: any) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const goToToday = () => toolbar.onNavigate('TODAY');

        return (
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                        {toolbar.label}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={goToBack}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors hidden md:block"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={goToNext}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>
                {!isMobile && (
                    <div className="flex gap-2">
                        {[
                            { view: Views.MONTH, label: 'Mes' },
                            { view: Views.WEEK, label: 'Semana' },
                            { view: Views.DAY, label: 'Día' },
                            { view: Views.AGENDA, label: 'Agenda' },
                        ].map(({ view: v, label }) => (
                            <button
                                key={v}
                                onClick={() => toolbar.onView(v)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    toolbar.view === v
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <style jsx global>{`
                .rbc-calendar {
                    font-family: inherit;
                }
                
                /* Mobile optimizations */
                @media (max-width: 768px) {
                    .rbc-toolbar {
                        display: none;
                    }
                    
                    .rbc-header {
                        padding: 8px 2px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    
                    .rbc-date-cell {
                        padding: 4px;
                        font-size: 12px;
                    }
                    
                    .rbc-event {
                        padding: 2px 4px;
                        font-size: 10px;
                    }
                    
                    .rbc-month-view {
                        border: none;
                    }
                    
                    .rbc-month-row {
                        min-height: 60px;
                    }
                    
                    .rbc-day-bg + .rbc-day-bg {
                        border-left: 1px solid #e5e7eb;
                    }
                    
                    .rbc-month-row + .rbc-month-row {
                        border-top: 1px solid #e5e7eb;
                    }
                }
                
                /* Desktop styles */
                .rbc-header {
                    padding: 12px;
                    font-weight: 600;
                    color: #374151;
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .rbc-today {
                    background-color: #eff6ff;
                }
                
                .rbc-off-range-bg {
                    background-color: #f9fafb;
                }
                
                .rbc-event {
                    border: none;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }
                
                .rbc-event:hover {
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }
                
                .rbc-selected {
                    background-color: #2563eb !important;
                }
                
                .rbc-date-cell {
                    padding: 6px;
                }
                
                .rbc-date-cell.rbc-now {
                    font-weight: 700;
                    color: #2563eb;
                }
                
                .rbc-agenda-view {
                    padding: 16px;
                }
                
                .rbc-agenda-view table {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .rbc-agenda-date-cell,
                .rbc-agenda-time-cell {
                    padding: 12px;
                    font-weight: 600;
                }
                
                .rbc-agenda-event-cell {
                    padding: 12px;
                }
            `}</style>
            
            <div className="p-3 md:p-6">
                <div className={`${isMobile ? 'h-[500px]' : 'h-[600px]'}`}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        view={isMobile ? Views.MONTH : view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        culture="es"
                        messages={{
                            next: "→",
                            previous: "←",
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                            agenda: "Agenda",
                            date: "Fecha",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "No hay eventos en este rango",
                            showMore: (total) => `+${total} más`,
                        }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => onEventClick(event.resource)}
                        components={{
                            event: CustomEvent,
                            toolbar: CustomToolbar,
                        }}
                        popup
                        popupOffset={{ x: 10, y: 10 }}
                    />
                </div>
            </div>
        </div>
    );
}
