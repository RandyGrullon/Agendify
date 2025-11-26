'use client';

import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Package, Download, Briefcase } from 'lucide-react';
import { CatalogItem, CatalogItemType } from '@/types';
import { createCatalogItem, updateCatalogItem } from '@/services/catalog';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

// Schema dinámico basado en el tipo de ítem
const catalogItemSchema = z.object({
    type: z.enum(['storable', 'digital', 'service']),
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0').optional().or(z.nan()),

    // Campos para Almacenables
    stock: z.number().optional(),
    minStock: z.number().optional(),
    sku: z.string().optional(),
    unit: z.string().optional(),

    // Campos para Digitales
    downloadUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    fileSize: z.string().optional(),
    format: z.string().optional(),

    // Campos para Servicios
    duration: z.number().optional(),
});

type CatalogItemFormData = z.infer<typeof catalogItemSchema>;

interface CatalogItemFormProps {
    isOpen: boolean;
    onClose: () => void;
    itemToEdit?: CatalogItem | null;
    onSuccess?: (item: CatalogItem) => void;
    initialName?: string;
    enabledTypes?: CatalogItemType[];
}

export default function CatalogItemForm({ isOpen, onClose, itemToEdit, onSuccess, initialName = '', enabledTypes = ['storable', 'digital', 'service'] }: CatalogItemFormProps) {
    const { user } = useAuth();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CatalogItemFormData>({
        resolver: zodResolver(catalogItemSchema),
        defaultValues: {
            type: 'service',
            name: initialName,
            description: '',
            duration: 60,
        }
    });

    const selectedType = watch('type');

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setValue('type', itemToEdit.type);
                setValue('name', itemToEdit.name);
                setValue('description', itemToEdit.description || '');
                setValue('price', itemToEdit.price);

                // Campos específicos por tipo
                if (itemToEdit.type === 'storable') {
                    setValue('stock', itemToEdit.stock);
                    setValue('minStock', itemToEdit.minStock);
                    setValue('sku', itemToEdit.sku);
                    setValue('unit', itemToEdit.unit);
                } else if (itemToEdit.type === 'digital') {
                    setValue('downloadUrl', itemToEdit.downloadUrl);
                    setValue('fileSize', itemToEdit.fileSize);
                    setValue('format', itemToEdit.format);
                } else if (itemToEdit.type === 'service') {
                    setValue('duration', itemToEdit.duration);
                }
            } else {
                reset({
                    type: 'service',
                    name: initialName || '',
                    description: '',
                    duration: 60,
                });
            }
        }
    }, [isOpen, itemToEdit, setValue, reset, initialName]);

    const onSubmit = async (data: CatalogItemFormData) => {
        if (!user) return;

        try {
            // Limpiar campos que no corresponden al tipo seleccionado
            const cleanedData: any = {
                type: data.type,
                name: data.name,
                description: data.description,
                price: isNaN(data.price as any) ? 0 : data.price,
            };

            if (data.type === 'storable') {
                cleanedData.stock = data.stock;
                cleanedData.minStock = data.minStock;
                cleanedData.sku = data.sku;
                cleanedData.unit = data.unit;
            } else if (data.type === 'digital') {
                cleanedData.downloadUrl = data.downloadUrl;
                cleanedData.fileSize = data.fileSize;
                cleanedData.format = data.format;
            } else if (data.type === 'service') {
                cleanedData.duration = data.duration;
            }

            if (itemToEdit) {
                await updateCatalogItem(user.uid, itemToEdit.id, cleanedData);
                toast.success('Ítem actualizado exitosamente');
                if (onSuccess) onSuccess({ ...itemToEdit, ...cleanedData });
            } else {
                const docRef = await createCatalogItem(user.uid, cleanedData);
                toast.success('Ítem creado exitosamente');
                if (onSuccess) onSuccess({ ...cleanedData, id: docRef.id, userId: user.uid, createdAt: Date.now(), updatedAt: Date.now() });
            }
            onClose();
            reset();
        } catch (error) {
            console.error('Error saving catalog item:', error);
            toast.error('Error al guardar el ítem');
        }
    };

    const getTypeIcon = (type: CatalogItemType) => {
        switch (type) {
            case 'storable':
                return <Package className="w-5 h-5" />;
            case 'digital':
                return <Download className="w-5 h-5" />;
            case 'service':
                return <Briefcase className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: CatalogItemType) => {
        switch (type) {
            case 'storable':
                return 'Almacenable';
            case 'digital':
                return 'Digital';
            case 'service':
                return 'Servicio';
        }
    };

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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {itemToEdit ? 'Editar Ítem del Catálogo' : 'Nuevo Ítem del Catálogo'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    {/* Selector de Tipo */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Tipo de Ítem <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`grid gap-3 ${enabledTypes.length === 1 ? 'grid-cols-1' : enabledTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                            {enabledTypes.map((type) => (
                                                <label
                                                    key={type}
                                                    className={`
                                                        relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all
                                                        ${selectedType === type
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-300 hover:border-gray-400 bg-white'
                                                        }
                                                    `}
                                                >
                                                    <input
                                                        {...register('type')}
                                                        type="radio"
                                                        value={type}
                                                        className="sr-only"
                                                    />
                                                    <div className={`mb-2 ${selectedType === type ? 'text-blue-600' : 'text-gray-600'}`}>
                                                        {getTypeIcon(type)}
                                                    </div>
                                                    <span className={`text-sm font-medium ${selectedType === type ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {getTypeLabel(type)}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Campos Comunes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            placeholder={
                                                selectedType === 'storable' ? 'Ej: Producto X' :
                                                    selectedType === 'digital' ? 'Ej: Ebook Premium' :
                                                        'Ej: Corte de Cabello'
                                            }
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Descripción
                                        </label>
                                        <textarea
                                            {...register('description')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            placeholder="Detalles del ítem..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Precio <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                {...register('price', { valueAsNumber: true })}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            />
                                        </div>
                                        {errors.price && (
                                            <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                                        )}
                                    </div>

                                    {/* Campos específicos para Almacenables */}
                                    {selectedType === 'storable' && (
                                        <div className="border-t pt-4 space-y-4">
                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Información de Inventario
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        SKU
                                                    </label>
                                                    <input
                                                        {...register('sku')}
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="Código del producto"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Unidad
                                                    </label>
                                                    <input
                                                        {...register('unit')}
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="Ej: unidad, kg, litro"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Stock Actual
                                                    </label>
                                                    <input
                                                        {...register('stock', { valueAsNumber: true })}
                                                        type="number"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Stock Mínimo
                                                    </label>
                                                    <input
                                                        {...register('minStock', { valueAsNumber: true })}
                                                        type="number"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Campos específicos para Digitales */}
                                    {selectedType === 'digital' && (
                                        <div className="border-t pt-4 space-y-4">
                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Download className="w-4 h-4" />
                                                Información Digital
                                            </h4>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                    URL de Descarga
                                                </label>
                                                <input
                                                    {...register('downloadUrl')}
                                                    type="url"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                    placeholder="https://ejemplo.com/archivo"
                                                />
                                                {errors.downloadUrl && (
                                                    <p className="text-red-500 text-xs mt-1">{errors.downloadUrl.message}</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Tamaño del Archivo
                                                    </label>
                                                    <input
                                                        {...register('fileSize')}
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="Ej: 2.5 MB"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                        Formato
                                                    </label>
                                                    <input
                                                        {...register('format')}
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                        placeholder="Ej: PDF, MP4, ZIP"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Campos específicos para Servicios */}
                                    {selectedType === 'service' && (
                                        <div className="border-t pt-4 space-y-4">
                                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                Información del Servicio
                                            </h4>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                    Duración (minutos)
                                                </label>
                                                <input
                                                    {...register('duration', { valueAsNumber: true })}
                                                    type="number"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                    placeholder="60"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Guardando...' : (itemToEdit ? 'Actualizar' : 'Crear')}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
