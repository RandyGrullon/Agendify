import { ButtonHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

/**
 * Reusable action button component
 * Replaces duplicate action button patterns in tables
 */
interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "success";
  tooltip?: string;
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "text-blue-600 hover:text-blue-900 hover:bg-blue-100",
  secondary: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  danger: "text-red-600 hover:text-red-900 hover:bg-red-100",
  success: "text-green-600 hover:text-green-900 hover:bg-green-100",
};

const sizeClasses = {
  sm: "p-1",
  md: "p-2",
  lg: "p-3",
};

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 20,
};

export default function ActionButton({
  icon: Icon,
  variant = "primary",
  tooltip,
  size = "md",
  className = "",
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg transition-colors ${className}`}
      title={tooltip}
      {...props}
    >
      <Icon size={iconSizes[size]} />
    </button>
  );
}

/**
 * Action button group for consistent spacing
 */
interface ActionButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ActionButtonGroup({
  children,
  className = "",
}: ActionButtonGroupProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>{children}</div>
  );
}
