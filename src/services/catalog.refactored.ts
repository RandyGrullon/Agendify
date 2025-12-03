import { FirestoreService } from "@/lib/firestoreService";
import { CatalogItem } from "@/types";

/**
 * Catalog service using generic FirestoreService
 * Handles all catalog item types: storable, digital, service
 */
export const catalogService = new FirestoreService<CatalogItem>(
  "catalog",
  "name",
  "asc"
);

// Legacy function exports for backward compatibility

export const subscribeToCatalog = (
  userId: string,
  callback: (items: CatalogItem[]) => void
) => catalogService.subscribe(userId, callback);

export const createCatalogItem = async (
  userId: string,
  itemData: Omit<CatalogItem, "id" | "userId" | "createdAt" | "updatedAt">
) => catalogService.create(userId, itemData);

export const updateCatalogItem = async (
  userId: string,
  itemId: string,
  itemData: Partial<CatalogItem>
) => catalogService.update(userId, itemId, itemData);

export const deleteCatalogItem = async (userId: string, itemId: string) =>
  catalogService.delete(userId, itemId);

export const getCatalogItemById = async (userId: string, itemId: string) =>
  catalogService.getById(userId, itemId);

export const searchCatalogItems = async (userId: string, searchTerm: string) =>
  catalogService.search(userId, searchTerm, ["name", "description", "sku"]);

/**
 * Search catalog items by type
 */
export const searchCatalogByType = async (
  userId: string,
  searchTerm: string,
  type: "storable" | "digital" | "service"
) => {
  const allItems = await catalogService.search(userId, searchTerm, [
    "name",
    "description",
  ]);
  return allItems.filter((item) => item.type === type);
};
