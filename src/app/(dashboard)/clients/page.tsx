"use client";

import { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { clientService } from "@/services/client.refactored";
import { Client } from "@/types";
import ClientForm from "@/components/dashboard/ClientForm";
import ClientTable from "@/components/dashboard/ClientTable";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import {
  useFirestoreCollection,
  useFormModal,
  useDeleteConfirmation,
} from "@/hooks";
import { handleAsyncOperation } from "@/lib/errorHandler";
import { LoadingSpinner } from "@/components/ui";

export default function ClientsPage() {
  const { user } = useAuth();
  const { data: clients, loading } = useFirestoreCollection(
    clientService,
    user?.uid
  );
  const [searchTerm, setSearchTerm] = useState("");
  const formModal = useFormModal<Client>();
  const deleteModal = useDeleteConfirmation<Client>();

  const handleCreate = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;

    await handleAsyncOperation(
      () => clientService.create(user.uid, clientData),
      {
        successMessage: "Cliente creado exitosamente",
        errorMessage: "Error al crear cliente",
      }
    );
  };

  const handleUpdate = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user || !formModal.editingItem) return;

    await handleAsyncOperation(
      () =>
        clientService.update(user.uid, formModal.editingItem!.id, clientData),
      {
        successMessage: "Cliente actualizado exitosamente",
        errorMessage: "Error al actualizar cliente",
      }
    );
  };

  const handleDelete = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      deleteModal.confirm(client);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.item) return;

    await handleAsyncOperation(
      () => clientService.delete(user.uid, deleteModal.item!.id),
      {
        successMessage: "Cliente eliminado exitosamente",
        errorMessage: "Error al eliminar cliente",
        onSuccess: () => deleteModal.close(),
      }
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando clientes..." />;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Clientes
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Administra tu cartera de clientes
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
          />
        </div>
        <button
          onClick={formModal.openNew}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <UserPlus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-blue-600">{clients.length}</span>{" "}
          {clients.length === 1 ? "cliente" : "clientes"} registrados
        </p>
      </div>

      <ClientTable
        clients={clients}
        onEdit={formModal.openEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
      />

      <ClientForm
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        onSubmit={formModal.editingItem ? handleUpdate : handleCreate}
        initialData={formModal.editingItem}
        title={formModal.editingItem ? "Editar Cliente" : "Nuevo Cliente"}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Eliminar cliente"
        message={`¿Estás seguro de que quieres eliminar al cliente "${deleteModal.item?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
