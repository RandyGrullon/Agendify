import { TextareaHTMLAttributes, forwardRef } from "react";

/**
 * Reusable textarea field component
 */
interface FormTextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: { message?: string };
  required?: boolean;
  helpText?: string;
}

const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  (
    { label, error, required, helpText, className = "", rows = 3, ...props },
    ref
  ) => {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full px-4 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${className}`}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    );
  }
);

FormTextArea.displayName = "FormTextArea";

export default FormTextArea;
