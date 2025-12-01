"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  subscribeToCollaborators,
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from "@/services/collaborator";
import { Collaborator } from "@/types";
import CollaboratorTable from "@/components/dashboard/CollaboratorTable";
import CollaboratorForm from "@/components/dashboard/CollaboratorForm";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

export default function CollaboratorsPage() {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [collaboratorToDelete, setCollaboratorToDelete] =
    useState<Collaborator | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToCollaborators(user.uid, (data) => {
        setCollaborators(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCreate = async (
    data: Omit<Collaborator, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;
    try {
      await createCollaborator(user.uid, data);
      setIsFormOpen(false);
      toast.success("Colaborador creado exitosamente");
    } catch (error) {
      console.error("Error al crear colaborador:", error);
      toast.error("Error al crear colaborador");
    }
  };

  const handleUpdate = async (
    data: Omit<Collaborator, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user || !editingCollaborator) return;
    try {
      await updateCollaborator(user.uid, editingCollaborator.id, data);
      setIsFormOpen(false);
      setEditingCollaborator(null);
      toast.success("Colaborador actualizado exitosamente");
    } catch (error) {
      console.error("Error al actualizar colaborador:", error);
      toast.error("Error al actualizar colaborador");
    }
  };

  const handleDelete = async () => {
    if (!user || !collaboratorToDelete) return;
    try {
      await deleteCollaborator(user.uid, collaboratorToDelete.id);
      setIsDeleteModalOpen(false);
      setCollaboratorToDelete(null);
      toast.success("Colaborador eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar colaborador:", error);
      toast.error("Error al eliminar colaborador");
    }
  };

  const handleEdit = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (collaboratorId: string) => {
    const collaborator = collaborators.find((c) => c.id === collaboratorId);
    if (collaborator) {
      setCollaboratorToDelete(collaborator);
      setIsDeleteModalOpen(true);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCollaborator(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Colaboradores
            </h1>
            <p className="text-gray-600">
              Gestiona tu equipo de colaboradores y sus configuraciones de pago
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="font-medium">Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Colaboradores
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {collaborators.length}
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar colaboradores por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Table */}
      <CollaboratorTable
        collaborators={collaborators}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        searchTerm={searchTerm}
      />

      {/* Form Modal */}
      <CollaboratorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingCollaborator ? handleUpdate : handleCreate}
        initialData={editingCollaborator}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Colaborador"
        message={`¿Estás seguro de que quieres eliminar a ${collaboratorToDelete?.name || 'este colaborador'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
