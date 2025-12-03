# Migration Guide - Agendify Refactoring

## Quick Start: Using the New Architecture

This guide helps you migrate existing code or build new features using the refactored architecture.

---

## Table of Contents
1. [Converting a Page to Use New Hooks](#converting-a-page)
2. [Converting a Form to Use New Components](#converting-a-form)
3. [Creating a New Entity from Scratch](#creating-new-entity)
4. [Using Utility Functions](#using-utilities)
5. [Common Patterns](#common-patterns)

---

## Converting a Page to Use New Hooks

### Before
```typescript
import { useState, useEffect } from "react";
import { subscribeToItems, createItem, updateItem, deleteItem } from "@/services/item";

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToItems(user.uid, (data) => {
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
      await deleteItem(user.uid, itemToDelete.id);
      toast.success("Eliminado");
      setItemToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Error");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin..."></div>
    </div>;
  }

  return (
    <div>
      <button onClick={() => setIsFormOpen(true)}>New</button>
      <ItemTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
      <ItemForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        initialData={editingItem}
      />
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
```

### After
```typescript
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { itemService } from "@/services/item.refactored";
import { useFirestoreCollection, useFormModal, useDeleteConfirmation } from "@/hooks";
import { handleAsyncOperation } from "@/lib/errorHandler";
import { LoadingSpinner } from "@/components/ui";

export default function ItemsPage() {
  const { user } = useAuth();
  const { data: items, loading } = useFirestoreCollection(itemService, user?.uid);
  const formModal = useFormModal<Item>();
  const deleteModal = useDeleteConfirmation<Item>();

  const handleDelete = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) deleteModal.confirm(item);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.item) return;
    await handleAsyncOperation(
      () => itemService.delete(user.uid, deleteModal.item!.id),
      {
        successMessage: "Eliminado exitosamente",
        errorMessage: "Error al eliminar",
        onSuccess: () => deleteModal.close()
      }
    );
  };

  if (loading) return <LoadingSpinner fullScreen text="Cargando..." />;

  return (
    <div>
      <button onClick={formModal.openNew}>New</button>
      <ItemTable items={items} onEdit={formModal.openEdit} onDelete={handleDelete} />
      <ItemForm 
        isOpen={formModal.isOpen} 
        onClose={formModal.close}
        initialData={formModal.editingItem}
      />
      <DeleteModal 
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        message={`¿Eliminar "${deleteModal.item?.name}"?`}
      />
    </div>
  );
}
```

### Key Changes
1. ✅ Replace state management with `useFormModal` and `useDeleteConfirmation`
2. ✅ Replace subscription logic with `useFirestoreCollection`
3. ✅ Replace try-catch blocks with `handleAsyncOperation`
4. ✅ Replace loading spinner with `<LoadingSpinner />`
5. ✅ Use hook methods: `formModal.openEdit`, `deleteModal.confirm`, etc.

---

## Converting a Form to Use New Components

### Before
```typescript
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Teléfono inválido')...
});

export default function MyForm({ isOpen, onClose }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child /* 20+ lines of animation config */>
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <Transition.Child /* 20+ lines of animation config */>
            <Dialog.Panel className="w-full max-w-2xl...">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title>My Form</Dialog.Title>
                <button onClick={onClose}><X size={24} /></button>
              </div>
              <form>
                <div>
                  <label className="block text-sm font-semibold...">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input {...register('name')} className="w-full px-4 py-2..." />
                  {errors.name && <p className="mt-1 text-sm text-red-600">...</p>}
                </div>
                {/* Repeat 10+ times for each field */}
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
```

### After
```typescript
import { BaseModal, FormField, FormTextArea } from '@/components/ui';
import { commonValidators } from '@/lib/validationSchemas';
import { z } from 'zod';

const schema = z.object({
  name: commonValidators.requiredString('Nombre'),
  email: commonValidators.email,
  phone: commonValidators.phone,
  notes: z.string().optional(),
});

export default function MyForm({ isOpen, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="My Form">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField 
          label="Nombre" 
          required 
          error={errors.name} 
          {...register('name')} 
        />
        <FormField 
          label="Email" 
          type="email"
          error={errors.email} 
          {...register('email')} 
        />
        <FormField 
          label="Teléfono" 
          type="tel"
          error={errors.phone} 
          {...register('phone')} 
        />
        <FormTextArea 
          label="Notas" 
          error={errors.notes} 
          {...register('notes')} 
        />
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </BaseModal>
  );
}
```

### Key Changes
1. ✅ Replace Dialog/Transition with `<BaseModal>`
2. ✅ Replace label + input + error with `<FormField>`
3. ✅ Use `commonValidators` instead of duplicate zod schemas
4. ✅ Use `<FormTextArea>` for textarea fields

---

## Creating a New Entity from Scratch

Let's say you want to add a "Products" entity. Here's the complete workflow:

### Step 1: Define Type
```typescript
// src/types/index.ts
export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  createdAt: number;
  updatedAt: number;
}
```

### Step 2: Create Service
```typescript
// src/services/product.ts
import { FirestoreService } from '@/lib/firestoreService';
import { Product } from '@/types';

export const productService = new FirestoreService<Product>(
  'products',  // Firestore collection name
  'name',      // Default order by field
  'asc'        // Order direction
);

// Optional: Add specialized search
export const searchProductsByCategory = async (
  userId: string, 
  category: string
) => {
  const allProducts = await productService.getAll(userId);
  return allProducts.filter(p => p.category === category);
};
```

### Step 3: Create Form Component
```typescript
// src/components/dashboard/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseModal, FormField, FormTextArea, FormSelect } from '@/components/ui';
import { commonValidators } from '@/lib/validationSchemas';
import { Product } from '@/types';

const productSchema = z.object({
  name: commonValidators.requiredString('Nombre'),
  description: commonValidators.optionalString,
  price: commonValidators.price,
  stock: commonValidators.stock,
  category: commonValidators.requiredString('Categoría'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Product | null;
}

export default function ProductForm({ isOpen, onClose, onSubmit, initialData }: ProductFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {},
  });

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Editar Producto' : 'Nuevo Producto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre" required error={errors.name} {...register('name')} />
        <FormTextArea label="Descripción" error={errors.description} {...register('description')} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Precio" type="number" required error={errors.price} {...register('price', { valueAsNumber: true })} />
          <FormField label="Stock" type="number" error={errors.stock} {...register('stock', { valueAsNumber: true })} />
        </div>
        <FormSelect 
          label="Categoría" 
          required 
          error={errors.category} 
          options={[
            { value: 'electronics', label: 'Electrónicos' },
            { value: 'clothing', label: 'Ropa' },
            { value: 'food', label: 'Alimentos' },
          ]}
          {...register('category')}
        />
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            {initialData ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
```

### Step 4: Create Page Component
```typescript
// src/app/(dashboard)/products/page.tsx
"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { productService } from "@/services/product";
import { Product } from "@/types";
import ProductForm from "@/components/dashboard/ProductForm";
import ProductTable from "@/components/dashboard/ProductTable";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { useFirestoreCollection, useFormModal, useDeleteConfirmation } from "@/hooks";
import { handleAsyncOperation } from "@/lib/errorHandler";
import { LoadingSpinner, StatsCard } from "@/components/ui";

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products, loading } = useFirestoreCollection(productService, user?.uid);
  const formModal = useFormModal<Product>();
  const deleteModal = useDeleteConfirmation<Product>();

  const handleCreate = async (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    await handleAsyncOperation(
      () => productService.create(user.uid, data),
      {
        successMessage: "Producto creado exitosamente",
        errorMessage: "Error al crear producto",
      }
    );
  };

  const handleUpdate = async (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !formModal.editingItem) return;
    await handleAsyncOperation(
      () => productService.update(user.uid, formModal.editingItem!.id, data),
      {
        successMessage: "Producto actualizado exitosamente",
        errorMessage: "Error al actualizar producto",
      }
    );
  };

  const handleDelete = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) deleteModal.confirm(product);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.item) return;
    await handleAsyncOperation(
      () => productService.delete(user.uid, deleteModal.item!.id),
      {
        successMessage: "Producto eliminado exitosamente",
        errorMessage: "Error al eliminar producto",
        onSuccess: () => deleteModal.close(),
      }
    );
  };

  if (loading) return <LoadingSpinner fullScreen text="Cargando productos..." />;

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="p-4 sm:p-0 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-gray-600">Gestiona tu inventario</p>
        </div>
        <button
          onClick={formModal.openNew}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Total Productos" value={products.length} icon={Package} color="blue" />
        <StatsCard label="Valor Inventario" value={`$${totalValue.toFixed(2)}`} icon={Package} color="green" />
        <StatsCard label="Stock Bajo" value={products.filter(p => p.stock < 10).length} icon={Package} color="red" />
      </div>

      <ProductTable products={products} onEdit={formModal.openEdit} onDelete={handleDelete} />

      <ProductForm
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={formModal.editingItem ? handleUpdate : handleCreate}
        initialData={formModal.editingItem}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Eliminar producto"
        message={`¿Eliminar "${deleteModal.item?.name}"?`}
      />
    </div>
  );
}
```

### Step 5: Create Table Component (Simplified Example)
```typescript
// src/components/dashboard/ProductTable.tsx
import { Product } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { ActionButton, Avatar, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/formatters';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Avatar name={product.name} size="sm" color="blue" />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge>{product.category}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(product.price)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={product.stock < 10 ? 'danger' : 'success'}>
                  {product.stock}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ActionButton icon={Edit} onClick={() => onEdit(product)} variant="primary" />
                <ActionButton icon={Trash} onClick={() => onDelete(product.id)} variant="danger" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Done!** You now have a complete CRUD system with ~200 lines of code instead of ~500+.

---

## Using Utility Functions

### Date & Time Formatting
```typescript
import { formatDate, formatDateTime, isToday, isPast } from '@/lib/dateUtils';
import { formatTime, calculateDuration, formatDuration } from '@/lib/timeUtils';

// Format dates
formatDate(appointment.date) // "2 Dic 2025"
formatDate(appointment.date, 'dd/MM/yyyy') // "02/12/2025"
formatDateTime(appointment.date, appointment.time) // "2 Dic 2025 14:30"

// Time operations
formatTime("14:30") // "2:30 PM"
const duration = calculateDuration("14:00", "16:30") // 150 minutes
formatDuration(duration) // "2h 30min"

// Date comparisons
if (isToday(appointment.date)) { /* ... */ }
if (isPast(appointment.date)) { /* ... */ }
```

### Currency & Number Formatting
```typescript
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/formatters';

formatCurrency(1234.56) // "$1,234.56"
formatNumber(1000000) // "1,000,000"
formatPercentage(85.5) // "85.5%"
```

### Text Utilities
```typescript
import { getInitials, truncateText, capitalize } from '@/lib/formatters';

getInitials("John Doe") // "JD"
truncateText("Long text here", 10) // "Long text..."
capitalize("hello") // "Hello"
```

### Error Handling
```typescript
import { handleAsyncOperation, handleFirestoreError } from '@/lib/errorHandler';

// With full options
await handleAsyncOperation(
  () => someAsyncFunction(),
  {
    loadingMessage: "Procesando...",
    successMessage: "¡Éxito!",
    errorMessage: "Error al procesar",
    onSuccess: (result) => console.log(result),
    onError: (error) => console.error(error)
  }
);

// Minimal usage
await handleAsyncOperation(
  () => someAsyncFunction(),
  { successMessage: "¡Guardado!" }
);

// Manual error handling
try {
  await someFunction();
} catch (error) {
  handleFirestoreError(error, "Error al guardar");
}
```

---

## Common Patterns

### Pattern 1: CRUD Page with Search
```typescript
export default function ItemsPage() {
  const { user } = useAuth();
  const { data: items, loading } = useFirestoreCollection(itemService, user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const formModal = useFormModal<Item>();
  const deleteModal = useDeleteConfirmation<Item>();

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ... CRUD handlers

  return (
    <div>
      <input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />
      <ItemTable items={filteredItems} onEdit={formModal.openEdit} onDelete={handleDelete} />
      {/* Modals */}
    </div>
  );
}
```

### Pattern 2: Stats Dashboard
```typescript
import { StatsCard } from '@/components/ui';
import { Users, DollarSign, Package, TrendingUp } from 'lucide-react';

const stats = [
  { label: "Total Users", value: users.length, icon: Users, color: "blue" },
  { label: "Revenue", value: formatCurrency(revenue), icon: DollarSign, color: "green" },
  { label: "Products", value: products.length, icon: Package, color: "purple" },
];

return (
  <div className="grid grid-cols-3 gap-4">
    {stats.map((stat, i) => (
      <StatsCard key={i} {...stat} />
    ))}
  </div>
);
```

### Pattern 3: Conditional Form Fields
```typescript
<FormSelect 
  label="Type" 
  options={typeOptions} 
  {...register('type')}
/>

{watchedType === 'storable' && (
  <FormField label="Stock" type="number" {...register('stock')} />
)}

{watchedType === 'service' && (
  <FormField label="Duration (min)" type="number" {...register('duration')} />
)}
```

### Pattern 4: Async Form Submission
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = async (data) => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  
  try {
    await onSubmitProp(data);
    reset();
    onClose();
  } catch (error) {
    // Error already handled by handleAsyncOperation
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Checklist for Refactoring Existing Code

### For Pages
- [ ] Replace `useState` + `useEffect` subscription with `useFirestoreCollection`
- [ ] Replace form state management with `useFormModal`
- [ ] Replace delete modal state with `useDeleteConfirmation`
- [ ] Replace try-catch with `handleAsyncOperation`
- [ ] Replace loading spinner with `<LoadingSpinner />`
- [ ] Import service from `.refactored.ts` file
- [ ] Use hook methods: `.open()`, `.close()`, `.confirm()`

### For Forms
- [ ] Replace Dialog/Transition with `<BaseModal>`
- [ ] Replace form fields with `<FormField>`, `<FormTextArea>`, `<FormSelect>`
- [ ] Use `commonValidators` from validation schemas
- [ ] Add `<ButtonSpinner>` to submit button
- [ ] Remove manual Dialog/X button code

### For Services
- [ ] Create `new FirestoreService<T>()` instance
- [ ] Export for use in pages
- [ ] Keep legacy exports temporarily for backward compatibility
- [ ] Test with existing pages before removing old code

---

## Troubleshooting

### "Property does not exist on type"
Make sure to import types:
```typescript
import type { Client } from '@/types';
const formModal = useFormModal<Client>(); // Specify generic type
```

### "Cannot read property of undefined"
Check hook dependencies:
```typescript
const { data, loading } = useFirestoreCollection(service, user?.uid);
// ⚠️ Wait for user to be loaded
if (loading || !user) return <LoadingSpinner />;
```

### Form not resetting after close
The hooks automatically clear after animation:
```typescript
// Don't manually set to null
formModal.close(); // ✅ Automatically clears after 150ms
```

### Service not finding data
Verify collection name matches Firestore:
```typescript
new FirestoreService<Product>(
  'products', // ⚠️ Must match Firestore collection name exactly
  'name',
  'asc'
);
```

---

## Best Practices

1. **Always specify generic types** for hooks and services
2. **Use `handleAsyncOperation`** for consistent error handling
3. **Import from barrel files** (`@/hooks`, `@/components/ui`)
4. **Keep validation logic** in `validationSchemas.ts`
5. **Format user-facing data** with utility functions
6. **Test hooks thoroughly** - they manage critical state
7. **Document custom logic** - reusable code should be clear

---

## Questions?

Refer to:
- `REFACTORING_SUMMARY.md` for detailed architecture overview
- Existing refactored files as examples:
  - `src/app/(dashboard)/clients/page.tsx`
  - `src/app/(dashboard)/services/page.tsx`
  - `src/components/dashboard/ClientForm.tsx`

Happy coding! 🚀
