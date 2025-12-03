import { useState } from "react";

/**
 * Hook for managing delete confirmation modal state
 * Replaces duplicate delete modal logic in 6+ page components
 */
export const useDeleteConfirmation = <T>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<T | null>(null);

  const confirm = (itemToDelete: T) => {
    setItem(itemToDelete);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Delay clearing item to allow animation to complete
    setTimeout(() => setItem(null), 150);
  };

  return {
    isOpen,
    item,
    confirm,
    close,
  };
};
