"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Download, Briefcase } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { catalogService } from "@/services/catalog.refactored";
import { CatalogItem, BusinessSettings, CatalogItemType } from "@/types";
import CatalogItemForm from "@/components/dashboard/CatalogItemForm";
import CatalogItemTable from "@/components/dashboard/CatalogItemTable";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  useFirestoreCollection,
  useFormModal,
  useDeleteConfirmation,
} from "@/hooks";
import { handleAsyncOperation } from "@/lib/errorHandler";
import { LoadingSpinner } from "@/components/ui";
import StatsCard from "@/components/ui/StatsCard";

export default function CatalogPage() {
  const { user } = useAuth();
  const { data: catalogItems, loading } = useFirestoreCollection(
    catalogService,
    user?.uid
  );
  const formModal = useFormModal<CatalogItem>();
  const deleteModal = useDeleteConfirmation<CatalogItem>();
  const [enabledTypes, setEnabledTypes] = useState<CatalogItemType[]>([
    "service",
  ]);

  useEffect(() => {
    if (!user) return;

    // Load business settings to get enabled catalog types
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as BusinessSettings;
          setEnabledTypes(data.enabledCatalogTypes || ["service"]);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, [user]);

  const handleDelete = async (itemId: string) => {
    const item = catalogItems.find((c) => c.id === itemId);
    if (item) {
      deleteModal.confirm(item);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteModal.item) return;

    await handleAsyncOperation(
      () => catalogService.delete(user.uid, deleteModal.item!.id),
      {
        successMessage: "Ítem eliminado exitosamente",
        errorMessage: "Error al eliminar el ítem",
        onSuccess: () => deleteModal.close(),
      }
    );
  };

  const storableCount = catalogItems.filter(
    (item) => item.type === "storable"
  ).length;
  const digitalCount = catalogItems.filter(
    (item) => item.type === "digital"
  ).length;
  const serviceCount = catalogItems.filter(
    (item) => item.type === "service"
  ).length;

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando catálogo..." />;
  }

  return (
    <div className="p-4 sm:p-0 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Catálogo
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gestiona tus productos, servicios y contenido digital
          </p>
        </div>
        <button
          onClick={formModal.openNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Nuevo Ítem</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {enabledTypes.includes("storable") && (
          <StatsCard
            label="Almacenables"
            value={storableCount}
            icon={Package}
            color="green"
          />
        )}

        {enabledTypes.includes("digital") && (
          <StatsCard
            label="Digitales"
            value={digitalCount}
            icon={Download}
            color="purple"
          />
        )}

        {enabledTypes.includes("service") && (
          <StatsCard
            label="Servicios"
            value={serviceCount}
            icon={Briefcase}
            color="blue"
          />
        )}
      </div>

      <CatalogItemTable
        items={catalogItems}
        onEdit={formModal.openEdit}
        onDelete={handleDelete}
      />

      <CatalogItemForm
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        itemToEdit={formModal.editingItem}
        enabledTypes={enabledTypes}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
        title="Eliminar ítem"
        message={`¿Estás seguro de que quieres eliminar el ítem "${deleteModal.item?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
