import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, orderBy, getDoc } from "firebase/firestore";
import { AgendaItem } from "@/types";

const COLLECTION_NAME = "agendas";

export const subscribeToAgenda = (userId: string, callback: (items: AgendaItem[]) => void) => {
    const q = query(
        collection(db, COLLECTION_NAME, userId, "items"),
        orderBy("date", "desc"),
        orderBy("time", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaItem));
        callback(items);
    });
};

export const addAgendaItem = async (userId: string, item: Omit<AgendaItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    return addDoc(collection(db, COLLECTION_NAME, userId, "items"), {
        ...item,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
};

export const updateAgendaItem = async (userId: string, itemId: string, item: Partial<AgendaItem>) => {
    const docRef = doc(db, COLLECTION_NAME, userId, "items", itemId);
    return updateDoc(docRef, {
        ...item,
        updatedAt: Date.now(),
    });
};

export const deleteAgendaItem = async (userId: string, itemId: string) => {
    const docRef = doc(db, COLLECTION_NAME, userId, "items", itemId);
    return deleteDoc(docRef);
};

export const getAgendaItem = async (userId: string, itemId: string) => {
    const docRef = doc(db, COLLECTION_NAME, userId, "items", itemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AgendaItem;
    } else {
        return null;
    }
};
