'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AgendaItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock, DollarSign, User } from 'lucide-react';

// Helper function to safely parse dates
const parseDate = (dateString: string | number | undefined | null): Date => {
    if (!dateString) return new Date();
    
    try {
        // Handle Excel serial dates
        if (typeof dateString === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateString * 86400000);
            if (!isNaN(date.getTime())) return date;
        }
        
        const dateStr = String(dateString);
        
        if (dateStr.includes('T')) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
        }
        
        const date = new Date(dateStr + 'T00:00:00');
        if (!isNaN(date.getTime())) return date;
        
        return new Date();
    } catch {
        return new Date();
    }
};

interface KanbanViewProps {
    items: AgendaItem[];
    onStatusChange: (itemId: string, newStatus: AgendaItem['status']) => void;
    onEventClick: (item: AgendaItem) => void;
}

const COLUMNS = [
    { id: 'pending', title: 'Pendiente', color: 'bg-yellow-100', headerColor: 'text-yellow-800', borderColor: 'border-yellow-200' },
    { id: 'confirmed', title: 'Confirmado', color: 'bg-green-100', headerColor: 'text-green-800', borderColor: 'border-green-200' },
    { id: 'completed', title: 'Completado', color: 'bg-blue-100', headerColor: 'text-blue-800', borderColor: 'border-blue-200' },
    { id: 'cancelled', title: 'Cancelado', color: 'bg-red-100', headerColor: 'text-red-800', borderColor: 'border-red-200' },
];

export default function KanbanView({ items, onStatusChange, onEventClick }: KanbanViewProps) {
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId as AgendaItem['status'];
        onStatusChange(draggableId, newStatus);
    };

    const getItemsByStatus = (status: string) => {
        return items.filter(item => item.status === status);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col lg:flex-row gap-6 pb-4 h-auto lg:h-[calc(100vh-250px)] lg:overflow-x-auto">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="flex-none lg:flex-1 w-full lg:min-w-[300px] flex flex-col bg-gray-50 rounded-lg border border-gray-200 h-auto lg:h-full">
                        <div className={`p-4 border-b ${column.borderColor} ${column.color} rounded-t-lg sticky top-0 z-10 lg:static`}>
                            <h3 className={`font-bold ${column.headerColor} flex justify-between items-center`}>
                                {column.title}
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">
                                    {getItemsByStatus(column.id).length}
                                </span>
                            </h3>
                        </div>
                        
                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`flex-1 p-4 space-y-3 transition-colors min-h-[150px] ${
                                        snapshot.isDraggingOver ? 'bg-gray-100' : ''
                                    } ${
                                        // On mobile, let it grow (overflow-visible). On desktop, scroll (overflow-y-auto).
                                        'overflow-y-visible lg:overflow-y-auto'
                                    }`}
                                >
                                    {getItemsByStatus(column.id).map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => onEventClick(item)}
                                                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer touch-manipulation ${
                                                        snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-2 z-50' : ''
                                                    }`}
                                                    style={provided.draggableProps.style}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-semibold text-gray-900 truncate max-w-[150px]" title={item.client}>
                                                            {item.client}
                                                        </span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                            {item.time}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-2 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-gray-400" />
                                                            <span className="truncate">{item.service}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-gray-400" />
                                                            <span>{format(parseDate(item.date), "d MMM", { locale: es })}</span>
                                                        </div>

                                                        {item.location && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={14} className="text-gray-400" />
                                                                <span className="truncate">{item.location}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-2">
                                                            <DollarSign size={14} className="text-green-600" />
                                                            <span className="font-medium text-gray-900">
                                                                ${item.quotedAmount.toLocaleString('es-MX')}
                                                            </span>
                                                            {(item.deposit || 0) > 0 && (
                                                                <span className="text-xs text-gray-500 ml-auto">
                                                                    Restan: ${(item.quotedAmount - (item.deposit || 0)).toLocaleString('es-MX')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
