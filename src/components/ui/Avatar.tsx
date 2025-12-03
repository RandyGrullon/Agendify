import { getInitials } from "@/lib/formatters";

/**
 * Reusable avatar component
 * Replaces duplicate avatar patterns in tables and cards
 */
interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "green" | "purple" | "red" | "yellow" | "indigo" | "pink";
  src?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
  yellow: "bg-yellow-100 text-yellow-600",
  indigo: "bg-indigo-100 text-indigo-600",
  pink: "bg-pink-100 text-pink-600",
};

export default function Avatar({
  name,
  size = "md",
  color = "blue",
  src,
  className = "",
}: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
