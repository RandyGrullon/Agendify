/**
 * Reusable loading spinner component
 * Replaces duplicate loading states in multiple pages
 */
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-12 w-12 border-2",
  xl: "h-16 w-16 border-4",
};

export default function LoadingSpinner({
  size = "lg",
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]}`}
      />
      {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner() {
  return (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
  );
}
