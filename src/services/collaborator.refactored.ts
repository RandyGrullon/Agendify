import { FirestoreService } from '@/lib/firestoreService';
import { Collaborator } from '@/types';

/**
 * Collaborator service using generic FirestoreService
 */
export const collaboratorService = new FirestoreService<Collaborator>(
  'collaborators',
  'name',
  'asc'
);

// Legacy function exports for backward compatibility

export const subscribeToCollaborators = (
  userId: string,
  callback: (collaborators: Collaborator[]) => void
) => collaboratorService.subscribe(userId, callback);

export const createCollaborator = async (
  userId: string,
  collaboratorData: Omit<Collaborator, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => collaboratorService.create(userId, collaboratorData);

export const updateCollaborator = async (
  userId: string,
  collaboratorId: string,
  collaboratorData: Partial<Collaborator>
) => collaboratorService.update(userId, collaboratorId, collaboratorData);

export const deleteCollaborator = async (
  userId: string,
  collaboratorId: string
) => collaboratorService.delete(userId, collaboratorId);

export const getCollaboratorById = async (
  userId: string,
  collaboratorId: string
) => collaboratorService.getById(userId, collaboratorId);

export const searchCollaborators = async (
  userId: string,
  searchTerm: string
) => collaboratorService.search(userId, searchTerm, ['name', 'email', 'phone']);
