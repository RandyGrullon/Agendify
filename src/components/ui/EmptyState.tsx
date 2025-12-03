import { ReactNode } from 'react';

/**
 * Reusable empty state component
 * Replaces duplicate empty state patterns in tables
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title = 'No hay datos',
  message = 'No se encontraron elementos',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
