import { ReactNode } from 'react';

/**
 * Reusable badge component for status indicators
 * Replaces duplicate badge patterns across tables and cards
 */
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

/**
 * Predefined status badges for common use cases
 */
export const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<
    string,
    { variant: BadgeProps['variant']; label: string }
  > = {
    pending: { variant: 'warning', label: 'Pendiente' },
    confirmed: { variant: 'info', label: 'Confirmado' },
    completed: { variant: 'success', label: 'Completado' },
    cancelled: { variant: 'danger', label: 'Cancelado' },
    active: { variant: 'success', label: 'Activo' },
    inactive: { variant: 'default', label: 'Inactivo' },
  };

  const config = statusConfig[status] || {
    variant: 'default' as const,
    label: status,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
