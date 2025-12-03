/**
 * Centralized formatting utilities
 * Consolidates formatting logic scattered across multiple components
 */

/**
 * Format number as currency (Dominican Pesos)
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "$0.00";

  return `$${amount.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "0";

  return num.toLocaleString("es-DO");
};

/**
 * Format file size (bytes to human-readable)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format phone number (basic formatting)
 */
export const formatPhoneNumber = (phone: string | undefined | null): string => {
  if (!phone) return "";

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return "";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format status text
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    active: "Activo",
    inactive: "Inactivo",
  };

  return statusMap[status] || capitalize(status);
};
