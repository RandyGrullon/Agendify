'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BusinessSettings } from '@/types';
import { Save, Building2, Phone, Mail, MapPin, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

const settingsSchema = z.object({
    businessName: z.string().min(1, 'Nombre del negocio requerido'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    taxId: z.string().optional(),
    footerMessage: z.string().max(200, 'Mensaje muy largo').optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
    initialSettings?: BusinessSettings | null;
    onSave: (data: SettingsFormData) => Promise<void>;
}

export default function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialSettings || {
            businessName: '',
            phone: '',
            email: '',
            address: '',
            website: '',
            taxId: '',
            footerMessage: '¡Gracias por su preferencia!',
        },
    });

    useEffect(() => {
        if (initialSettings) {
            reset(initialSettings);
        }
    }, [initialSettings, reset]);

    const onSubmit = async (data: SettingsFormData) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            toast.success('Configuración guardada');
        } catch (error) {
            toast.error('Error al guardar configuración');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <Building2 className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Información del Negocio</h2>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Nombre del Negocio <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        {...register('businessName')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Mi Empresa S.A."
                    />
                    {errors.businessName && (
                        <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" /> Teléfono
                        </label>
                        <input
                            type="tel"
                            {...register('phone')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="+52 555 123 4567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" /> Email de Contacto
                        </label>
                        <input
                            type="email"
                            {...register('email')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="contacto@miempresa.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" /> Dirección
                    </label>
                    <input
                        type="text"
                        {...register('address')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Av. Principal 123, Centro"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <Globe size={16} className="text-gray-400" /> Sitio Web
                        </label>
                        <input
                            type="url"
                            {...register('website')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="https://miempresa.com"
                        />
                        {errors.website && (
                            <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" /> RFC / Tax ID
                        </label>
                        <input
                            type="text"
                            {...register('taxId')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                            placeholder="XAXX010101000"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Mensaje al pie del recibo
                    </label>
                    <textarea
                        {...register('footerMessage')}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-500"
                        placeholder="Gracias por su compra. ¡Vuelva pronto!"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este mensaje aparecerá en la parte inferior de los PDFs generados.</p>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </form>
    );
}
