import { db } from "@/lib/firebase";
import { Invoice } from "@/types";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    onSnapshot,
    orderBy
} from "firebase/firestore";

const getCollectionPath = (userId: string) => `invoices/${userId}/items`;

export const createInvoice = async (userId: string, invoice: Omit<Invoice, "id" | "userId" | "createdAt" | "updatedAt">) => {
    try {
        const docRef = await addDoc(collection(db, getCollectionPath(userId)), {
            ...invoice,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        return docRef;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

export const updateInvoice = async (userId: string, invoiceId: string, updates: Partial<Invoice>) => {
    try {
        const docRef = doc(db, getCollectionPath(userId), invoiceId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now()
        });
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoice = async (userId: string, invoiceId: string) => {
    try {
        await deleteDoc(doc(db, getCollectionPath(userId), invoiceId));
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
};

export const subscribeToInvoices = (userId: string, callback: (invoices: Invoice[]) => void) => {
    const q = query(
        collection(db, getCollectionPath(userId)), 
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Invoice));
        callback(invoices);
    });
};
