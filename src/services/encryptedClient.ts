import { FirestoreService } from "@/lib/firestoreService";
import { Client } from "@/types";
import {
  encryptObject,
  decryptObject,
  getEncryptionKey,
} from "@/lib/encryption";

/**
 * Client service with automatic encryption/decryption
 * Encrypts sensitive fields before storing in Firestore
 */
class EncryptedClientService extends FirestoreService<Client> {
  // Fields that should be encrypted
  private readonly encryptedFields: (keyof Client)[] = [
    "name",
    "email",
    "phone",
    "address",
    "notes",
  ];

  constructor() {
    super("clients", "createdAt", "desc");
  }

  /**
   * Override create to encrypt before storing
   */
  override async create(
    userId: string,
    data: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const encryptionKey = getEncryptionKey(userId);

    // Encrypt sensitive fields
    const encryptedData = await encryptObject(
      data as Client,
      this.encryptedFields,
      encryptionKey
    );

    // Add encryption metadata
    const dataWithMetadata = {
      ...encryptedData,
      _encrypted: true,
      _encryptedFields: this.encryptedFields as string[],
    };

    return super.create(userId, dataWithMetadata as any);
  }

  /**
   * Override update to encrypt before storing
   */
  override async update(
    id: string,
    userId: string,
    data: Partial<Client>
  ): Promise<void> {
    const encryptionKey = getEncryptionKey(userId);

    // Only encrypt fields that are being updated and are in the encrypted list
    const fieldsToEncrypt = Object.keys(data).filter((key) =>
      this.encryptedFields.includes(key as keyof Client)
    ) as (keyof Client)[];

    const encryptedData = await encryptObject(
      data as Client,
      fieldsToEncrypt,
      encryptionKey
    );

    // Ensure encryption metadata is set
    const dataWithMetadata = {
      ...encryptedData,
      _encrypted: true,
      _encryptedFields: this.encryptedFields as string[],
    };

    return super.update(id, userId, dataWithMetadata as any);
  }

  /**
   * Override getById to decrypt after retrieving
   */
  override async getById(id: string, userId: string): Promise<Client | null> {
    const client = await super.getById(id, userId);
    if (!client) return null;

    // Check if data is encrypted
    if (client._encrypted) {
      const encryptionKey = getEncryptionKey(userId);
      return this.decryptClient(client, encryptionKey);
    }

    return client;
  }

  /**
   * Override getAll to decrypt all clients
   */
  override async getAll(userId: string): Promise<Client[]> {
    const clients = await super.getAll(userId);
    const encryptionKey = getEncryptionKey(userId);

    return Promise.all(
      clients.map((client) =>
        client._encrypted ? this.decryptClient(client, encryptionKey) : client
      )
    );
  }

  /**
   * Override subscribe to decrypt clients in real-time
   */
  override subscribe(
    userId: string,
    callback: (items: Client[]) => void,
    orderByField?: keyof Client,
    orderDirection?: "asc" | "desc"
  ): () => void {
    const encryptionKey = getEncryptionKey(userId);

    return super.subscribe(
      userId,
      async (clients) => {
        const decryptedClients = await Promise.all(
          clients.map((client) =>
            client._encrypted
              ? this.decryptClient(client, encryptionKey)
              : client
          )
        );
        callback(decryptedClients);
      },
      orderByField,
      orderDirection
    );
  }

  /**
   * Override search to work with encrypted data
   * Note: Full-text search won't work on encrypted fields
   */
  override async search(userId: string, searchTerm: string): Promise<Client[]> {
    // Get all clients and decrypt them
    const allClients = await this.getAll(userId);

    // Perform client-side filtering on decrypted data
    const lowerSearch = searchTerm.toLowerCase();
    return allClients.filter((client) => {
      return (
        client.name?.toLowerCase().includes(lowerSearch) ||
        client.email?.toLowerCase().includes(lowerSearch) ||
        client.phone?.toLowerCase().includes(lowerSearch) ||
        client.address?.toLowerCase().includes(lowerSearch) ||
        client.notes?.toLowerCase().includes(lowerSearch)
      );
    });
  }

  /**
   * Helper method to decrypt a single client
   */
  private async decryptClient(
    client: Client,
    encryptionKey: string
  ): Promise<Client> {
    const fieldsToDecrypt =
      (client._encryptedFields as (keyof Client)[]) || this.encryptedFields;
    const decrypted = await decryptObject(
      client,
      fieldsToDecrypt,
      encryptionKey
    );

    // Remove encryption metadata from returned object
    const { _encrypted, _encryptedFields, ...cleanClient } = decrypted;
    return cleanClient as Client;
  }

  /**
   * Migrate existing unencrypted client to encrypted format
   */
  async migrateToEncrypted(clientId: string, userId: string): Promise<void> {
    const client = await super.getById(clientId, userId);
    if (!client || client._encrypted) {
      return; // Already encrypted or doesn't exist
    }

    const encryptionKey = getEncryptionKey(userId);
    const encryptedData = await encryptObject(
      client,
      this.encryptedFields,
      encryptionKey
    );

    await super.update(clientId, userId, {
      ...encryptedData,
      _encrypted: true,
      _encryptedFields: this.encryptedFields as string[],
    } as any);
  }

  /**
   * Migrate all existing clients to encrypted format
   */
  async migrateAllToEncrypted(userId: string): Promise<void> {
    const clients = await super.getAll(userId);
    const unencryptedClients = clients.filter((client) => !client._encrypted);

    console.log(
      `Migrating ${unencryptedClients.length} clients to encrypted format...`
    );

    for (const client of unencryptedClients) {
      await this.migrateToEncrypted(client.id, userId);
    }

    console.log("Migration completed");
  }
}

// Export singleton instance
export const encryptedClientService = new EncryptedClientService();

// Export legacy functions for backward compatibility
export const subscribeToClients = (
  userId: string,
  callback: (clients: Client[]) => void,
  orderByField?: keyof Client,
  orderDirection?: "asc" | "desc"
) =>
  encryptedClientService.subscribe(
    userId,
    callback,
    orderByField,
    orderDirection
  );

export const createClient = (
  userId: string,
  data: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
) => encryptedClientService.create(userId, data);

export const updateClient = (
  id: string,
  userId: string,
  data: Partial<Client>
) => encryptedClientService.update(id, userId, data);

export const deleteClient = (id: string, userId: string) =>
  encryptedClientService.delete(id, userId);

export const getClientById = (id: string, userId: string) =>
  encryptedClientService.getById(id, userId);

export const searchClients = (userId: string, searchTerm: string) =>
  encryptedClientService.search(userId, searchTerm);
