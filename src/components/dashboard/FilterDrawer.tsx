import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Search } from "lucide-react";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        searchTerm: string;
        dateFrom: string;
        dateTo: string;
        status: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    onSetThisMonth: () => void;
}

export default function FilterDrawer({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearFilters,
    onSetThisMonth,
}: FilterDrawerProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-lg font-medium text-gray-900">
                                                    Filtros
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute -inset-2.5" />
                                                        <span className="sr-only">Cerrar panel</span>
                                                        <X className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            <div className="space-y-6">
                                                {/* Search */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Búsqueda
                                                    </label>
                                                    <div className="relative rounded-md shadow-sm">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                            <Search
                                                                className="h-5 w-5 text-gray-400"
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                                                            placeholder="Cliente, servicio..."
                                                            value={filters.searchTerm}
                                                            onChange={(e) =>
                                                                onFilterChange("searchTerm", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Estado
                                                    </label>
                                                    <select
                                                        value={filters.status}
                                                        onChange={(e) =>
                                                            onFilterChange("status", e.target.value)
                                                        }
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
                                                    >
                                                        <option value="all">Todos los estados</option>
                                                        <option value="pending">Pendiente</option>
                                                        <option value="confirmed">Confirmado</option>
                                                        <option value="completed">Completado</option>
                                                        <option value="cancelled">Cancelado</option>
                                                    </select>
                                                </div>

                                                {/* Date Range */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Rango de Fechas
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Desde
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={filters.dateFrom}
                                                                onChange={(e) =>
                                                                    onFilterChange("dateFrom", e.target.value)
                                                                }
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500 mb-1">
                                                                Hasta
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={filters.dateTo}
                                                                onChange={(e) =>
                                                                    onFilterChange("dateTo", e.target.value)
                                                                }
                                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border py-2 px-3"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={onSetThisMonth}
                                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    >
                                                        Este mes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-shrink-0 justify-end px-4 py-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                onClick={onClearFilters}
                                            >
                                                Limpiar Filtros
                                            </button>
                                            <button
                                                type="button"
                                                className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                onClick={onClose}
                                            >
                                                Ver Resultados
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
