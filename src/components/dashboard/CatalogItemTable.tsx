"use client";

import { useState, useEffect } from "react";
import {
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Eye,
  Package,
  Download,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { CatalogItem, CatalogItemType } from "@/types";
import { deleteCatalogItem } from "@/services/catalog";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface CatalogItemTableProps {
  items: CatalogItem[];
  onEdit: (item: CatalogItem) => void;
}

export default function CatalogItemTable({
  items,
  onEdit,
}: CatalogItemTableProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "storable" | "digital" | "service"
  >("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
      try {
        await deleteCatalogItem(user.uid, id);
        toast.success("Ítem eliminado exitosamente");
      } catch (error) {
        console.error("Error deleting catalog item:", error);
        toast.error("Error al eliminar el ítem");
      }
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "storable":
        return <Package className="w-4 h-4" />;
      case "digital":
        return <Download className="w-4 h-4" />;
      case "service":
        return <Briefcase className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      storable: "bg-green-100 text-green-800",
      digital: "bg-purple-100 text-purple-800",
      service: "bg-blue-100 text-blue-800",
    };
    const labels = {
      storable: "Almacenable",
      digital: "Digital",
      service: "Servicio",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          badges[type as keyof typeof badges]
        }`}
      >
        {getTypeIcon(type)}
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const isLowStock = (item: CatalogItem) => {
    return (
      item.type === "storable" &&
      item.stock !== undefined &&
      item.minStock !== undefined &&
      item.stock <= item.minStock
    );
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <input
            type="text"
            placeholder="Buscar ítems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
          />

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "storable", "digital", "service"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                                    ${
                                      filterType === type
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }
                                `}
              >
                {type === "all"
                  ? "Todos"
                  : type === "storable"
                  ? "Almacenables"
                  : type === "digital"
                  ? "Digitales"
                  : "Servicios"}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No se encontraron ítems</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div
                className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 cursor-pointer"
                onClick={() => router.push(`/services/${item.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {item.name}
                  </h3>
                  {getTypeBadge(item.type)}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {isLowStock(item) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Stock bajo
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Precio</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Type-specific info */}
                  {item.type === "storable" && item.stock !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="text-lg font-bold text-gray-900">
                          {item.stock} {item.unit || "u"}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.type === "digital" && item.format && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Download size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Formato</p>
                        <p className="text-sm font-bold text-gray-900">
                          {item.format}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.type === "service" && item.duration && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duración</p>
                        <p className="text-lg font-bold text-gray-900">
                          {item.duration} min
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional info for storable */}
                {item.type === "storable" && item.sku && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      SKU:{" "}
                      <span className="font-mono text-gray-900">
                        {item.sku}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/services/${item.id}`);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <input
          type="text"
          placeholder="Buscar ítems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
        />

        <div className="flex gap-2">
          {(
            ["all", "storable", "digital", "service"] as (
              | "all"
              | CatalogItemType
            )[]
          ).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as "all" | CatalogItemType)}
              className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${
                                  filterType === type
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }
                            `}
            >
              {type === "all"
                ? "Todos"
                : type === "storable"
                ? "Almacenables"
                : type === "digital"
                ? "Digitales"
                : "Servicios"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detalles
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No se encontraron ítems
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isLowStock(item) && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                        {item.type === "storable" && item.sku && (
                          <div className="text-xs text-gray-400 font-mono">
                            SKU: {item.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(item.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign size={16} className="text-gray-400 mr-1" />
                      {item.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.type === "storable" && item.stock !== undefined && (
                      <div className="text-sm text-gray-900">
                        Stock:{" "}
                        <span className="font-semibold">{item.stock}</span>{" "}
                        {item.unit || "u"}
                      </div>
                    )}
                    {item.type === "digital" && item.format && (
                      <div className="text-sm text-gray-900">
                        {item.format} {item.fileSize && `(${item.fileSize})`}
                      </div>
                    )}
                    {item.type === "service" && item.duration && (
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock size={16} className="text-gray-400 mr-1" />
                        {item.duration} min
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/services/${item.id}`)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 hover:bg-yellow-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
