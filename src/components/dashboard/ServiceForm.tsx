'use client';

import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { Service } from '@/types';
import { createService, updateService } from '@/services/service';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

const serviceSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    duration: z.number().min(1, 'La duración debe ser al menos 1 minuto'),
    type: z.literal('service'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    serviceToEdit?: Service | null;
    onSuccess?: (service: Service) => void;
    initialName?: string;
}

export default function ServiceForm({ isOpen, onClose, serviceToEdit, onSuccess, initialName = '' }: ServiceFormProps) {
    const { user } = useAuth();
    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: initialName,
            description: '',
            price: 0,
            duration: 60,
            type: 'service',
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (serviceToEdit) {
                setValue('name', serviceToEdit.name);
                setValue('description', serviceToEdit.description || '');
                setValue('price', serviceToEdit.price);
                setValue('duration', serviceToEdit.duration || 60);
            } else {
                reset({
                    name: initialName || '',
                    description: '',
                    price: 0,
                    duration: 60,
                    type: 'service',
                });
            }
        }
    }, [isOpen, serviceToEdit, setValue, reset, initialName]);

    const onSubmit = async (data: ServiceFormData) => {
        if (!user) return;

        try {
            if (serviceToEdit) {
                await updateService(user.uid, serviceToEdit.id, data);
                toast.success('Servicio actualizado exitosamente');
                if (onSuccess) onSuccess({ ...serviceToEdit, ...data });
            } else {
                const docRef = await createService(user.uid, data);
                toast.success('Servicio creado exitosamente');
                if (onSuccess) onSuccess({ ...data, id: docRef.id, userId: user.uid, createdAt: Date.now(), updatedAt: Date.now(), type: 'service' });
            }
            onClose();
            reset();
        } catch (error) {
            console.error('Error saving service:', error);
            toast.error('Error al guardar el servicio');
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {serviceToEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Nombre del Servicio <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            placeholder="Ej: Corte de Cabello"
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
                                            placeholder="Detalles del servicio..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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
                                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                                />
                                            </div>
                                            {errors.price && (
                                                <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                Duración (min) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                {...register('duration', { valueAsNumber: true })}
                                                type="number"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            />
                                            {errors.duration && (
                                                <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>
                                            )}
                                        </div>
                                    </div>

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
                                            {isSubmitting ? 'Guardando...' : (serviceToEdit ? 'Actualizar' : 'Crear')}
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
