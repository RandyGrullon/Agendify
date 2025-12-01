import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { AgendaItem } from "@/types";
import { scheduleReminders, deleteRemindersForAppointment } from "./reminders";

const COLLECTION_NAME = "agendas";

export const subscribeToAgenda = (
  userId: string,
  callback: (items: AgendaItem[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME, userId, "items"),
    orderBy("date", "desc"),
    orderBy("time", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as AgendaItem)
    );
    callback(items);
  });
};

export const addAgendaItem = async (
  userId: string,
  item: Omit<AgendaItem, "id" | "userId" | "createdAt" | "updatedAt">
) => {
  const docRef = await addDoc(
    collection(db, COLLECTION_NAME, userId, "items"),
    {
      ...item,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  );

  // Schedule reminders if any (non-blocking)
  if (item.reminders && item.reminders.length > 0) {
    const fullItem = {
      ...item,
      id: docRef.id,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as AgendaItem;
    scheduleReminders(userId, fullItem).catch((error) => {
      console.error("Error scheduling reminders:", error);
      // Don't throw - reminders are optional
    });
  }

  return docRef;
};

export const updateAgendaItem = async (
  userId: string,
  itemId: string,
  item: Partial<AgendaItem>
) => {
  const docRef = doc(db, COLLECTION_NAME, userId, "items", itemId);
  await updateDoc(docRef, {
    ...item,
    updatedAt: Date.now(),
  });

  // Re-schedule reminders if reminders data changed (non-blocking)
  if (item.reminders !== undefined) {
    const fullItem = await getAgendaItem(userId, itemId);
    if (fullItem) {
      scheduleReminders(userId, fullItem).catch((error) => {
        console.error("Error scheduling reminders:", error);
        // Don't throw - reminders are optional
      });
    }
  }
};

export const deleteAgendaItem = async (userId: string, itemId: string) => {
  const docRef = doc(db, COLLECTION_NAME, userId, "items", itemId);
  // Delete associated reminders first (non-blocking, best effort)
  deleteRemindersForAppointment(userId, itemId).catch((error) => {
    console.error("Error deleting reminders:", error);
    // Don't throw - continue with appointment deletion
  });
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

export const getAllAgendaItems = async (
  userId: string
): Promise<AgendaItem[]> => {
  const q = query(
    collection(db, COLLECTION_NAME, userId, "items"),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as AgendaItem)
  );
};

/**
 * Check if there's a time conflict with existing appointments
 * Returns the conflicting appointment if found, null otherwise
 * Now allows multiple appointments at the same time if they have different clients or collaborators
 */
export const checkTimeConflict = async (
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
  clientId?: string,
  collaboratorNames?: string[],
  excludeItemId?: string
): Promise<AgendaItem | null> => {
  const allItems = await getAllAgendaItems(userId);

  // Filter items for the same date (excluding the current item if editing)
  const sameDay = allItems.filter(
    (item) => item.date === date && item.id !== excludeItemId
  );

  // Helper to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  // Check for overlaps
  for (const item of sameDay) {
    const itemStart = timeToMinutes(item.startTime || item.time);
    const itemEnd = item.endTime
      ? timeToMinutes(item.endTime)
      : itemStart + (item.duration || 60);

    // Check if times overlap
    // Two time ranges overlap if: start1 < end2 AND start2 < end1
    if (newStart < itemEnd && itemStart < newEnd) {
      // Times overlap, but check if client or collaborators are different
      const sameClient = clientId && item.clientId && clientId === item.clientId;
      
      // Check if any collaborator is shared
      const itemCollaboratorNames = (item.collaborators || []).map(c => c.name.toLowerCase());
      const newCollaboratorNames = (collaboratorNames || []).map(n => n.toLowerCase());
      const hasSharedCollaborator = itemCollaboratorNames.some(name => 
        newCollaboratorNames.includes(name)
      );

      // Only return conflict if same client OR shared collaborator
      if (sameClient || hasSharedCollaborator) {
        return item; // Conflict found
      }
      // If different client AND no shared collaborators, allow the overlap
    }
  }

  return null; // No conflict
};
