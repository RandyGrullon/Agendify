import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Collaborator } from "@/types";

const COLLECTION_NAME = "collaborators";

export const subscribeToCollaborators = (
  userId: string,
  callback: (collaborators: Collaborator[]) => void
) => {
  const collaboratorsRef = collection(db, COLLECTION_NAME, userId, "items");
  const q = query(collaboratorsRef, orderBy("name", "asc"));

  return onSnapshot(q, (snapshot) => {
    const collaborators: Collaborator[] = [];
    snapshot.forEach((doc) => {
      collaborators.push({ id: doc.id, ...doc.data() } as Collaborator);
    });
    callback(collaborators);
  });
};

export const createCollaborator = async (
  userId: string,
  collaboratorData: Omit<
    Collaborator,
    "id" | "userId" | "createdAt" | "updatedAt"
  >
) => {
  const collaboratorsRef = collection(db, COLLECTION_NAME, userId, "items");
  const now = Date.now();

  const newCollaborator = {
    ...collaboratorData,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  return await addDoc(collaboratorsRef, newCollaborator);
};

export const updateCollaborator = async (
  userId: string,
  collaboratorId: string,
  collaboratorData: Partial<Collaborator>
) => {
  const collaboratorRef = doc(
    db,
    COLLECTION_NAME,
    userId,
    "items",
    collaboratorId
  );

  const updateData = {
    ...collaboratorData,
    updatedAt: Date.now(),
  };

  await updateDoc(collaboratorRef, updateData);
};

export const deleteCollaborator = async (
  userId: string,
  collaboratorId: string
) => {
  const collaboratorRef = doc(
    db,
    COLLECTION_NAME,
    userId,
    "items",
    collaboratorId
  );
  await deleteDoc(collaboratorRef);
};

export const getCollaborator = async (
  userId: string,
  collaboratorId: string
): Promise<Collaborator | null> => {
  const collaboratorRef = doc(
    db,
    COLLECTION_NAME,
    userId,
    "items",
    collaboratorId
  );
  const collaboratorSnap = await getDoc(collaboratorRef);

  if (collaboratorSnap.exists()) {
    return {
      id: collaboratorSnap.id,
      ...collaboratorSnap.data(),
    } as Collaborator;
  } else {
    return null;
  }
};

export const getAllCollaborators = async (
  userId: string
): Promise<Collaborator[]> => {
  const collaboratorsRef = collection(db, COLLECTION_NAME, userId, "items");
  const q = query(collaboratorsRef, orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Collaborator)
  );
};
