"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, Phone, Mail, DollarSign, Calendar } from "lucide-react";
import { Collaborator } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CollaboratorTableProps {
  collaborators: Collaborator[];
  onEdit: (collaborator: Collaborator) => void;
  onDelete: (collaboratorId: string) => void;
  searchTerm?: string;
}

export default function CollaboratorTable({
  collaborators,
  onEdit,
  onDelete,
  searchTerm = "",
}: CollaboratorTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredCollaborators = collaborators.filter((collaborator) => {
    const search = searchTerm.toLowerCase();
    return (
      collaborator.name.toLowerCase().includes(search) ||
      collaborator.email?.toLowerCase().includes(search) ||
      collaborator.phone?.includes(search)
    );
  });

  const handleDelete = async (collaboratorId: string) => {
    setDeletingId(collaboratorId);
    try {
      await onDelete(collaboratorId);
    } catch (error) {
      console.error("Error al eliminar colaborador:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (filteredCollaborators.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg">
          {searchTerm
            ? "No se encontraron colaboradores"
            : "No hay colaboradores registrados"}
        </p>
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {filteredCollaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-lg">
                    {collaborator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {collaborator.name}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Calendar size={12} className="mr-1" />
                    {format(new Date(collaborator.createdAt), "dd MMM yyyy", {
                      locale: es,
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3 space-y-2">
              {collaborator.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400" />
                  {collaborator.phone}
                </div>
              )}
              {collaborator.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  {collaborator.email}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => onEdit(collaborator)}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit size={16} className="inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => handleDelete(collaborator.id)}
                disabled={deletingId === collaborator.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deletingId === collaborator.id ? (
                  "Eliminando..."
                ) : (
                  <>
                    <Trash2 size={16} className="inline mr-1" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCollaborators.map((collaborator) => (
              <tr key={collaborator.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {collaborator.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Desde {format(new Date(collaborator.createdAt), "dd MMM yyyy", { locale: es })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {collaborator.phone && (
                      <div className="flex items-center mb-1">
                        <Phone size={14} className="mr-2 text-gray-400" />
                        {collaborator.phone}
                      </div>
                    )}
                    {collaborator.email && (
                      <div className="flex items-center">
                        <Mail size={14} className="mr-2 text-gray-400" />
                        {collaborator.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(collaborator)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                      title="Editar colaborador"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(collaborator.id)}
                      disabled={deletingId === collaborator.id}
                      className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar colaborador"
                    >
                      {deletingId === collaborator.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
