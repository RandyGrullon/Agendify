import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { BusinessSettings } from "@/types";

const COLLECTION_NAME = "settings";

export const getBusinessSettings = async (userId: string): Promise<BusinessSettings | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as BusinessSettings;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
    }
};

export const saveBusinessSettings = async (userId: string, settings: Partial<BusinessSettings>) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, userId);
        const docSnap = await getDoc(docRef);

        const dataToSave = {
            ...settings,
            userId,
            updatedAt: Date.now(),
        };

        if (docSnap.exists()) {
            await updateDoc(docRef, dataToSave);
        } else {
            await setDoc(docRef, dataToSave);
        }
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};

export const subscribeToSettings = (userId: string, callback: (settings: BusinessSettings | null) => void) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as BusinessSettings);
        } else {
            callback(null);
        }
    });
};
