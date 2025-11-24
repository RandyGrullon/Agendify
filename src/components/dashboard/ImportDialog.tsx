'use client';

import { useState, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AgendaItem } from '@/types';
import { toast } from 'sonner';

interface ImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: Omit<AgendaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

interface ParsedRow {
    data: Partial<AgendaItem>;
    errors: string[];
    index: number;
}

export default function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
    const [dragActive, setDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [fileName, setFileName] = useState('');

    const validateRow = (row: any, index: number): ParsedRow => {
        const errors: string[] = [];
        const data: Partial<AgendaItem> = {};

        // Required fields
        // Support both new uppercase headers and old lowercase ones for backward compatibility
        if (!row['FECHA'] && !row.fecha && !row.date) {
            errors.push('Fecha requerida');
        } else {
            data.date = row['FECHA'] || row.fecha || row.date;
        }

        if (!row['HORARIO'] && !row.hora && !row.time) {
            errors.push('Hora requerida');
        } else {
            data.time = row['HORARIO'] || row.hora || row.time;
        }

        if (!row['CLIENTE'] && !row.cliente && !row.client) {
            errors.push('Cliente requerido');
        } else {
            data.client = row['CLIENTE'] || row.cliente || row.client;
        }

        if (!row['TIPO DE SERVICIO'] && !row.servicio && !row.service) {
            errors.push('Servicio requerido');
        } else {
            data.service = row['TIPO DE SERVICIO'] || row.servicio || row.service;
        }

        // Optional fields
        data.location = row['LUGAR'] || row.ubicacion || row.location || '';
        data.peopleCount = parseInt(row['CANT. PERSONAS'] || row.personas || row.peopleCount || '1');
        data.quotedAmount = parseFloat(row['MONTO COTIZACION'] || row.monto || row.quotedAmount || '0');
        data.comments = row['COMENTARIOS'] || row.comentarios || row.comments || '';
        
        // Other fields that might still be useful if present
        data.collaborator = row.colaborador || row.collaborator || '';
        data.myProfit = parseFloat(row.ganancia || row.myProfit || '0');
        data.bank = row.banco || row.bank || '';
        data.collaboratorPayment = parseFloat(row.pagoColaborador || row.collaboratorPayment || '0');
        
        const status = (row['STATUS'] || row.estatus || row.status || 'pending').toLowerCase();
        if (['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            data.status = status as 'pending' | 'confirmed' | 'completed' | 'cancelled';
        } else {
            data.status = 'pending';
        }

        // Validate numbers
        if (isNaN(data.peopleCount) || data.peopleCount < 1) {
            errors.push('Personas debe ser un número mayor a 0');
            data.peopleCount = 1;
        }

        if (isNaN(data.quotedAmount) || data.quotedAmount < 0) {
            errors.push('Monto debe ser un número positivo');
            data.quotedAmount = 0;
        }

        if (isNaN(data.myProfit) || data.myProfit < 0) {
            errors.push('Ganancia debe ser un número positivo');
            data.myProfit = 0;
        }

        if (isNaN(data.collaboratorPayment) || data.collaboratorPayment < 0) {
            errors.push('Pago colaborador debe ser un número positivo');
            data.collaboratorPayment = 0;
        }

        return { data: data as Partial<AgendaItem>, errors, index };
    };

    const parseFile = useCallback((file: File) => {
        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const parsed = jsonData.map((row, index) => validateRow(row, index + 1));
                setParsedData(parsed);

                const validCount = parsed.filter(p => p.errors.length === 0).length;
                const errorCount = parsed.filter(p => p.errors.length > 0).length;

                if (validCount === 0) {
                    toast.error('No se encontraron filas válidas para importar');
                } else {
                    toast.success(`${validCount} filas listas para importar${errorCount > 0 ? `, ${errorCount} con errores` : ''}`);
                }
            } catch (error) {
                console.error('Error al leer archivo:', error);
                toast.error('Error al procesar el archivo');
            }
        };

        reader.readAsBinaryString(file);
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                parseFile(file);
            } else {
                toast.error('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            parseFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        const validRows = parsedData.filter(row => row.errors.length === 0);
        
        if (validRows.length === 0) {
            toast.error('No hay filas válidas para importar');
            return;
        }

        setImporting(true);
        try {
            await onImport(validRows.map(row => row.data as Omit<AgendaItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>));
            toast.success(`${validRows.length} citas importadas exitosamente`);
            setParsedData([]);
            setFileName('');
            onClose();
        } catch (error) {
            console.error('Error al importar:', error);
            toast.error('Error al importar las citas');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                'FECHA': '2024-01-01',
                'HORARIO': '10:00',
                'CLIENTE': 'Juan Pérez',
                'LUGAR': 'Ciudad de México',
                'CANT. PERSONAS': 50,
                'MONTO COTIZACION': 10000,
                'TIPO DE SERVICIO': 'Fotografía',
                'STATUS': 'pending',
                'COMENTARIOS': 'Evento corporativo'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
        XLSX.writeFile(workbook, 'plantilla_citas.xlsx');
        toast.success('Plantilla descargada');
    };

    const validCount = parsedData.filter(p => p.errors.length === 0).length;
    const errorCount = parsedData.filter(p => p.errors.length > 0).length;

    return (
        <Transition appear show={isOpen} as={Fragment}>
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

                <div className="fixed inset-0 overflow-y-auto">
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-2xl font-bold text-gray-900">
                                        Importar Citas
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {parsedData.length === 0 ? (
                                    <div className="space-y-6">
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                                                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                            }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            <FileSpreadsheet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                            <p className="text-lg font-medium text-gray-900 mb-2">
                                                Arrastra tu archivo aquí
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                o haz clic para seleccionar
                                            </p>
                                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                                                <Upload size={20} />
                                                Seleccionar archivo
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv"
                                                    onChange={handleFileInput}
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-4">
                                                Formatos soportados: Excel (.xlsx, .xls) y CSV
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h3 className="font-semibold text-blue-900 mb-2">
                                                Campos requeridos:
                                            </h3>
                                            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                                                <li>FECHA (YYYY-MM-DD)</li>
                                                <li>HORARIO (HH:MM)</li>
                                                <li>CLIENTE</li>
                                                <li>TIPO DE SERVICIO</li>
                                            </ul>
                                            <button
                                                onClick={downloadTemplate}
                                                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                                            >
                                                Descargar plantilla de ejemplo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileSpreadsheet size={24} className="text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{fileName}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {validCount} válidas, {errorCount} con errores
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setParsedData([]);
                                                    setFileName('');
                                                }}
                                                className="text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Cambiar archivo
                                            </button>
                                        </div>

                                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errores</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {parsedData.map((row) => (
                                                        <tr key={row.index} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{row.index}</td>
                                                            <td className="px-4 py-3">
                                                                {row.errors.length === 0 ? (
                                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                                ) : (
                                                                    <AlertCircle size={18} className="text-red-600" />
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {row.data.date} {row.data.time}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{row.data.client}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">{row.data.service}</td>
                                                            <td className="px-4 py-3 text-sm text-red-600">
                                                                {row.errors.join(', ')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                onClick={onClose}
                                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
                                                disabled={importing}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleImport}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={importing || validCount === 0}
                                            >
                                                {importing ? 'Importando...' : `Importar ${validCount} citas`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
