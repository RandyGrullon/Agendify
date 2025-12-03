/**
 * Encryption utility for sensitive data
 * Uses Web Crypto API for client-side encryption
 */

// Generate a key from a password/secret
async function generateKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("agendify-salt-v1"), // In production, use unique salt per user
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string value
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  if (!text) return text;

  try {
    const encoder = new TextEncoder();
    const key = await generateKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(text)
    );

    // Combine IV and encrypted data, then convert to base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string value
 */
export async function decrypt(
  encryptedText: string,
  secret: string
): Promise<string> {
  if (!encryptedText) return encryptedText;

  try {
    const decoder = new TextDecoder();
    const key = await generateKey(secret);

    // Convert from base64 and extract IV and encrypted data
    const combined = Uint8Array.from(atob(encryptedText), (c) =>
      c.charCodeAt(0)
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    // If decryption fails, might be unencrypted data (migration scenario)
    return encryptedText;
  }
}

/**
 * Encrypt an object's sensitive fields
 */
export async function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[],
  secret: string
): Promise<T> {
  const encrypted = { ...obj };

  for (const field of fieldsToEncrypt) {
    const value = obj[field];
    if (value && typeof value === "string") {
      encrypted[field] = (await encrypt(value, secret)) as any;
    }
  }

  return encrypted;
}

/**
 * Decrypt an object's sensitive fields
 */
export async function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[],
  secret: string
): Promise<T> {
  const decrypted = { ...obj };

  for (const field of fieldsToDecrypt) {
    const value = obj[field];
    if (value && typeof value === "string") {
      try {
        decrypted[field] = (await decrypt(value, secret)) as any;
      } catch (error) {
        // Keep original value if decryption fails
        console.warn(`Failed to decrypt field ${String(field)}`);
      }
    }
  }

  return decrypted;
}

/**
 * Get encryption key from environment or user session
 * In production, this should be derived from user's authentication
 */
export function getEncryptionKey(userId: string): string {
  // Option 1: Use environment variable (less secure, same key for all)
  const envKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

  // Option 2: Derive from userId (better, unique per user)
  // In production, consider using user's auth token or password-derived key
  return envKey || `agendify-${userId}-encryption-key-v1`;
}

/**
 * Hash a value for searching (one-way, cannot be decrypted)
 */
export async function hashForSearch(text: string): Promise<string> {
  if (!text) return text;

  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
