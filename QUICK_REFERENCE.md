# Quick Reference - Agendify Refactoring

## 🚀 Quick Start Cheat Sheet

### Import What You Need
```typescript
// Hooks
import { useFirestoreCollection, useFormModal, useDeleteConfirmation, useResponsive } from '@/hooks';

// UI Components
import { BaseModal, FormField, FormTextArea, FormSelect, LoadingSpinner, StatsCard, Badge, Avatar, ActionButton, EmptyState } from '@/components/ui';

// Utilities
import { handleAsyncOperation, handleFirestoreError } from '@/lib/errorHandler';
import { formatCurrency, formatDate, formatTime, getInitials } from '@/lib/formatters';
import { commonValidators } from '@/lib/validationSchemas';

// Services
import { clientService } from '@/services/client.refactored';
```

---

## 📝 Common Patterns

### CRUD Page Template
```typescript
export default function ItemsPage() {
  const { user } = useAuth();
  const { data: items, loading } = useFirestoreCollection(itemService, user?.uid);
  const formModal = useFormModal<Item>();
  const deleteModal = useDeleteConfirmation<Item>();

  const handleCreate = async (data) => {
    if (!user) return;
    await handleAsyncOperation(
      () => itemService.create(user.uid, data),
      { successMessage: "Creado!", errorMessage: "Error" }
    );
  };

  const handleDelete = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) deleteModal.confirm(item);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.item) return;
    await handleAsyncOperation(
      () => itemService.delete(user.uid, deleteModal.item!.id),
      {
        successMessage: "Eliminado!",
        onSuccess: () => deleteModal.close()
      }
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div>
      <button onClick={formModal.openNew}>New</button>
      <ItemTable items={items} onEdit={formModal.openEdit} onDelete={handleDelete} />
      <ItemForm isOpen={formModal.isOpen} onClose={formModal.close} initialData={formModal.editingItem} />
      <DeleteModal isOpen={deleteModal.isOpen} onClose={deleteModal.close} onConfirm={handleConfirmDelete} />
    </div>
  );
}
```

### Form Template
```typescript
const schema = z.object({
  name: commonValidators.requiredString('Nombre'),
  email: commonValidators.email,
  phone: commonValidators.phone,
});

export default function MyForm({ isOpen, onClose, initialData }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="My Form">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre" required error={errors.name} {...register('name')} />
        <FormField label="Email" type="email" error={errors.email} {...register('email')} />
        <FormField label="Teléfono" type="tel" error={errors.phone} {...register('phone')} />
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    </BaseModal>
  );
}
```

### Service Creation
```typescript
import { FirestoreService } from '@/lib/firestoreService';
import { MyEntity } from '@/types';

export const myEntityService = new FirestoreService<MyEntity>(
  'myEntities',  // Collection name
  'name',        // Order by field
  'asc'          // Direction
);
```

---

## 🔧 Hook Usage

### useFirestoreCollection
```typescript
const { data, loading, error } = useFirestoreCollection(
  clientService,  // Service instance
  user?.uid,      // User ID (optional until loaded)
  'name',         // Order by (optional)
  'asc'           // Direction (optional)
);
```

### useFormModal
```typescript
const formModal = useFormModal<Client>();

// Usage
formModal.openNew()              // Open for create
formModal.openEdit(client)       // Open for edit
formModal.close()                // Close modal
formModal.isOpen                 // Boolean state
formModal.editingItem            // Current item or null
```

### useDeleteConfirmation
```typescript
const deleteModal = useDeleteConfirmation<Client>();

// Usage
deleteModal.confirm(client)      // Show delete modal
deleteModal.close()              // Close modal
deleteModal.isOpen               // Boolean state
deleteModal.item                 // Item to delete or null
```

### useResponsive
```typescript
const { isMobile, isDesktop } = useResponsive(768);

{isMobile ? <MobileView /> : <DesktopView />}
```

---

## 🎨 UI Components

### BaseModal
```typescript
<BaseModal isOpen={isOpen} onClose={onClose} title="Title" maxWidth="2xl">
  {children}
</BaseModal>
```

### Form Fields
```typescript
<FormField 
  label="Nombre" 
  required 
  type="text"
  placeholder="John Doe"
  error={errors.name} 
  {...register('name')} 
/>

<FormTextArea 
  label="Notas" 
  rows={3}
  error={errors.notes} 
  {...register('notes')} 
/>

<FormSelect 
  label="Tipo" 
  required
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  error={errors.type}
  {...register('type')}
/>
```

