"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  subscribeToClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/services/client";
import { Client } from "@/types";
import ClientForm from "@/components/dashboard/ClientForm";
import ClientTable from "@/components/dashboard/ClientTable";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { toast } from "sonner";

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToClients(user.uid, (updatedClients) => {
      setClients(updatedClients);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreate = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;

    try {
      await createClient(user.uid, clientData);
      toast.success("Cliente creado exitosamente");
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear cliente");
      throw error;
    }
  };

  const handleUpdate = async (
    clientData: Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user || !editingClient) return;

    try {
      await updateClient(user.uid, editingClient.id, clientData);
      toast.success("Cliente actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      toast.error("Error al actualizar cliente");
      throw error;
    }
  };

  const handleDelete = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientToDelete(client);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !clientToDelete) return;

    try {
      await deleteClient(user.uid, clientToDelete.id);
      toast.success("Cliente eliminado exitosamente");
      setClientToDelete(null);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar cliente");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
          onClick={() => setIsFormOpen(true)}
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
      />

      <ClientForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingClient ? handleUpdate : handleCreate}
        initialData={editingClient}
        title={editingClient ? "Editar Cliente" : "Nuevo Cliente"}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar cliente"
        message={`¿Estás seguro de que quieres eliminar al cliente "${clientToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
