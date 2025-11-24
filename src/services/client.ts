import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    getDocs,
    where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client } from '@/types';

export const subscribeToClients = (
    userId: string,
    callback: (clients: Client[]) => void
) => {
    const clientsRef = collection(db, 'clients', userId, 'items');
    const q = query(clientsRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const clients: Client[] = [];
        snapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() } as Client);
        });
        callback(clients);
    });
};

export const createClient = async (userId: string, clientData: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const clientsRef = collection(db, 'clients', userId, 'items');
    const now = Date.now();
    
    const newClient = {
        ...clientData,
        userId,
        createdAt: now,
        updatedAt: now,
    };

    return await addDoc(clientsRef, newClient);
};

export const updateClient = async (userId: string, clientId: string, clientData: Partial<Client>) => {
    const clientRef = doc(db, 'clients', userId, 'items', clientId);
    
    const updateData = {
        ...clientData,
        updatedAt: Date.now(),
    };

    return await updateDoc(clientRef, updateData);
};

export const deleteClient = async (userId: string, clientId: string) => {
    const clientRef = doc(db, 'clients', userId, 'items', clientId);
    return await deleteDoc(clientRef);
};

export const getClientById = async (userId: string, clientId: string): Promise<Client | null> => {
    const clientsRef = collection(db, 'clients', userId, 'items');
    const q = query(clientsRef, where('__name__', '==', clientId));
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Client;
};

export const searchClients = async (userId: string, searchTerm: string): Promise<Client[]> => {
    const clientsRef = collection(db, 'clients', userId, 'items');
    const snapshot = await getDocs(clientsRef);
    
    const clients: Client[] = [];
    snapshot.forEach((doc) => {
        const client = { id: doc.id, ...doc.data() } as Client;
        const searchLower = searchTerm.toLowerCase();
        
        if (
            client.name.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower) ||
            client.phone?.includes(searchTerm)
        ) {
            clients.push(client);
        }
    });
    
    return clients.sort((a, b) => a.name.localeCompare(b.name));
};
