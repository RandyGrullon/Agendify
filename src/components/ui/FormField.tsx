import { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Reusable form field component to eliminate duplicate input patterns
 * Replaces label + input + error pattern repeated across all forms
 */
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: { message?: string };
  required?: boolean;
  helpText?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, helpText, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          className={`w-full px-4 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
          {...props}
        />
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
