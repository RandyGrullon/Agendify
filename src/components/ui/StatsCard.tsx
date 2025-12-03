import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Reusable stats card component
 * Replaces duplicate stats card patterns in dashboard pages
 */
interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo' | 'pink' | 'orange';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    icon: 'bg-blue-500',
    text: 'text-blue-700',
    value: 'text-blue-900',
  },
  green: {
    bg: 'from-green-50 to-green-100',
    border: 'border-green-200',
    icon: 'bg-green-500',
    text: 'text-green-700',
    value: 'text-green-900',
  },
  purple: {
    bg: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    icon: 'bg-purple-500',
    text: 'text-purple-700',
    value: 'text-purple-900',
  },
  red: {
    bg: 'from-red-50 to-red-100',
    border: 'border-red-200',
    icon: 'bg-red-500',
    text: 'text-red-700',
    value: 'text-red-900',
  },
  yellow: {
    bg: 'from-yellow-50 to-yellow-100',
    border: 'border-yellow-200',
    icon: 'bg-yellow-500',
    text: 'text-yellow-700',
    value: 'text-yellow-900',
  },
  indigo: {
    bg: 'from-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    icon: 'bg-indigo-500',
    text: 'text-indigo-700',
    value: 'text-indigo-900',
  },
  pink: {
    bg: 'from-pink-50 to-pink-100',
    border: 'border-pink-200',
    icon: 'bg-pink-500',
    text: 'text-pink-700',
    value: 'text-pink-900',
  },
  orange: {
    bg: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    icon: 'bg-orange-500',
    text: 'text-orange-700',
    value: 'text-orange-900',
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
}: StatsCardProps) {
  const classes = colorClasses[color];

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      onClick={onClick}
      className={`bg-gradient-to-br ${classes.bg} rounded-lg p-4 border ${classes.border} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      } w-full text-left`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-3 ${classes.icon} rounded-lg flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${classes.text} font-medium`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${classes.value} truncate`}>
              {value}
            </p>
            {trend && (
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}
