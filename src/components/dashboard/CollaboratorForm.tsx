'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Collaborator } from '@/types';

const collaboratorSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100, 'Nombre muy largo'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono inválido')
        .min(10, 'Teléfono debe tener al menos 10 dígitos')
        .optional()
        .or(z.literal('')),
    notes: z.string().max(500, 'Notas muy largas').optional(),
});

type CollaboratorFormData = z.infer<typeof collaboratorSchema>;

interface CollaboratorFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Collaborator, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    initialData?: Collaborator | null;
}

export default function CollaboratorForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}: CollaboratorFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CollaboratorFormData>({
        resolver: zodResolver(collaboratorSchema),
        defaultValues: initialData || {
            name: '',
            email: '',
            phone: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            reset(initialData || {
                name: '',
                email: '',
                phone: '',
                notes: '',
            });
        }
    }, [isOpen, initialData, reset]);

    const handleFormSubmit = async (data: CollaboratorFormData) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch (error) {
            console.error('Error al guardar colaborador:', error);
        } finally {
            setIsSubmitting(false);
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-2xl font-bold text-gray-900">
                                        {initialData ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            placeholder="María García"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                {...register('phone')}
                                                placeholder="+52 123 456 7890"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                {...register('email')}
                                                placeholder="maria@email.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                                            Notas
                                        </label>
                                        <textarea
                                            {...register('notes')}
                                            rows={3}
                                            placeholder="Información adicional sobre el colaborador..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500 resize-none"
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Colaborador'}
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
