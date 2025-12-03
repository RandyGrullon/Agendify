'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client } from '@/types';
import { commonValidators } from '@/lib/validationSchemas';
import { BaseModal, FormField, FormTextArea } from '@/components/ui';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';

const clientSchema = z.object({
    name: commonValidators.requiredString('Nombre').max(100, 'Nombre muy largo'),
    email: commonValidators.email,
    phone: commonValidators.phone,
    address: z.string().max(200, 'Dirección muy larga').optional(),
    notes: z.string().max(500, 'Notas muy largas').optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    initialData?: Client | null;
    title?: string;
    initialName?: string;
}

export default function ClientForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title = 'Nuevo Cliente',
    initialName = '',
}: ClientFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: initialData || { name: initialName },
    });

    useEffect(() => {
        if (isOpen) {
            reset(initialData || {
                name: initialName,
                email: '',
                phone: '',
                address: '',
                notes: '',
            });
        }
    }, [isOpen, initialData, reset, initialName]);

    const handleFormSubmit = async (data: ClientFormData) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch (error) {
            console.error('Error al guardar cliente:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <FormField
                    label="Nombre"
                    required
                    type="text"
                    placeholder="Juan Pérez"
                    error={errors.name}
                    {...register('name')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label="Teléfono"
                        type="tel"
                        placeholder="+52 123 456 7890"
                        error={errors.phone}
                        {...register('phone')}
                    />

                    <FormField
                        label="Email"
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        error={errors.email}
                        {...register('email')}
                    />
                </div>

                <FormField
                    label="Dirección"
                    type="text"
                    placeholder="Calle 123, Ciudad"
                    error={errors.address}
                    {...register('address')}
                />

                <FormTextArea
                    label="Notas"
                    placeholder="Información adicional del cliente..."
                    error={errors.notes}
                    {...register('notes')}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <ButtonSpinner />}
                        {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Cliente'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
}
