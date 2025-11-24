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
import { Service } from '@/types';

export const subscribeToServices = (userId: string, callback: (services: Service[]) => void) => {
    const servicesRef = collection(db, 'services', userId, 'items');
    const q = query(servicesRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Service));
        callback(services);
    });
};

export const createService = async (userId: string, data: Omit<Service, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const servicesRef = collection(db, 'services', userId, 'items');
    return addDoc(servicesRef, {
        ...data,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });
};

export const updateService = async (userId: string, id: string, data: Partial<Omit<Service, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const docRef = doc(db, 'services', userId, 'items', id);
    return updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
    });
};

export const deleteService = async (userId: string, id: string) => {
    const docRef = doc(db, 'services', userId, 'items', id);
    return deleteDoc(docRef);
};

export const searchServices = async (userId: string, searchTerm: string) => {
    const servicesRef = collection(db, 'services', userId, 'items');
    const q = query(servicesRef, orderBy('name'));
    
    const snapshot = await getDocs(q);
    const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Service));

    const lowerTerm = searchTerm.toLowerCase();
    return services.filter(service => 
        service.name.toLowerCase().includes(lowerTerm)
    );
};

export const getServiceById = async (userId: string, serviceId: string): Promise<Service | null> => {
    const docRef = doc(db, 'services', userId, 'items', serviceId);
    const servicesRef = collection(db, 'services', userId, 'items');
    const snapshot = await getDocs(servicesRef);
    
    const serviceDoc = snapshot.docs.find(d => d.id === serviceId);
    if (!serviceDoc) return null;
    
    return { id: serviceDoc.id, ...serviceDoc.data() } as Service;
};
