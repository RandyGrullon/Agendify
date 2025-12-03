import { z } from "zod";

/**
 * Shared validation schemas to eliminate duplication across forms
 * Used in ClientForm, CollaboratorForm, ServiceForm, CatalogItemForm
 */

export const commonValidators = {
  email: z.string().email("Email inválido").optional().or(z.literal("")),

  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, "Formato de teléfono inválido")
    .min(10, "Teléfono debe tener al menos 10 dígitos")
    .optional()
    .or(z.literal("")),

  url: z.string().url("URL inválida").optional().or(z.literal("")),

  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName} es requerido`),

  optionalString: z.string().optional().or(z.literal("")),

  positiveNumber: (fieldName: string) =>
    z
      .number({ message: `${fieldName} debe ser un número` })
      .positive(`${fieldName} debe ser mayor a 0`),

  nonNegativeNumber: (fieldName: string) =>
    z
      .number({ message: `${fieldName} debe ser un número` })
      .nonnegative(`${fieldName} no puede ser negativo`),

  price: z
    .number({ message: "El precio debe ser un número" })
    .nonnegative("El precio no puede ser negativo"),

  stock: z
    .number({ message: "El stock debe ser un número" })
    .int("El stock debe ser un número entero")
    .nonnegative("El stock no puede ser negativo")
    .optional(),
};

/**
 * Common schema patterns
 */
export const createNameSchema = (entityName: string) =>
  z.object({
    name: commonValidators.requiredString(entityName),
  });

export const createContactSchema = () =>
  z.object({
    email: commonValidators.email,
    phone: commonValidators.phone,
  });
