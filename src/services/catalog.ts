import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CatalogItem } from '@/types';

const COLLECTION_NAME = 'catalog';

export const subscribeToCatalog = (userId: string, callback: (items: CatalogItem[]) => void) => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    const q = query(catalogRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CatalogItem));
        callback(items);
    });
};

export const createCatalogItem = async (userId: string, data: Omit<CatalogItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    return addDoc(catalogRef, {
        ...data,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
};

export const updateCatalogItem = async (userId: string, id: string, data: Partial<Omit<CatalogItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const docRef = doc(db, COLLECTION_NAME, userId, 'items', id);
    return updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
    });
};

export const deleteCatalogItem = async (userId: string, id: string) => {
    const docRef = doc(db, COLLECTION_NAME, userId, 'items', id);
    return deleteDoc(docRef);
};

export const searchCatalogItems = async (userId: string, searchTerm: string) => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    const q = query(catalogRef, orderBy('name'));

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CatalogItem));

    const lowerTerm = searchTerm.toLowerCase();
    return items.filter(item =>
        item.name.toLowerCase().includes(lowerTerm) ||
        item.description?.toLowerCase().includes(lowerTerm) ||
        item.sku?.toLowerCase().includes(lowerTerm)
    );
};

export const getCatalogItemById = async (userId: string, itemId: string): Promise<CatalogItem | null> => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    const snapshot = await getDocs(catalogRef);

    const itemDoc = snapshot.docs.find(d => d.id === itemId);
    if (!itemDoc) return null;

    return { id: itemDoc.id, ...itemDoc.data() } as CatalogItem;
};

// Funciones de utilidad para filtrar por tipo
export const getCatalogItemsByType = async (userId: string, type: 'storable' | 'digital' | 'service') => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    const snapshot = await getDocs(catalogRef);

    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CatalogItem));

    return items.filter(item => item.type === type);
};

// Función para verificar stock bajo (solo para almacenables)
export const getLowStockItems = async (userId: string): Promise<CatalogItem[]> => {
    const catalogRef = collection(db, COLLECTION_NAME, userId, 'items');
    const snapshot = await getDocs(catalogRef);

    const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as CatalogItem));

    return items.filter(item =>
        item.type === 'storable' &&
        item.stock !== undefined &&
        item.minStock !== undefined &&
        item.stock <= item.minStock
    );
};