### Badge
```typescript
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Cancelado</Badge>
<StatusBadge status="confirmed" />  // Auto-translates
```

### StatsCard
```typescript
<StatsCard 
  label="Total Clientes" 
  value={clientCount} 
  icon={Users} 
  color="blue" 
/>
```

### LoadingSpinner
```typescript
<LoadingSpinner fullScreen text="Cargando..." />
<LoadingSpinner size="md" />
<ButtonSpinner />  // For button loading
```

### Avatar
```typescript
<Avatar name="John Doe" size="md" color="blue" />
```

### ActionButton
```typescript
<ActionButton icon={Edit} onClick={onEdit} variant="primary" tooltip="Editar" />
<ActionButton icon={Trash} onClick={onDelete} variant="danger" />
```

---

## 🛠️ Utility Functions

### Error Handling
```typescript
// Full options
await handleAsyncOperation(
  () => myAsyncFunction(),
  {
    loadingMessage: "Procesando...",
    successMessage: "¡Éxito!",
    errorMessage: "Error",
    onSuccess: (result) => { /* ... */ },
    onError: (error) => { /* ... */ }
  }
);

// Minimal
await handleAsyncOperation(
  () => myAsyncFunction(),
  { successMessage: "Guardado!" }
);

// Manual error
try {
  await something();
} catch (error) {
  handleFirestoreError(error, "Error al guardar");
}
```

### Date & Time
```typescript
formatDate(date)                    // "2 Dic 2025"
formatDate(date, 'dd/MM/yyyy')      // "02/12/2025"
formatTime("14:30")                 // "2:30 PM"
formatDuration(90)                  // "1h 30min"
calculateDuration("14:00", "16:30") // 150
isToday(date)                       // boolean
isPast(date)                        // boolean
```

### Formatting
```typescript
formatCurrency(1234.56)    // "$1,234.56"
formatNumber(1000000)      // "1,000,000"
getInitials("John Doe")    // "JD"
truncateText("Long...", 10) // "Long..."
```

### Validation
```typescript
const schema = z.object({
  name: commonValidators.requiredString('Nombre'),
  email: commonValidators.email,
  phone: commonValidators.phone,
  url: commonValidators.url,
  price: commonValidators.price,
  stock: commonValidators.stock,
});
```

---

## 📦 Service Methods

```typescript
// All services have these methods:
service.subscribe(userId, callback)
service.create(userId, data)
service.update(userId, id, data)
service.delete(userId, id)
service.getById(userId, id)
service.getAll(userId)
service.search(userId, term, fields)
```

---

## ✅ Migration Checklist

### Page Component
- [ ] Import refactored service
- [ ] Replace useState with hooks
- [ ] Replace try-catch with handleAsyncOperation
- [ ] Replace loading spinner with <LoadingSpinner />
- [ ] Update button handlers to use hook methods

### Form Component
- [ ] Replace Dialog with <BaseModal>
- [ ] Replace inputs with <FormField>
- [ ] Use commonValidators
- [ ] Add <ButtonSpinner> to submit

### Service
- [ ] Create new FirestoreService<T> instance
- [ ] Export service instance
- [ ] Test with at least one page

---

## 🐛 Common Issues

**Type error with hooks**
```typescript
// ❌ Wrong
const modal = useFormModal();

// ✅ Correct
const modal = useFormModal<Client>();
```

**Hook not updating**
```typescript
// ❌ Wrong
useFirestoreCollection(service, userId)

// ✅ Correct (handle undefined)
useFirestoreCollection(service, user?.uid)
```

**Form not resetting**
```typescript
// ❌ Wrong
setEditingItem(null); setIsOpen(false);

// ✅ Correct (use hook)
formModal.close(); // Auto-resets after animation
```

---

## 📚 Documentation

- **REFACTORING_SUMMARY.md** - Complete overview
- **MIGRATION_GUIDE.md** - Step-by-step instructions
- **ARCHITECTURE_DIAGRAM.md** - Visual architecture
- **IMPLEMENTATION_COMPLETE.md** - Status report

---

## 🎯 Remember

1. Always specify generic types
2. Use handleAsyncOperation for consistent errors
3. Import from barrel files (@/hooks, @/components/ui)
4. Format user-facing data with utilities
5. Test hooks thoroughly
6. Follow established patterns

---

**Quick Help**: Check refactored files for examples:
- `src/app/(dashboard)/clients/page.tsx`
- `src/components/dashboard/ClientForm.tsx`
