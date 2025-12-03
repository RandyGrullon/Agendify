import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Base interface for all Firestore entities
 */
export interface BaseEntity {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Generic Firestore service for CRUD operations
 * Eliminates duplicate code across client, service, catalog, collaborator services
 */
export class FirestoreService<T extends BaseEntity> {
  constructor(
    private collectionName: string,
    private defaultOrderByField: keyof T = "createdAt" as keyof T,
    private defaultOrderDirection: "asc" | "desc" = "desc"
  ) {}

  /**
   * Subscribe to real-time updates for a collection
   */
  subscribe(
    userId: string,
    callback: (items: T[]) => void,
    orderByField?: keyof T,
    orderDirection?: "asc" | "desc"
  ): () => void {
    const itemsRef = collection(db, this.collectionName, userId, "items");
    const orderField = orderByField || this.defaultOrderByField;
    const direction = orderDirection || this.defaultOrderDirection;

    const q = query(itemsRef, orderBy(orderField as string, direction));

    return onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      callback(items);
    });
  }

  /**
   * Create a new document
   */
  async create(
    userId: string,
    data: Omit<T, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const itemsRef = collection(db, this.collectionName, userId, "items");
    const now = Date.now();

    const newItem = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(itemsRef, newItem);
    return docRef.id;
  }

  /**
   * Update an existing document
   */
  async update(
    userId: string,
    itemId: string,
    data: Partial<Omit<T, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    const itemRef = doc(db, this.collectionName, userId, "items", itemId);

    const updateData = {
      ...data,
      updatedAt: Date.now(),
    };

    return await updateDoc(itemRef, updateData);
  }

  /**
   * Delete a document
   */
  async delete(userId: string, itemId: string): Promise<void> {
    const itemRef = doc(db, this.collectionName, userId, "items", itemId);
    return await deleteDoc(itemRef);
  }

  /**
   * Get a single document by ID
   */
  async getById(userId: string, itemId: string): Promise<T | null> {
    const itemRef = doc(db, this.collectionName, userId, "items", itemId);
    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as T;
  }

  /**
   * Get all documents (use sparingly, prefer subscribe for real-time data)
   */
  async getAll(
    userId: string,
    orderByField?: keyof T,
    orderDirection?: "asc" | "desc"
  ): Promise<T[]> {
    const itemsRef = collection(db, this.collectionName, userId, "items");
    const orderField = orderByField || this.defaultOrderByField;
    const direction = orderDirection || this.defaultOrderDirection;

    const q = query(itemsRef, orderBy(orderField as string, direction));
    const snapshot = await getDocs(q);

    const items: T[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as T);
    });

    return items;
  }

  /**
   * Search across multiple fields
   */
  async search(
    userId: string,
    searchTerm: string,
    searchFields: (keyof T)[]
  ): Promise<T[]> {
    const items = await this.getAll(userId);
    const lowerTerm = searchTerm.toLowerCase();

    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerTerm);
      })
    );
  }

  /**
   * Subscribe with custom query constraints
   */
  subscribeWithQuery(
    userId: string,
    callback: (items: T[]) => void,
    constraints: QueryConstraint[]
  ): () => void {
    const itemsRef = collection(db, this.collectionName, userId, "items");
    const q = query(itemsRef, ...constraints);

    return onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      callback(items);
    });
  }
}
