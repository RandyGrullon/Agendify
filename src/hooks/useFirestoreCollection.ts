import { useState, useEffect } from "react";
import { FirestoreService, BaseEntity } from "@/lib/firestoreService";

/**
 * Hook for subscribing to Firestore collections with loading state
 * Replaces duplicate subscription logic in 6+ page components
 */
export const useFirestoreCollection = <T extends BaseEntity>(
  service: FirestoreService<T>,
  userId?: string,
  orderByField?: keyof T,
  orderDirection?: "asc" | "desc"
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = service.subscribe(
        userId,
        (items) => {
          setData(items);
          setLoading(false);
        },
        orderByField,
        orderDirection
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [service, userId, orderByField, orderDirection]);

  return { data, loading, error, setData };
};
