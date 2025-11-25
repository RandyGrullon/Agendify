"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { AgendaItem } from "@/types";
import { DollarSign, MapPin } from "lucide-react";
import DayAppointmentsModal from "./DayAppointmentsModal";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Helper function to safely parse dates
const parseDateTime = (
  dateString: string | number | undefined | null,
  timeString: string | undefined | null
): Date => {
  if (!dateString || !timeString) return new Date();

  try {
    let cleanDate: string;

    // Handle Excel serial dates
    if (typeof dateString === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const tempDate = new Date(excelEpoch.getTime() + dateString * 86400000);
      cleanDate = tempDate.toISOString().split("T")[0];
    } else {
      cleanDate = dateString.includes("T")
        ? dateString.split("T")[0]
        : dateString;
    }

    const date = new Date(`${cleanDate}T${timeString}`);
    if (!isNaN(date.getTime())) return date;

    return new Date();
  } catch {
    return new Date();
  }
};

const locales = {
  es: es,
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
  onStatusChange?: (itemId: string, newStatus: AgendaItem["status"]) => void;
  onDelete?: (itemId: string) => void;
}

export default function CalendarView({
  items,
  onEventClick,
  onStatusChange,
  onDelete,
}: CalendarViewProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(
    null
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const events = items.map((item) => {
    const start = parseDateTime(item.date, item.time);
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
    let backgroundColor = "#3b82f6"; // blue-500
    let borderColor = "#2563eb"; // blue-600

    switch (status) {
      case "confirmed":
        backgroundColor = "#22c55e"; // green-500
        borderColor = "#16a34a"; // green-600
        break;
      case "completed":
        backgroundColor = "#6b7280"; // gray-500
        borderColor = "#4b5563"; // gray-600
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red-500
        borderColor = "#dc2626"; // red-600
        break;
      case "pending":
      default:
        backgroundColor = "#eab308"; // yellow-500
        borderColor = "#ca8a04"; // yellow-600
        break;
    }

    if (view === Views.DAY) {
      return {
        style: {
          backgroundColor: `${backgroundColor}20`, // 20% opacity
          borderLeft: `8px solid ${borderColor}`,
          borderRadius: "6px",
          color: "#1f2937",
          border: "none",
          display: "block",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
      };
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const CustomEvent = ({ event }: any) => {
    const item = event.resource as AgendaItem;
    const isDayView = view === Views.DAY;
    const isWeekOrDay =
      view === Views.WEEK || view === Views.DAY || view === Views.AGENDA;

    if (isDayView) {
      return (
        <div className="flex flex-col h-full px-3 py-2 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-base text-gray-900 truncate">
              {item.client}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {format(event.start, "h:mm a")}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mb-2">
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <span className="truncate font-medium">{item.service}</span>
            </div>
            {item.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
              <DollarSign className="w-4 h-4" />
              {item.quotedAmount.toLocaleString("es-MX")}
            </div>
            {onStatusChange && (
              <select
                value={item.status}
                onChange={(e) => {
                  e.stopPropagation();
                  onStatusChange(
                    item.id,
                    e.target.value as AgendaItem["status"]
                  );
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 bg-white/80 text-gray-900 border border-gray-200 rounded cursor-pointer hover:bg-white focus:ring-1 focus:ring-blue-500 shadow-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full px-1 py-0.5 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`truncate flex-1 font-medium ${isWeekOrDay ? "text-xs" : "text-[10px]"
              }`}
          >
            {isMobile ? item.client : event.title}
          </span>
          {onStatusChange && !isMobile && (
            <select
              value={item.status}
              onChange={(e) => {
                e.stopPropagation();
                onStatusChange(item.id, e.target.value as AgendaItem["status"]);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] px-1.5 py-0.5 bg-white text-gray-900 border border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium shadow-sm"
              title="Cambiar estado"
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
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
    const goToBack = () => toolbar.onNavigate("PREV");
    const goToNext = () => toolbar.onNavigate("NEXT");
    const goToToday = () => toolbar.onNavigate("TODAY");

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl p-4 mb-4 border-b-2 border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {toolbar.label}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToBack}
              className="px-4 py-2 text-sm font-medium bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg transition-all shadow-sm hover:shadow border border-gray-200 hover:border-blue-300"
            >
              ← Anterior
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg hidden md:block"
            >
              Hoy
            </button>
            <button
              onClick={goToNext}
              className="px-4 py-2 text-sm font-medium bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-lg transition-all shadow-sm hover:shadow border border-gray-200 hover:border-blue-300"
            >
              Siguiente →
            </button>
          </div>
        </div>
        {!isMobile && (
          <div className="flex gap-2">
            {[
              { view: Views.MONTH, label: "📅 Mes" },
              { view: Views.WEEK, label: "📊 Semana" },
              { view: Views.DAY, label: "📆 Día" },
              { view: Views.AGENDA, label: "📋 Agenda" },
            ].map(({ view: v, label }) => (
              <button
                key={v}
                onClick={() => toolbar.onView(v)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${toolbar.view === v
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
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
    <div className="h-full">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }

        .rbc-button-link {
          color: #000000 !important;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .rbc-toolbar {
            display: none;
          }

          .rbc-header {
            padding: 10px 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .rbc-date-cell {
            padding: 6px;
            font-size: 13px;
            font-weight: 500;
          }

          .rbc-event {
            padding: 3px 6px;
            font-size: 10px;
          }

          .rbc-month-view {
            border: none;
          }

          .rbc-month-row {
            min-height: 70px;
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
          padding: 16px 12px;
          font-weight: 700;
          font-size: 13px;
          color: #000000;
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
          border-bottom: 2px solid #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rbc-today {
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
        }

        .rbc-off-range-bg {
          background-color: #fafafa;
        }

        .rbc-date-cell {
          padding: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .rbc-date-cell:hover {
          background-color: #f0f9ff;
        }

        .rbc-date-cell.rbc-now {
          font-weight: 800;
          color: #2563eb;
        }

        .rbc-date-cell a {
          color: #000000 !important;
          transition: color 0.2s ease;
        }

        .rbc-date-cell.rbc-now a {
          color: #2563eb !important;
        }

        .rbc-event {
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          border-radius: 6px;
          padding: 4px 8px;
        }

        .rbc-event:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .rbc-selected {
          background-color: #1d4ed8 !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4) !important;
        }

        .rbc-day-bg {
          transition: background-color 0.2s ease;
        }

        .rbc-day-bg:hover {
          background-color: #f8fafc;
        }

        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .rbc-month-row {
          border-color: #e5e7eb;
        }

        .rbc-day-bg + .rbc-day-bg {
          border-left-color: #e5e7eb;
        }

        .rbc-agenda-view {
          padding: 20px;
        }

        .rbc-agenda-view table {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          padding: 14px 16px;
          font-weight: 600;
          color: #000000;
          background: linear-gradient(to right, #f9fafb, #ffffff);
        }

        .rbc-agenda-event-cell {
          padding: 14px 16px;
        }

        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .rbc-time-header {
          border-bottom: 2px solid #e5e7eb;
        }

        .rbc-time-content {
          border-top: none;
        }

        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }

        .rbc-show-more {
          background-color: transparent;
          color: #2563eb;
          font-weight: 600;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .rbc-show-more:hover {
          background-color: #dbeafe;
          color: #1d4ed8;
        }

        .rbc-label {
          color: #000000 !important;
        }
      `}</style>

      <div className="">
        <div className={`${isMobile ? "h-[500px]" : "h-[650px]"}`}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
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
            onSelectEvent={(event) => {
              setSelectedDateForModal(event.start);
              setDayModalOpen(true);
            }}
            selectable
            onSelectSlot={(slotInfo) => {
              if (isMobile) {
                setSelectedDateForModal(slotInfo.start);
                setDayModalOpen(true);
              } else {
                setDate(slotInfo.start);
                setView(Views.DAY);
              }
            }}
            onDrillDown={(date) => {
              if (isMobile) {
                setSelectedDateForModal(date);
                setDayModalOpen(true);
              } else {
                setDate(date);
                setView(Views.DAY);
              }
            }}
            components={{
              event: CustomEvent,
              toolbar: CustomToolbar,
            }}
            popup
            popupOffset={{ x: 10, y: 10 }}
          />
        </div>
      </div>

      {selectedDateForModal && (
        <DayAppointmentsModal
          isOpen={dayModalOpen}
          onClose={() => setDayModalOpen(false)}
          date={selectedDateForModal}
          appointments={items.filter((item) =>
            isSameDay(parseDateTime(item.date, item.time), selectedDateForModal)
          )}
          onEdit={(item) => {
            setDayModalOpen(false);
            onEventClick(item);
          }}
          onDelete={(itemId) => {
            if (onDelete) onDelete(itemId);
          }}
        />
      )}
    </div>
  );
}
