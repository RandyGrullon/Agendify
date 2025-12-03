import { SelectHTMLAttributes, forwardRef } from "react";

/**
 * Reusable select field component
 */
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: { message?: string };
  required?: boolean;
  helpText?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      required,
      helpText,
      options,
      placeholder,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={`w-full px-4 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
