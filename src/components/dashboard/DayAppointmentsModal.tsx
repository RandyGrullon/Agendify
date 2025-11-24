import { useState, useEffect } from "react";
import { AgendaItem } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Search, Edit2, Trash2, Calendar, Clock, User, DollarSign, MapPin, ChevronLeft } from "lucide-react";

interface DayAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  appointments: AgendaItem[];
  onEdit: (item: AgendaItem) => void;
  onDelete: (itemId: string) => void;
}

export default function DayAppointmentsModal({
  isOpen,
  onClose,
  date,
  appointments,
  onEdit,
  onDelete,
}: DayAppointmentsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

  // Reset state when modal opens/closes or date changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setSearchQuery("");
    }
  }, [isOpen, date]);

  if (!isOpen) return null;

  const filteredAppointments = appointments.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.client.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query)
    );
  });

  const handleEdit = (item: AgendaItem) => {
    onEdit(item);
    // Optionally close modal or keep it open? Usually editing closes the view or opens a form on top.
    // Let's assume the parent handles the form opening.
  };

  const handleDelete = (itemId: string) => {
    onDelete(itemId);
    setSelectedItem(null); // Go back to list if deleted
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            {selectedItem && (
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors mr-1"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-800">
              {selectedItem ? "Detalles de la Cita" : format(date, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {!selectedItem ? (
            /* List View */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cita..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No hay citas encontradas para este día.
                  </div>
                ) : (
                  filteredAppointments.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                          {item.client}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{item.service}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          item.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'pending' ? 'Pendiente' :
                           item.status === 'confirmed' ? 'Confirmado' :
                           item.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Detail View */
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedItem.client}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horario</p>
                    <p className="font-medium text-gray-900">
                      {format(date, "d 'de' MMMM, yyyy", { locale: es })} • {selectedItem.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Servicio</p>
                    <p className="font-medium text-gray-900">{selectedItem.service}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Precio Cotizado</p>
                    <p className="font-medium text-gray-900">
                      ${selectedItem.quotedAmount.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>

                {selectedItem.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ubicación</p>
                      <p className="font-medium text-gray-900">{selectedItem.location}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => handleEdit(selectedItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit2 size={18} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
