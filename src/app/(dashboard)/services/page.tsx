"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Download, Briefcase } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeToCatalog, deleteCatalogItem } from "@/services/catalog";
import { CatalogItem, BusinessSettings, CatalogItemType } from "@/types";
import CatalogItemForm from "@/components/dashboard/CatalogItemForm";
import CatalogItemTable from "@/components/dashboard/CatalogItemTable";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function CatalogPage() {
  const { user } = useAuth();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState<CatalogItemType[]>([
    "service",
  ]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

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

    const unsubscribe = subscribeToCatalog(user.uid, (data) => {
      setCatalogItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (itemId: string) => {
    const item = catalogItems.find(c => c.id === itemId);
    if (item) {
      setItemToDelete(item);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;

    try {
      await deleteCatalogItem(user.uid, itemToDelete.id);
      toast.success("Ítem eliminado exitosamente");
      setItemToDelete(null);
    } catch (error) {
      console.error("Error al eliminar ítem:", error);
      toast.error("Error al eliminar el ítem");
    }
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
          onClick={() => setIsFormOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>Nuevo Ítem</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {enabledTypes.includes("storable") && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">
                  Almacenables
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {storableCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {enabledTypes.includes("digital") && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Digitales</p>
                <p className="text-2xl font-bold text-purple-900">
                  {digitalCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {enabledTypes.includes("service") && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Servicios</p>
                <p className="text-2xl font-bold text-blue-900">
                  {serviceCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <CatalogItemTable items={catalogItems} onEdit={handleEdit} onDelete={handleDelete} />

      <CatalogItemForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        itemToEdit={editingItem}
        enabledTypes={enabledTypes}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar ítem"
        message={`¿Estás seguro de que quieres eliminar el ítem "${itemToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
