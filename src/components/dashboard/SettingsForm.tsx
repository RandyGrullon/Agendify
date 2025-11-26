'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BusinessSettings, CatalogItemType } from '@/types';
import { Save, Building2, Phone, Mail, MapPin, Globe, FileText, Package, Download, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const settingsSchema = z.object({
    businessName: z.string().min(1, 'Nombre del negocio requerido'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    taxId: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
    initialSettings?: BusinessSettings | null;
    onSave: (data: SettingsFormData & { enabledCatalogTypes: CatalogItemType[] }) => Promise<void>;
}

export default function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enabledTypes, setEnabledTypes] = useState<CatalogItemType[]>(
        initialSettings?.enabledCatalogTypes || ['service']
    );

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
        },
    });

    useEffect(() => {
        if (initialSettings) {
            reset(initialSettings);
            setEnabledTypes(initialSettings.enabledCatalogTypes || ['service']);
        }
    }, [initialSettings, reset]);

    const toggleCatalogType = (type: CatalogItemType) => {
        setEnabledTypes(prev => {
            const isEnabled = prev.includes(type);

            if (isEnabled) {
                // Don't allow removing all types
                if (prev.length === 1) {
                    toast.error('Debe tener al menos un tipo de catálogo habilitado');
                    return prev;
                }
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const catalogTypes: { type: CatalogItemType; label: string; icon: any; description: string }[] = [
        {
            type: 'storable',
            label: 'Almacenables',
            icon: Package,
            description: 'Productos físicos con inventario'
        },
        {
            type: 'digital',
            label: 'Digitales',
            icon: Download,
            description: 'Productos digitales descargables'
        },
        {
            type: 'service',
            label: 'Servicios',
            icon: Briefcase,
            description: 'Servicios con duración y citas'
        },
    ];

    const onSubmit = async (data: SettingsFormData) => {
        setIsSubmitting(true);
        try {
            await onSave({ ...data, enabledCatalogTypes: enabledTypes });
            toast.success('Configuración guardada');
        } catch (error) {
            toast.error('Error al guardar configuración');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Catalog Types Section */}
            <div className="pt-6 border-t border-gray-200">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Tipos de Catálogo</h3>
                    <p className="text-sm text-gray-600">Selecciona los tipos de ítems que manejarás en tu negocio</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {catalogTypes.map(({ type, label, icon: Icon, description }) => {
                        const isEnabled = enabledTypes.includes(type);

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleCatalogType(type)}
                                className={`
                                        relative p-4 rounded-lg border-2 transition-all text-left
                                        ${isEnabled
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                    }
                                    `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`
                                            p-2 rounded-lg
                                            ${isEnabled ? 'bg-blue-500' : 'bg-gray-200'}
                                        `}>
                                        <Icon className={`w-5 h-5 ${isEnabled ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-semibold ${isEnabled ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {label}
                                            </h4>
                                            {isEnabled && (
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 ${isEnabled ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
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
        </form >
    );
}
