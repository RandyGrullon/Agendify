import { useState } from 'react';

/**
 * Hook for managing form modal state (open/close + editing item)
 * Replaces duplicate form state management in 4+ page components
 */
export const useFormModal = <T>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const open = (item?: T) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Delay clearing editingItem to allow animation to complete
    setTimeout(() => setEditingItem(null), 150);
  };

  return { 
    isOpen, 
    editingItem, 
    open, 
    close,
    // Convenience methods
    openNew: () => open(),
    openEdit: (item: T) => open(item)
  };
};
