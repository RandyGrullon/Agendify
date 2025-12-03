import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Centralized date utility functions
 * Consolidates date parsing logic from AgendaForm, ImportDialog
 */

/**
 * Safely parse various date formats into a Date object
 * Handles: ISO strings, timestamps, Excel serial dates, null/undefined
 */
export const parseDateSafely = (
  dateValue: string | number | Date | null | undefined
): Date => {
  if (!dateValue) return new Date();

  try {
    // Already a Date object
    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : new Date();
    }

    // Excel serial date (number between 1 and 60000)
    if (typeof dateValue === "number") {
      if (dateValue > 60000) {
        // Likely a timestamp
        return new Date(dateValue);
      }
      // Excel date: days since December 30, 1899
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + dateValue * 86400000);
    }

    // String: try various formats
    if (typeof dateValue === "string") {
      // ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const parsed = parse(dateValue, "yyyy-MM-dd", new Date());
        return isValid(parsed) ? parsed : new Date();
      }

      // DD/MM/YYYY format
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
        const parsed = parse(dateValue, "dd/MM/yyyy", new Date());
        return isValid(parsed) ? parsed : new Date();
      }

      // Try native Date parsing as fallback
      const parsed = new Date(dateValue);
      return isValid(parsed) ? parsed : new Date();
    }

    return new Date();
  } catch (error) {
    console.error("Error parsing date:", error);
    return new Date();
  }
};

/**
 * Format date for display
 */
export const formatDate = (
  date: string | number | Date | null | undefined,
  formatStr: string = "d MMM yyyy"
): string => {
  try {
    const parsedDate = parseDateSafely(date);
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    return "Fecha inválida";
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (
  date: string | number | Date | null | undefined
): string => {
  try {
    const parsedDate = parseDateSafely(date);
    return format(parsedDate, "yyyy-MM-dd");
  } catch (error) {
    return format(new Date(), "yyyy-MM-dd");
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (
  date: string | number | Date | null | undefined,
  time?: string
): string => {
  const dateStr = formatDate(date, "d MMM yyyy");
  if (time) {
    return `${dateStr} ${time}`;
  }
  return dateStr;
};

/**
 * Check if date is today
 */
export const isToday = (date: string | number | Date): boolean => {
  try {
    const parsedDate = parseDateSafely(date);
    const today = new Date();
    return format(parsedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  } catch {
    return false;
  }
};

/**
 * Check if date is in the past
 */
export const isPast = (date: string | number | Date): boolean => {
  try {
    const parsedDate = parseDateSafely(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsedDate < today;
  } catch {
    return false;
  }
};

/**
 * Get relative date string (e.g., "Hoy", "Mañana", "3 días")
 */
export const getRelativeDateString = (date: string | number | Date): string => {
  try {
    const parsedDate = parseDateSafely(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(parsedDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays === -1) return "Ayer";
    if (diffDays > 0) return `En ${diffDays} días`;
    return `Hace ${Math.abs(diffDays)} días`;
  } catch {
    return "";
  }
};
