import { FirestoreService } from '@/lib/firestoreService';
import { Client } from '@/types';

/**
 * Client service using generic FirestoreService
 * Replaces ~94 lines of duplicate CRUD code with a single instance
 */
export const clientService = new FirestoreService<Client>('clients', 'name', 'asc');

// Legacy function exports for backward compatibility
// These will be deprecated once all components are migrated

export const subscribeToClients = (
  userId: string,
  callback: (clients: Client[]) => void
) => clientService.subscribe(userId, callback);

export const createClient = async (
  userId: string,
  clientData: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => clientService.create(userId, clientData);

export const updateClient = async (
  userId: string,
  clientId: string,
  clientData: Partial<Client>
) => clientService.update(userId, clientId, clientData);

export const deleteClient = async (userId: string, clientId: string) =>
  clientService.delete(userId, clientId);

export const getClientById = async (userId: string, clientId: string) =>
  clientService.getById(userId, clientId);

export const searchClients = async (userId: string, searchTerm: string) =>
  clientService.search(userId, searchTerm, ['name', 'email', 'phone']);
