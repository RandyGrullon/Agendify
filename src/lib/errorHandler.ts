import { toast } from "sonner";

/**
 * Centralized error handling utilities
 * Consolidates error handling logic from multiple components
 */

/**
 * Firestore error codes and their user-friendly messages
 */
const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  "permission-denied": "No tienes permisos para realizar esta acción",
  "not-found": "El recurso solicitado no fue encontrado",
  "already-exists": "Este elemento ya existe",
  unauthenticated: "Debes iniciar sesión para continuar",
  "resource-exhausted": "Se ha excedido el límite de uso",
  "failed-precondition": "No se puede completar la operación en este momento",
  aborted: "La operación fue cancelada",
  "out-of-range": "Valor fuera del rango permitido",
  unimplemented: "Esta función no está implementada",
  internal: "Error interno del servidor",
  unavailable: "El servicio no está disponible. Intenta nuevamente",
  "data-loss": "Se perdió información. Contacta soporte",
  cancelled: "Operación cancelada",
  "invalid-argument": "Los datos proporcionados son inválidos",
  "deadline-exceeded": "La operación tomó demasiado tiempo",
};

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (
  error: any,
  defaultMessage: string = "Ocurrió un error inesperado"
): string => {
  // Check if error has a custom message
  if (error?.message && typeof error.message === "string") {
    // Don't expose technical messages directly
    if (
      !error.message.includes("Firebase") &&
      !error.message.includes("Error:")
    ) {
      return error.message;
    }
  }

  // Check for Firestore error codes
  if (error?.code && typeof error.code === "string") {
    const firestoreError = FIRESTORE_ERROR_MESSAGES[error.code];
    if (firestoreError) {
      return firestoreError;
    }
  }

  // Check for network errors
  if (error?.name === "NetworkError" || error?.message?.includes("network")) {
    return "Error de conexión. Verifica tu internet";
  }

  return defaultMessage;
};

/**
 * Handle Firestore errors with toast notification
 */
export const handleFirestoreError = (
  error: any,
  defaultMessage: string = "Error al realizar la operación"
): void => {
  const message = getErrorMessage(error, defaultMessage);
  toast.error(message);
  console.error("Firestore error:", error);
};

/**
 * Handle async operation with loading and error handling
 */
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
  } = {}
): Promise<T | null> => {
  const {
    loadingMessage,
    successMessage,
    errorMessage = "Error al realizar la operación",
    onSuccess,
    onError,
  } = options;

  let toastId: string | number | undefined;

  try {
    if (loadingMessage) {
      toastId = toast.loading(loadingMessage);
    }

    const result = await operation();

    if (toastId) {
      toast.dismiss(toastId);
    }

    if (successMessage) {
      toast.success(successMessage);
    }

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId);
    }

    handleFirestoreError(error, errorMessage);

    if (onError) {
      onError(error);
    }

    return null;
  }
};

/**
 * Validate form data and show errors
 */
export const validateAndShowErrors = (
  errors: Record<string, { message?: string }>
): boolean => {
  const errorMessages = Object.values(errors)
    .map((error) => error.message)
    .filter(Boolean);

  if (errorMessages.length > 0) {
    toast.error(errorMessages[0] || "Por favor corrige los errores");
    return false;
  }

  return true;
};

/**
 * Log error for debugging (only in development)
 */
export const logError = (context: string, error: any): void => {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context}]:`, error);
  }
};
